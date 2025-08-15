// src/components/PdfViewer.tsx
"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useEffect, useRef, useState } from "react";

// Use a CDN worker that matches the installed pdf.js version
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PdfViewer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (!e?.data || e.data.type !== "ai-actions") return;
      const { gotoPage, highlights, circles } = e.data.payload || {};

      // Scroll to page
      if (gotoPage) scrollToPage(gotoPage);

      // Clear old overlays
      clearOverlays();

      // Apply highlights
      if (Array.isArray(highlights)) {
        highlights.slice(0, 2).forEach((h: any) => highlightQuote(h.page, String(h.quote || "")));
      }

      // Apply circles
      if (Array.isArray(circles)) {
        circles.slice(0, 2).forEach((c: any) => circleQuote(c.page, String(c.quote || "")));
      }
    }

    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function scrollToPage(page: number) {
    const host = containerRef.current;
    if (!host) return;
    const el = host.querySelector<HTMLElement>(`[data-page-number="${page}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function clearOverlays() {
    const host = containerRef.current;
    if (!host) return;
    host.querySelectorAll(".__ai-overlay").forEach((el) => el.remove());
    host.querySelectorAll(".__ai-hl").forEach((el) => el.classList.remove("__ai-hl"));
  }

  // crude match: find spans on that page containing tokens from the quote, tint them
  function highlightQuote(page: number, quote: string) {
    const host = containerRef.current;
    if (!host || !quote) return;

    const el = host.querySelector<HTMLElement>(`[data-page-number="${page}"]`);
    if (!el) return;

    // wait for text layer to render
    const tryHighlight = () => {
      const textLayer = el.querySelector(".textLayer");
      if (!textLayer) {
        setTimeout(tryHighlight, 120);
        return;
      }

      const tokens = quote.trim().split(/\s+/).filter(Boolean).slice(0, 5).map(t => t.toLowerCase());
      if (!tokens.length) return;

      const spans = Array.from(textLayer.querySelectorAll("span"));
      let matched = 0;

      spans.forEach((s) => {
        const t = s.textContent?.toLowerCase() || "";
        if (tokens.some((tok) => t.includes(tok))) {
          s.classList.add("__ai-hl");
          (s as HTMLElement).style.background = "rgba(255,215,0,.45)";
          (s as HTMLElement).style.borderRadius = "4px";
          matched++;
        }
      });

      if (matched > 0) {
        // ensure the first matched span is centered
        const first = spans.find((s) => s.classList.contains("__ai-hl"));
        if (first) first.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    tryHighlight();
  }

  // draw a red circle around the first span that matches the quote tokens
  function circleQuote(page: number, quote: string) {
    const host = containerRef.current;
    if (!host || !quote) return;

    const el = host.querySelector<HTMLElement>(`[data-page-number="${page}"]`);
    if (!el) return;

    const placeCircle = () => {
      const textLayer = el.querySelector(".textLayer") as HTMLElement | null;
      if (!textLayer) {
        setTimeout(placeCircle, 120);
        return;
      }

      const tokens = quote.trim().split(/\s+/).filter(Boolean).slice(0, 5).map(t => t.toLowerCase());
      const spans = Array.from(textLayer.querySelectorAll("span")) as HTMLElement[];

      const target = spans.find((s) => {
        const t = s.textContent?.toLowerCase() || "";
        return tokens.some((tok) => t.includes(tok));
      });

      if (!target) return;

      const pageRect = el.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const hostRect = host.getBoundingClientRect();

      // position relative to page container
      const top = rect.top - pageRect.top + host.scrollTop;
      const left = rect.left - pageRect.left + host.scrollLeft;

      const d = Math.max(rect.width, rect.height) * 2.2;

      const circle = document.createElement("div");
      circle.className = "__ai-overlay";
      Object.assign(circle.style, {
        position: "absolute",
        top: `${top - d * 0.3}px`,
        left: `${left - d * 0.3}px`,
        width: `${d}px`,
        height: `${d}px`,
        border: "3px solid rgba(220,38,38,0.95)",
        borderRadius: "9999px",
        pointerEvents: "none",
        boxShadow: "0 0 0 2px rgba(220,38,38,0.25)",
        zIndex: "50",
      } as CSSStyleDeclaration);

      // mount overlay inside the page wrapper (which is relative)
      const wrapper = el as HTMLElement;
      wrapper.style.position = wrapper.style.position || "relative";
      wrapper.appendChild(circle);

      target.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    placeCircle();
  }

  return (
    <div ref={containerRef} className="h-full overflow-auto p-4">
      <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} data-page-number={i + 1} className="mb-6 relative mx-auto max-w-[840px]">
            <div className="rounded-xl overflow-hidden border border-gray-200/70 dark:border-white/10 shadow-soft bg-white dark:bg-white/5">
              <Page
                pageNumber={i + 1}
                width={820}
                renderTextLayer
                renderAnnotationLayer={false}
              />
            </div>
          </div>
        ))}
      </Document>
    </div>
  );
}
