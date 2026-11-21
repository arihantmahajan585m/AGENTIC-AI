"use client";

import { useEffect, useRef, useState } from "react";
import type { Store } from "@/lib/types";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
};

const SUGGESTIONS = [
  "Why was the MongoDB database switch halted?",
  "How does the Reminder Safety Brake work?",
  "What is the Blast Radius of slipping the launch date?",
  "How do I add real Google Sign-In with OAuth?",
];

function formatTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

export function AiChatbox({ store }: { store?: Store | null }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "m-welcome",
      role: "assistant",
      content:
        "👋 Hi! I am the **Nirgrantha AI Copilot**, powered by **Gemini**.\n\nI have full visibility into your **cross-meeting memory ledger**, **pending contradictions**, and **held reminders**. Ask me anything about your meetings, why certain decisions were halted, or how the 7-agent pipeline works!",
      time: formatTime(),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
          store,
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || "Sorry, I couldn't process that question right now.";

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: replyContent,
        time: formatTime(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Network error communicating with Gemini. Please try again.",
          time: formatTime(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    // Basic markdown parsing for bold, code spans, and bullet points
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.slice(2)) }} />
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line.replace(/^\d+\.\s/, "")) }} />
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p
          key={idx}
          className="text-xs leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code class='bg-black/10 px-1 py-0.5 rounded font-mono text-[11px]'>$1</code>");
  };

  return (
    <div className="fixed bottom-14 right-5 z-50">
      {/* Floating Trigger Button - Attractive Warm Glowing Gradient */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative flex items-center gap-3 rounded-full border border-amber-300/80 bg-gradient-to-r from-amber-50 via-white to-amber-100/90 px-4 py-2.5 text-ink shadow-[0_10px_35px_rgb(217,119,6,0.22)] ring-1 ring-amber-400/40 transition-all duration-300 hover:scale-105 hover:shadow-[0_14px_45px_rgb(217,119,6,0.32)] hover:border-amber-500 focus:outline-hidden"
          title="Ask Nirgrantha AI Copilot"
        >
          {/* Glowing Animated Sparkle Badge */}
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-md group-hover:rotate-12 transition-transform">
            <span className="text-sm">✨</span>
            <span className="absolute -inset-1 rounded-full bg-amber-400 opacity-30 blur-xs animate-ping" />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-bold text-ink tracking-tight group-hover:text-amber-800 transition-colors">
                Ask AI Copilot
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-300 px-2 py-0.2 text-[9px] font-bold text-emerald-800 tracking-wider font-mono shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                GEMINI
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#5c4a38] leading-tight mt-0.5">
              Solve doubts & explain decisions
            </p>
          </div>
        </button>
      )}

      {/* Floating Chat Drawer */}
      {open && (
        <div className="flex h-[560px] w-[370px] sm:w-[410px] flex-col rounded-3xl border border-amber-200/80 bg-white shadow-[0_20px_60px_rgb(0,0,0,0.18)] overflow-hidden animate-fadeIn text-ink">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-200/60 bg-gradient-to-r from-amber-50 via-white to-amber-100/60 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white text-sm shadow-sm font-bold">
                ✨
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-serif text-base font-bold text-ink">Nirgrantha Copilot</h4>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-400 px-2 py-0.2 text-[9px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Gemini Live
                  </span>
                </div>
                <p className="text-[10px] text-mute font-medium">Meeting Governance & Pipeline Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setMessages([
                    {
                      id: "m-reset",
                      role: "assistant",
                      content: "Conversation cleared. How can I help you today?",
                      time: formatTime(),
                    },
                  ])
                }
                className="rounded-full px-2.5 py-1 text-[11px] font-medium text-mute hover:bg-black/5 hover:text-ink transition-colors"
                title="Clear chat"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-mute hover:bg-black/5 hover:text-ink text-sm transition-colors"
                title="Close chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#faf8f5]">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl p-3 shadow-xs ${
                      isUser
                        ? "bg-gradient-to-r from-amber-700 to-amber-800 text-white font-medium rounded-br-xs"
                        : "bg-white border border-amber-200/60 text-ink rounded-bl-xs"
                    }`}
                  >
                    <div className="space-y-1">{renderContent(m.content)}</div>
                  </div>
                  <span className="mt-1 text-[9px] text-mute px-1 font-mono">{m.time}</span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-amber-800 p-2 font-medium">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 text-[10px] animate-spin">
                  ✦
                </span>
                <span>Gemini is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="border-t border-amber-200/50 bg-amber-50/40 px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1.5">
                Suggested Doubts
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSend(s)}
                    className="rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium text-ink hover:border-amber-600 hover:text-amber-800 transition-all text-left truncate max-w-full shadow-2xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="border-t border-amber-200/60 bg-white p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a doubt about decisions or agents..."
                className="flex-1 rounded-2xl border border-amber-200 bg-neutral-50/70 px-3.5 py-2 text-xs text-ink placeholder:text-neutral-400 focus:border-amber-500 focus:bg-white focus:outline-hidden transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-sm disabled:opacity-40 transition-opacity hover:brightness-105"
              >
                ➔
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
