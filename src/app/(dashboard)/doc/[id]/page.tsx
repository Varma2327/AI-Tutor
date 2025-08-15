"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const PdfViewer = dynamic(() => import("@/components/PdfViewer"), { ssr: false });
const ChatPanel = dynamic(() => import("@/components/ChatPanel"), { ssr: false });

type Doc = { id: string; title: string; blobUrl: string; pageCount: number };

export default function DocPage() {
  const params = useParams<{ id: string }>();
  const documentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [doc, setDoc] = useState<Doc | null>(null);

  useEffect(() => {
    if (!documentId) return;
    (async () => {
      const res = await fetch(`/api/docs/${documentId}`, { cache: "no-store" });
      if (res.ok) setDoc(await res.json());
    })();
  }, [documentId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 h-[calc(100vh-64px)]">
      <div className="border-r overflow-auto">
        {doc ? (
          <PdfViewer fileUrl={doc.blobUrl} />
        ) : (
          <div className="p-4">Loading PDF…</div>
        )}
      </div>
      <div className="overflow-hidden">
        {documentId ? (
          <ChatPanel documentId={documentId} />
        ) : (
          <div className="p-4">Loading chat…</div>
        )}
      </div>
    </div>
  );
}
