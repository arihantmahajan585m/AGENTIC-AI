"use client";

import { useState } from "react";

const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
    iconBg: "bg-emerald-50",
    title: "Speech Repair & Ingest",
    body: "Resolves self-corrections (“Dec 2, no wait, Dec 5”) and strips conversational fillers before anything is extracted. The first number spoken is not the decision.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    iconBg: "bg-amber-50",
    title: "Cross-Meeting Memory",
    body: "Maintains what is still in force across time. The launch date, the budget cap, the database, and pricing stay active until this ledger says otherwise.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    iconBg: "bg-purple-50",
    title: "Conflict Critic & Exceptions",
    body: "Flags genuine contradictions against memory while recognizing scoped exceptions (like ₹3,600 enterprise logos) without raising false alarms.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    iconBg: "bg-rose-50",
    title: "Blast Radius Engine",
    body: "Automatically identifies in-flight work bound to a challenged decision (e.g. Design QA) and maps rewrites before anyone posts to the tracker.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    iconBg: "bg-blue-50",
    title: "Safety Brake on Reminders",
    body: "Intelligently holds deadline reminders for contested tasks. Reminding someone to execute work under challenge is how teams do the wrong thing on time.",
  },
  {
    icon: (
      <svg className="h-5 w-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    iconBg: "bg-teal-50",
    title: "Human Governance Gate",
    body: "Strict human checkpoint. Nothing reaches the tracker, a reminder, or a webhook until you choose to supersede, keep, except, or defer.",
  },
];

const WORKFLOW = [
  { step: "01", title: "Upload / Ingest", subtitle: "Attributed speaker turns & filler stripping" },
  { step: "02", title: "Speech Repair", subtitle: "Self-corrections resolved before extraction" },
  { step: "03", title: "Extract Work", subtitle: "Decisions, owners & deadlines extracted" },
  { step: "04", title: "Memory Ledger", subtitle: "Retrieves active governing decisions" },
  { step: "05", title: "Conflict Critic", subtitle: "Flags contradictions with in-force truth" },
  { step: "06", title: "Blast Radius", subtitle: "Maps affected in-flight tasks & rewrites" },
  { step: "07", title: "Governance Gate", subtitle: "Halts until human confirms before posting" },
];

const TERMS = [
  {
    title: "What this is",
    body: "Nirgrantha is a meetings-to-execution prototype. It reads a transcript, extracts decisions, owners, and deadlines, checks them against decisions already in memory, and stops before anything is posted. It is a working demo, not a production service.",
  },
  {
    title: "You decide what gets posted",
    body: "Tasks, reminders, and webhook deliveries stay unposted until you resolve every conflict and choose to post. A suggestion on screen is not an instruction to your team.",
  },
  {
    title: "Meetings stay on this machine",
    body: "Transcripts you paste or dictate, and the decisions Nirgrantha remembers, are stored locally for this demo. Do not paste a confidential customer call unless you are comfortable with that local record.",
  },
  {
    title: "Voice Integration",
    body: "If you use Speak, your browser’s speech recognition handles the audio. If you dictate with Wispr Flow and paste the result, Wispr Flow’s own terms apply to that step.",
  },
  {
    title: "Demo Personas",
    body: "Priya, Arjun, Meera, Kabir, and Anika are a fictional launch team. Reset demo restores that sample and clears any custom meetings.",
  },
];

