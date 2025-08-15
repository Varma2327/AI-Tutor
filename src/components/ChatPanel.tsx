// src/components/ChatPanel.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { id: string; role: "user" | "assistant" | "system"; content: string };

export default function ChatPanel({ documentId }: { documentId: string }) {
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsOn, setTtsOn] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Ensure a chat session, then load history
  useEffect(() => {
    if (!documentId) return;
    (async () => {
      try {
        const r = await fetch(`/api/ensure-session?documentId=${documentId}`, { cache: "no-store" });
        const { chatSessionId } = await r.json();
        setChatSessionId(chatSessionId);

        // Load existing history
        const h = await fetch(`/api/chat/history?chatSessionId=${chatSessionId}`, { cache: "no-store" });
        const j = await h.json().catch(() => ({ messages: [] }));
        setMessages(Array.isArray(j.messages) ? j.messages : []);
      } catch (_) {}
    })();
  }, [documentId]);

  // Browser TTS
  function speak(text: string) {
    try {
      if (!ttsOn) return;
      const u = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {}
  }

  // Browser STT (webkitSpeechRecognition)
  function startSTT() {
    // @ts-ignore
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    // @ts-ignore
    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.onresult = (e: any) => {
      const said = e.results?.[0]?.[0]?.transcript ?? "";
      if (said) setInput((prev) => (prev ? prev + " " + said : said));
    };
    recog.start();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !chatSessionId) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const payload = {
        documentId,
        chatSessionId,
        messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: text,
      };

      setMessages((m) => [...m, assistantMsg]);

      // Try to parse the last JSON line for PDF actions
      const maybeJsonLine = text.trim().split("\n").reverse().find((l) => l.trim().startsWith("{") && l.trim().endsWith("}"));
      if (maybeJsonLine) {
        try {
          const actions = JSON.parse(maybeJsonLine);
          window.postMessage({ type: "ai-actions", payload: actions }, "*");
        } catch {}
      }

      speak(assistantMsg.content.replace(/\{.*\}$/s, "").trim());
    } catch (err) {
      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, something went wrong while generating a response.",
      };
      setMessages((m) => [...m, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-full grid grid-rows-[1fr_auto]">
      {/* Messages */}
      <div ref={listRef} className="overflow-auto p-4 space-y-3 bg-white/40 dark:bg-white/5">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2
                ${m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-white/80 dark:bg-white/5 border border-gray-200/70 dark:border-white/10"}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-sm text-gray-500 dark:text-gray-400">Thinking…</div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={onSubmit} className="border-t border-gray-200/70 dark:border-white/10 p-3 flex gap-2 bg-white/70 dark:bg-black/20">
        <button
          type="button"
          className="btn-ghost"
          onClick={startSTT}
          title="Voice input"
        >
          🎤
        </button>
        <button
          type="button"
          className={`btn-ghost ${ttsOn ? "bg-black text-white dark:bg-white dark:text-black" : ""}`}
          onClick={() => setTtsOn((s) => !s)}
          title="Toggle voice"
        >
          🔊
        </button>
        <input
          className="input flex-1"
          placeholder="Ask about the PDF…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="btn" disabled={!chatSessionId || isLoading || input.trim() === ""}>
          Send
        </button>
      </form>
    </div>
  );
}
