"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "./LocaleProvider";

interface SpiritPanelProps {
  castId: string;
  hexagramName: string;
  hexagramFullName: string;
  /** locale-aware display title (e.g. English name in en); defaults to fullName */
  hexagramTitle?: string;
  question: string;
  guaCi: string;
  tuan: string;
  xiangOverall: string;
  changingLines: number[];
  changedHexagramName?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function SpiritPanel(props: SpiritPanelProps) {
  const { t, locale } = useLocale();
  const sp = t.spirit;
  const title = props.hexagramTitle ?? props.hexagramFullName;

  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "active" | "ended">("idle");
  const [remaining, setRemaining] = useState(8);
  const [expiresAt, setExpiresAt] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (!expiresAt || status !== "active") return;
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(sp.timedOut);
        setStatus("ended");
        clearInterval(interval);
      } else {
        const min = Math.floor(diff / 60000);
        const sec = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${min}:${sec.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, status, sp.timedOut]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSession = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spirit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          castId: props.castId,
          hexagramName: props.hexagramName,
          hexagramFullName: props.hexagramFullName,
          question: props.question,
          guaCi: props.guaCi,
          tuan: props.tuan,
          xiangOverall: props.xiangOverall,
          changingLines: props.changingLines,
          changedHexagramName: props.changedHexagramName,
          locale,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.session.sessionId);
        setStatus("active");
        setRemaining(data.session.remainingRounds);
        setExpiresAt(data.session.expiresAt);
        setMessages([{ role: "assistant", content: data.openingMessage }]);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !sessionId || status !== "active") return;
    const msg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/spirit/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: msg, locale }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        setRemaining(data.remainingRounds);
        if (data.status !== "active") setStatus("ended");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? sp.replyFailed }]);
        if (data.status) setStatus("ended");
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: sp.networkError }]);
    }
    setLoading(false);
  };

  const endSpiritSession = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch("/api/spirit/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, locale }),
      });
      const data = await res.json();
      if (data.farewell) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.farewell }]);
      }
    } catch {
      /* ignore */
    }
    setStatus("ended");
  };

  if (status === "idle") {
    return (
      <section>
        <button
          onClick={startSession}
          disabled={loading}
          className="w-full py-4 rounded-lg font-medium text-base border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white active:scale-[0.98] transition-all"
        >
          {loading ? sp.summoning : `${sp.summon} · ${title}`}
          <span className="block text-xs font-normal opacity-60 mt-0.5">{sp.subtitle}</span>
        </button>
      </section>
    );
  }

  return (
    <section className="border border-[var(--border)] rounded">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">
            {sp.header} · {title}
          </h2>
          {status === "active" && (
            <span className="text-xs text-[var(--muted)]">
              {timeLeft} | {sp.roundsLeft(remaining)}
            </span>
          )}
          {status === "ended" && <span className="text-xs text-[var(--muted)]">{sp.ended}</span>}
        </div>
        {status === "active" && (
          <button onClick={endSpiritSession} className="text-xs text-[var(--muted)] hover:text-red-600">
            {sp.endChat}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="overflow-y-auto px-4 py-3 space-y-4" style={{ maxHeight: "32rem" }}>
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`text-sm leading-7 rounded-lg px-4 py-3 inline-block text-left ${
                m.role === "user" ? "bg-[#1a1a1a] text-white" : "bg-gray-100 text-[var(--foreground)]"
              }`}
              style={{
                maxWidth: "90%",
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {status === "active" && (
        <div className="flex gap-2 px-4 py-3 border-t border-[var(--border)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && sendMessage()}
            placeholder={sp.placeholder}
            maxLength={300}
            disabled={loading}
            className="flex-1 border border-[var(--border)] rounded px-3 py-1.5 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-1.5 bg-[#1a1a1a] text-white rounded text-sm disabled:opacity-50"
          >
            {loading ? "…" : sp.send}
          </button>
        </div>
      )}
    </section>
  );
}
