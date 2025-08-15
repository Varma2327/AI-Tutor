"use client";
import { useRef, useState } from "react";

export default function VoiceControls({ onTranscript }: { onTranscript: (t: string) => void }) {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [rec, setRec] = useState(false);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mediaRef.current = mr; chunksRef.current = [];
    mr.ondataavailable = e => chunksRef.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("file", blob, "speech.webm");
      const res = await fetch("/api/speech-to-text", { method: "POST", body: form });
      const { text } = await res.json();
      onTranscript(text);
      fetch("/api/text-to-speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) })
        .then(r => r.arrayBuffer())
        .then(buf => new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }))).play());
    };
    mr.start(); setRec(true);
  }
  function stop() { mediaRef.current?.stop(); setRec(false); }

  return (
    <div className="p-2 flex gap-2">
      {!rec
        ? <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={start}>🎙️ Start</button>
        : <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={stop}>⏹ Stop</button>}
    </div>
  );
}
