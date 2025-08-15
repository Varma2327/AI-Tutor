// src/components/UploadBox.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function UploadBox() {
  const router = useRouter();
  const search = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Auto-open file dialog if /?upload=1
  useEffect(() => {
    if (search.get("upload") === "1") {
      setTimeout(() => inputRef.current?.click(), 50);
    }
  }, [search]);

  async function handleFile(file: File) {
    setErr(null);
    if (!file || file.type !== "application/pdf") {
      setErr("Please choose a PDF file.");
      return;
    }
    setBusy(true);
    try {
      // 1) Upload to Vercel Blob via your API
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch("/api/blob/upload-url", { method: "POST", body: fd });
      if (!up.ok) {
        const t = await up.text();
        throw new Error(`Upload failed (${up.status}): ${t || up.statusText}`);
      }
      const uploaded = await up.json().catch(() => ({}));
      const blobUrl =
        uploaded.url ||
        uploaded.pathname ||
        uploaded.blob?.url ||
        uploaded.publicUrl ||
        null;

      if (!blobUrl) throw new Error("Upload succeeded but no blob URL returned.");

      // 2) Extract text + save doc via your API
      const ex = await fetch("/api/pdf/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl, title: file.name }),
      });

      if (!ex.ok) {
        const t = await ex.text();
        throw new Error(`Extract failed (${ex.status}): ${t || ex.statusText}`);
      }

      const { documentId } = await ex.json();
      if (!documentId) throw new Error("No documentId returned.");

      // 3) Go to split view
      router.push(`/doc/${documentId}`);
    } catch (e: any) {
      setErr(e?.message || "Upload failed.");
      setBusy(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`card p-8 text-center transition
          ${dragOver ? "ring-2 ring-brand-500/60" : "ring-0"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={onInputChange}
          disabled={busy}
        />
        <div className="text-2xl font-semibold mb-2">Upload a PDF</div>
        <div className="text-gray-600 dark:text-gray-300 mb-6">
          Drag & drop your file here, or click the button below.
        </div>
        <button
          className="btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : "Choose PDF"}
        </button>
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
        We’ll store the PDF in Vercel Blob and index it for chat with page citations.
      </p>
    </div>
  );
}
