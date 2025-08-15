"use client";
import { useState } from "react";

export function usePdfAnnotations() {
  const [currentPage, _setPage] = useState(1);

  const [circles, setCircles] = useState<{ items: any[]; add: (page: number, r: any) => void }>({
    items: [],
    add: (page, r) => setCircles(s => ({ ...s, items: [...s.items, { ...r, page }] }))
  });
  const [notes, setNotes] = useState<{ items: any[]; add: (page: number, n: any) => void }>({
    items: [],
    add: (page, n) => setNotes(s => ({ ...s, items: [...s.items, { ...n, page }] }))
  });
  const [highlights, setHighlights] = useState<{ page: number; quote: string }[]>([]);

  function addHighlightByQuote(page: number, quote: string) {
    setHighlights(prev => [...prev, { page, quote }]);
    setTimeout(() => {
      const layer = document.querySelector(".react-pdf__Page__textContent");
      if (layer) (layer as HTMLElement).style.background = "linear-gradient(transparent 49%, rgba(255,235,59,0.5) 50%)";
    }, 50);
  }

  const setCurrentPage = (p: number | ((prev: number) => number)) =>
    _setPage(prev => (typeof p === "function" ? (p as any)(prev) : p));

  return { currentPage, setCurrentPage, highlights, circles, notes, addHighlightByQuote };
}