export function Welcome({ onEnter }: { onEnter: () => void }) {
  const [agreed, setAgreed] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  return (
    <div className="mx-auto min-h-screen max-w-[1180px] px-4 py-8 md:px-8 md:py-12">
      {/* Top Bar */}
      <header className="flex items-center justify-between border-b border-black/10 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brass text-white text-sm font-bold shadow-sm">
            ⚡
          </span>
          <span className="font-serif text-2xl font-bold tracking-tight text-ink">Nirgrantha</span>
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
            MEETING-TO-EXECUTION AGENT
          </span>
        </div>
        <div className="rounded-full border border-black/10 bg-panel px-3 py-1 text-xs font-medium text-mute shadow-sm">
          Hackathon Demo Prototype
        </div>
      </header>

      {/* Hero Section */}
      <section className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-medium text-emerald-800 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Powered by Cross-Meeting Memory · Conflict Critic · Governance Gate
        </div>

        <h1 className="mt-6 font-serif text-5xl font-bold tracking-tight text-ink md:text-7xl">
          Meeting Decisions <br className="hidden sm:inline" />
          <span className="text-brass">Kept in Force with AI</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-mute md:text-lg">
          Decisions made in meetings get lost. Nirgrantha turns messy speech into attributed actions, remembers what earlier meetings locked, and refuses to post any task that contradicts in-force memory until a human decides.
        </p>

        {/* 4 Stat Cards */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-panel p-3.5 text-center shadow-sm">
            <div className="font-serif text-3xl font-bold text-ink">100%</div>
            <div className="mt-1 text-xs text-mute font-medium">Memory in Force</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-panel p-3.5 text-center shadow-sm">
            <div className="font-serif text-3xl font-bold text-coral">3</div>
            <div className="mt-1 text-xs text-mute font-medium">Conflicts Caught</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-panel p-3.5 text-center shadow-sm">
            <div className="font-serif text-3xl font-bold text-brass">7</div>
            <div className="mt-1 text-xs text-mute font-medium">Agent Stages</div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-panel p-3.5 text-center shadow-sm">
            <div className="font-serif text-3xl font-bold text-emerald-700">0</div>
            <div className="mt-1 text-xs text-mute font-medium">Tasks Leaked</div>
          </div>
        </div>
      </section>

      {/* Feature Grid: Why Nirgrantha? */}
      <section className="mt-20">
        <div className="text-center">
          <h2 className="font-serif text-4xl font-bold text-ink">Why Nirgrantha?</h2>
          <p className="mt-2 text-sm text-mute">Built for launch teams who need certainty, not summaries.</p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item) => (
            <article key={item.title} className="rounded-2xl border border-black/10 bg-panel p-5 shadow-sm transition-all hover:border-black/20">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>
                {item.icon}
              </div>
              <h3 className="mt-4 font-serif text-xl font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-mute">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* How the Agent Works */}
      <section className="mt-20">
        <div className="text-center">
          <h2 className="font-serif text-4xl font-bold text-ink">How the Agent Works</h2>
          <p className="mt-2 text-sm text-mute">A 7-stage deterministic & agentic pipeline operating locally on-device.</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {WORKFLOW.map((item, idx) => (
            <div key={item.step} className="rounded-2xl border border-black/10 bg-panel p-3 text-center shadow-sm flex flex-col justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-brass">{item.step}</span>
                <h4 className="mt-1 font-serif text-sm font-semibold text-ink leading-tight">{item.title}</h4>
              </div>
              <p className="mt-2 text-[10px] leading-tight text-mute">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terms Accordion & Enter Action */}
      <section className="mx-auto mt-16 max-w-2xl rounded-3xl border border-black/10 bg-panel p-6 shadow-sm">
        <button
          type="button"
          onClick={() => setShowTerms(!showTerms)}
          className="flex w-full items-center justify-between text-sm font-medium text-ink"
        >
          <span>Terms & Conditions</span>
          <span className="text-mute">{showTerms ? "▲ Collapse" : "▼ Read terms"}</span>
        </button>

        {showTerms && (
          <ol className="mt-4 space-y-3 border-t border-black/10 pt-4 text-xs text-mute">
            {TERMS.map((term, index) => (
              <li key={term.title}>
                <span className="font-semibold text-ink">{index + 1}. {term.title}: </span>
                <span>{term.body}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 flex flex-col items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-mute">
            <input
              type="checkbox"
              className="h-4 w-4 accent-brass"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>I have read and agree to the Terms & Conditions</span>
          </label>

          <button
            type="button"
            disabled={!agreed}
            onClick={onEnter}
            className="flex items-center gap-2 rounded-full bg-brass px-8 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>Enter the Platform</span>
            <span>➔</span>
          </button>

          {!agreed && (
            <p className="text-[11px] text-coral">Please accept the Terms & Conditions to proceed.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-mute">
        © 2026 Nirgrantha Platform · Meeting-to-Execution Agent · Product Space Agentic AI Hackathon
      </footer>
    </div>
  );
}
