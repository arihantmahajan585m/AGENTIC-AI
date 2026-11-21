"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildDigests } from "@/lib/digest";
import { formatDay, formatDayShort, todayISO } from "@/lib/format";
import { personById } from "@/lib/people";
import { SAMPLE_DATE, SAMPLE_TITLE, SAMPLE_TRANSCRIPT, SCENARIOS, type Scenario } from "@/lib/sample";
import { alignment } from "@/lib/score";
import type { Conflict, Decision, Person, Proposal, Receipt, Resolution, Store, Task } from "@/lib/types";
import { TOPIC_LABEL } from "@/lib/types";
import { Welcome } from "@/components/Welcome";
import { AiChatbox } from "@/components/AiChatbox";

type View = "room" | "ingest" | "trace" | "gate" | "board" | "memory" | "digest" | "signals" | "profile";

type NavItem = {
  id: View;
  label: string;
  icon: string;
  category: "Pipeline" | "Execution" | "Account";
  desc: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: "room", label: "Room", icon: "🏛️", category: "Pipeline", desc: "In-force ledger & state" },
  { id: "ingest", label: "Ingest", icon: "🎙️", category: "Pipeline", desc: "Transcripts & speech" },
  { id: "trace", label: "Agent Trace", icon: "⚡", category: "Pipeline", desc: "7-step reasoning & guardrails" },
  { id: "gate", label: "Governance Gate", icon: "🛡️", category: "Pipeline", desc: "Conflict calls & blast radius" },
  { id: "board", label: "Tracker Board", icon: "📋", category: "Execution", desc: "Confirmed tasks & Linear" },
  { id: "memory", label: "Memory Ledger", icon: "🧠", category: "Execution", desc: "Historical decisions in force" },
  { id: "digest", label: "Weekly Digests", icon: "👤", category: "Execution", desc: "Per-person Slack rollups" },
  { id: "signals", label: "Reminders Brake", icon: "⏰", category: "Execution", desc: "Held & active signals" },
  { id: "profile", label: "Profile & Settings", icon: "⚙️", category: "Account", desc: "Google account, integrations & prefs" },
];

export function GoogleLogo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export type UserProfile = {
  isLoggedIn: boolean;
  name: string;
  email: string;
  role: string;
  organization: string;
  calendarSync: boolean;
  meetIntegration: boolean;
  driveExport: boolean;
  safetyBrakeAutoHold: boolean;
  gateAlerts: boolean;
  digestSlack: boolean;
};

export function KeptApp() {
  const [store, setStore] = useState<Store | null>(null);
  const [view, setView] = useState<View>("room");
  const [title, setTitle] = useState(SAMPLE_TITLE);
  const [meetingDate, setMeetingDate] = useState(SAMPLE_DATE);
  const [transcript, setTranscript] = useState("");
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [edits, setEdits] = useState<{ id: string; title: string; ownerId: string; deadline: string; include: boolean }[]>([]);
  const [trace, setTrace] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [webhook, setWebhook] = useState("");
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [gate, setGate] = useState<"boot" | "welcome" | "in">("boot");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    isLoggedIn: true,
    name: "Arihant Mahajan",
    email: "arihant.mahajan@gmail.com",
    role: "Lead Decision Maker & Architect",
    organization: "Nirgrantha Workspace",
    calendarSync: true,
    meetIntegration: true,
    driveExport: true,
    safetyBrakeAutoHold: true,
    gateAlerts: true,
    digestSlack: true,
  });
  const recRef = useRef<{ stop: () => void } | null>(null);
  const today = todayISO();

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }

  useEffect(() => {
    const saved = localStorage.getItem("nirgrantha_profile");
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const updateUserProfile = (patch: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem("nirgrantha_profile", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    setGate(sessionStorage.getItem("kept-entered") === "1" ? "in" : "welcome");
  }, []);

  useEffect(() => {
    void refresh();
    const saved = localStorage.getItem("kept-draft");
    if (saved) setTranscript(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("kept-draft", transcript);
  }, [transcript]);

  useEffect(() => {
    if (!store?.pending) return;
    setResolutions({});
    setEdits(
      store.pending.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        ownerId: task.ownerId,
        deadline: task.deadline || "",
        include: task.include,
      })),
    );
    setTrace(0);
  }, [store?.pending?.meeting.id]);

  useEffect(() => {
    if (view !== "trace" || !store?.pending) return;
    const total = store.pending.steps.length;
    const timer = setInterval(() => {
      setTrace((current) => (current + 1 >= total ? current : current + 1));
    }, 850);
    return () => clearInterval(timer);
  }, [view, store?.pending?.meeting.id]);

  useEffect(() => {
    if (store) setWebhook(store.settings.webhookUrl);
  }, [store?.settings.webhookUrl]);

  const score = store ? alignment(store, today) : null;
  const digests = useMemo(() => (store ? buildDigests(store, today) : []), [store, today]);
  const pending = store?.pending ?? null;
  const conflictsLeft = pending ? pending.conflicts.filter((conflict) => !resolutions[conflict.id]).length : 0;

  const activeAgentInfo = useMemo(() => {
    if (busy) {
      return {
        agent: "Extractor & Critic Agents",
        status: "Analyzing transcript & speech...",
        color: "border-brass/30 bg-brass/10 text-brass",
        dot: "bg-brass animate-ping",
        activeList: ["Ingest", "Speech Repair", "Extractor", "Memory", "Critic", "Blast Radius", "Gate"],
      };
    }
    if (pending) {
      return {
        agent: "Governance Gate Agent",
        status: `Halted: ${pending.conflicts.length} contradiction${pending.conflicts.length === 1 ? "" : "s"} await human call`,
        color: "border-coral/40 bg-coral/10 text-coral",
        dot: "bg-coral animate-pulse",
        activeList: ["Conflict Critic", "Blast Radius", "Governance Gate"],
      };
    }
    if (receipt) {
      return {
        agent: "Execution & Sync Agent",
        status: "Tasks posted to board & dispatched via webhook",
        color: "border-sage/40 bg-sage/10 text-sage",
        dot: "bg-sage",
        activeList: ["Tracker Sync", "Reminder Scheduler", "Digest Engine"],
      };
    }
    return {
      agent: "Cross-Meeting Memory Agent",
      status: "Guarding in-force decisions & holding ledger",
      color: "border-emerald-600/30 bg-emerald-50 text-emerald-800",
      dot: "bg-emerald-600",
      activeList: ["Memory Ledger", "Reminder Safety Brake", "Digest Engine"],
    };
  }, [busy, pending, receipt]);

  async function refresh() {
    const response = await fetch("/api/state", { cache: "no-store" });
    setStore(await response.json());
  }

  async function send(path: string, init?: RequestInit) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, init);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      return data as { store?: Store; receipt?: Receipt; error?: string } & Store;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function takeStore(data: (Store & { store?: Store; receipt?: Receipt }) | null) {
    if (!data) return;
    setStore(data.store || data);
  }

  async function analyze() {
    const data = await send("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript, title, meetingDate }),
    });
    if (!data) return;
    takeStore(data);
    setReceipt(null);
    setView("trace");
  }

  async function confirm() {
    const data = await send("/api/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        resolutions,
        tasks: edits.map((edit) => ({ ...edit, deadline: edit.deadline || null })),
      }),
    });
    if (!data?.store || !data.receipt) return;
    setStore(data.store);
    setReceipt(data.receipt);
    setView("board");
  }

  function recommend() {
    if (!pending) return;
    const next: Record<string, Resolution> = {};
    for (const conflict of pending.conflicts) {
      if (conflict.topic === "launch_date") next[conflict.id] = "supersede";
      else if (conflict.topic === "database") next[conflict.id] = "keep_prior";
      else if (conflict.topic === "budget") next[conflict.id] = "defer";
      else next[conflict.id] = "keep_prior";
    }
    setResolutions(next);
  }

  function loadScenario(scenario: Scenario) {
    setTitle(scenario.title);
    setMeetingDate(scenario.date);
    setTranscript(scenario.transcript);
    setView("ingest");
    showToast(`Loaded scenario: ${scenario.name}`);
  }

  function loadSample() {
    loadScenario(SCENARIOS[0]);
  }

  function toggleMic() {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const host = window as unknown as {
      SpeechRecognition?: new () => SpeechHandle;
      webkitSpeechRecognition?: new () => SpeechHandle;
    };
    const Ctor = host.SpeechRecognition || host.webkitSpeechRecognition;
    if (!Ctor) {
      setError("This browser has no speech recognizer. Paste the Wispr Flow transcript instead.");
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (event) => {
      let said = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) said += `${event.results[i][0].transcript} `;
      }
      if (said.trim()) setTranscript((current) => `${current}${current ? "\n" : ""}${said.trim()}`);
    };
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  }

  const status = !store
    ? "Loading"
    : pending
      ? "Halted at the gate"
      : receipt
        ? "Posted"
        : "Memory in force";

  if (gate !== "in") {
    return gate === "welcome" ? (
      <Welcome
        onEnter={() => {
          sessionStorage.setItem("kept-entered", "1");
          setGate("in");
        }}
      />
    ) : (
      <div className="min-h-screen" />
    );
  }

  return (
    <div className="h-screen w-full bg-paper flex flex-col overflow-hidden">
      {/* Fixed Top Header - Big, Refined & Spacious Format */}
      <header className="shrink-0 z-40 border-b border-black/10 bg-paper/95 backdrop-blur-md shadow-xs">
        {/* Main Upper Bar: Brand + Quick Actions */}
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-3.5 md:px-6">
          {/* Left: Big Brand & Subtitle */}
          <div className="flex items-center gap-3.5">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-brass to-amber-700 text-white shadow-md">
              <span className="text-xl font-bold">⚡</span>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink tracking-tight leading-none">
                  Nirgrantha
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-brass/10 border border-brass/25 px-2 py-0.5 text-[10px] font-bold text-brass uppercase tracking-wider font-mono">
                  Autonomous Agent
                </span>
              </div>
              <p className="text-xs text-mute mt-1 font-medium">
                Meetings to Execution Agent · Cross-Meeting Truth & Governance
              </p>
            </div>
          </div>

          {/* Right: User Profile, Alignment Score, Reset Demo */}
          <div className="flex items-center gap-3">
            {/* User Profile / Google Account Pill */}
            {userProfile.isLoggedIn ? (
              <button
                type="button"
                onClick={() => setView("profile")}
                className={`flex items-center gap-2.5 rounded-2xl border px-3 py-1.5 text-xs shadow-xs transition-all ${
                  view === "profile"
                    ? "border-brass bg-brass/10 text-brass ring-1 ring-brass/30"
                    : "border-black/10 bg-panel text-ink hover:border-black/30 hover:bg-neutral-50"
                }`}
                title="Profile & Settings"
              >
                <div className="relative shrink-0">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-brass text-xs font-bold text-white shadow-xs">
                    {userProfile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-white shadow-xs border border-black/10">
                    <GoogleLogo className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="text-left hidden md:block">
                  <span className="font-bold block text-xs leading-tight text-ink">{userProfile.name}</span>
                  <span className="text-[10px] text-mute block leading-tight">Google Connected</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 rounded-2xl border border-black/15 bg-white px-3.5 py-2 text-xs font-bold text-ink hover:bg-neutral-50 shadow-xs transition-all"
              >
                <GoogleLogo className="h-4 w-4" />
                <span>Sign in with Google</span>
              </button>
            )}

            {score && <Score score={score.score} label={score.label} />}

            <button
              className="rounded-2xl border border-black/15 bg-panel px-3.5 py-2 text-xs font-semibold text-mute hover:border-black/30 hover:text-ink shadow-xs transition-all"
              onClick={() => void send("/api/reset", { method: "POST" }).then(takeStore)}
              type="button"
            >
              Reset demo
            </button>
          </div>
        </div>

        {/* Lower Cockpit Bar: Real-time Live Agent Status & 7 Sub-Agents Pipeline */}
        <div className="border-t border-black/5 bg-[#f0eae0]/70 px-4 py-2 md:px-6">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Live Agent Working Status Banner */}
            <div className={`flex items-center gap-2.5 rounded-full border px-3.5 py-1 text-xs font-medium ${activeAgentInfo.color} shadow-xs`}>
              <span className={`h-2.5 w-2.5 rounded-full ${activeAgentInfo.dot}`} />
              <span className="font-bold tracking-tight">{activeAgentInfo.agent}</span>
              <span className="opacity-80 hidden sm:inline font-mono">|</span>
              <span className="opacity-90">{activeAgentInfo.status}</span>
            </div>

            {/* 7 Sub-Agents Status Roster */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mute hidden lg:inline mr-1">
                Sub-Agents:
              </span>
              {[
                { name: "Ingest", icon: "🎙️" },
                { name: "Speech Repair", icon: "✂️" },
                { name: "Extractor", icon: "🔍" },
                { name: "Memory", icon: "🧠" },
                { name: "Critic", icon: "⚖️" },
                { name: "Blast Radius", icon: "💥" },
                { name: "Gate", icon: "🛡️" },
              ].map((ag, idx) => {
                const isActive = activeAgentInfo.activeList.includes(ag.name);
                return (
                  <div key={ag.name} className="flex items-center">
                    <span
                      className={`flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-medium transition-all ${
                        isActive
                          ? "bg-brass text-white font-bold shadow-xs scale-105"
                          : "bg-black/[0.04] text-mute hover:bg-black/[0.08]"
                      }`}
                      title={isActive ? `${ag.name} is actively executing` : `${ag.name} standby`}
                    >
                      <span className="text-[10px]">{ag.icon}</span>
                      <span>{ag.name}</span>
                      {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
                    </span>
                    {idx < 6 && <span className="text-black/20 text-[10px] mx-1">›</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Body (In Between Header & Footer) - Independent Scrolling */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row w-full max-w-[1440px] mx-auto overflow-hidden px-4 md:px-6 gap-6">
        {/* Left Submenus Sidebar */}
        <aside className="hidden md:flex w-60 shrink-0 flex-col justify-between border-r border-black/10 pr-5 py-4 overflow-y-auto">
          <nav className="space-y-6">
            {/* Group 1: Pipeline */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brass">
                Agent Pipeline
              </div>
              <div className="mt-2 space-y-1">
                {NAV_ITEMS.filter((n) => n.category === "Pipeline").map((item) => {
                  const isActive = view === item.id;
                  const isGateWithConflicts = item.id === "gate" && conflictsLeft > 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs transition-all ${
                        isActive
                          ? "bg-ink font-semibold text-paper shadow-sm"
                          : "text-mute hover:bg-black/5 hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {isGateWithConflicts && (
                        <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                          {conflictsLeft}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Execution */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brass">
                Execution & Truth
              </div>
              <div className="mt-2 space-y-1">
                {NAV_ITEMS.filter((n) => n.category === "Execution").map((item) => {
                  const isActive = view === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs transition-all ${
                        isActive
                          ? "bg-ink font-semibold text-paper shadow-sm"
                          : "text-mute hover:bg-black/5 hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Group 3: Account & Settings */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brass">
                Account & Settings
              </div>
              <div className="mt-2 space-y-1">
                {NAV_ITEMS.filter((n) => n.category === "Account").map((item) => {
                  const isActive = view === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setView(item.id)}
                      className={`flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-xs transition-all ${
                        isActive
                          ? "bg-ink font-semibold text-paper shadow-sm"
                          : "text-mute hover:bg-black/5 hover:text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Sidebar Bottom: User Profile Card & Sub-agents Status */}
          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={() => (userProfile.isLoggedIn ? setView("profile") : setShowLoginModal(true))}
              className={`w-full rounded-2xl border p-2.5 text-left text-xs transition-all ${
                view === "profile"
                  ? "border-brass/50 bg-brass/10"
                  : "border-black/10 bg-panel hover:border-black/25"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-brass text-xs font-bold text-white shadow-xs">
                    {userProfile.isLoggedIn
                      ? userProfile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                      : "G"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white shadow-xs">
                    <GoogleLogo className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-semibold text-ink text-xs">
                    {userProfile.isLoggedIn ? userProfile.name : "Sign in with Google"}
                  </div>
                  <div className="truncate text-[10px] text-mute">
                    {userProfile.isLoggedIn ? userProfile.email : "Connect Google Account"}
                  </div>
                </div>
              </div>
            </button>

            <div className="rounded-2xl border border-black/10 bg-panel p-2.5 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink text-[11px]">7 Sub-Agents Active</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="mt-1 text-[10px] text-mute leading-relaxed">
                Ingest ➔ Repair ➔ Extract ➔ Memory ➔ Critic ➔ Blast ➔ Gate
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Horizontal Submenus Bar (md:hidden) */}
        <div className="md:hidden flex gap-1 overflow-x-auto pb-2 border-b border-black/10 w-full mb-3">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ${
                view === item.id ? "bg-ink text-paper font-medium" : "text-mute hover:bg-black/5"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.id === "gate" && conflictsLeft > 0 ? ` · ${conflictsLeft}` : ""}
            </button>
          ))}
        </div>

        {/* Main Content Area - Scrollable between fixed header & footer */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto py-4 pr-1 pb-10">
          {error && <p className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>}

          {toast && (
            <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-brass/40 bg-panel px-4 py-2.5 text-sm text-ink shadow-xl transition-all">
              {toast}
            </div>
          )}
          {store && view === "room" && (
            <Room
              store={store}
              score={score!}
              pending={pending}
              onSample={loadSample}
              onOpen={setView}
            />
          )}
          {store && view === "ingest" && (
            <Ingest
              title={title}
              meetingDate={meetingDate}
              transcript={transcript}
              listening={listening}
              busy={busy}
              onTitle={setTitle}
              onDate={setMeetingDate}
              onTranscript={setTranscript}
              onSample={loadSample}
              onScenario={loadScenario}
              onMic={toggleMic}
              onRun={() => void analyze()}
            />
          )}
          {store && view === "trace" && <Trace pending={pending} index={trace} onPick={setTrace} onGate={() => setView("gate")} onIngest={() => setView("ingest")} />}
          {store && view === "gate" && pending && (
            <Gate
              store={store}
              pending={pending}
              resolutions={resolutions}
              edits={edits}
              busy={busy}
              conflictsLeft={conflictsLeft}
              onResolve={(id, value) => setResolutions((current) => ({ ...current, [id]: value }))}
              onEdit={(id, patch) => setEdits((current) => current.map((edit) => (edit.id === id ? { ...edit, ...patch } : edit)))}
              onRecommend={recommend}
              onConfirm={() => void confirm()}
              onDiscard={() => void send("/api/pending", { method: "DELETE" }).then((data) => { takeStore(data); setView("room"); })}
            />
          )}
          {store && view === "gate" && !pending && <Empty onIngest={() => setView("ingest")} title="Nothing is waiting." body="Ingest a meeting. Nirgrantha will halt here before the tracker changes." />}
          {store && view === "board" && <Board store={store} receipt={receipt} onToast={showToast} onToggle={(id, status) => void send("/api/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, status }) }).then(takeStore)} />}
          {store && view === "memory" && <Memory store={store} />}
          {store && view === "digest" && <Digests store={store} digests={digests} today={today} onToast={showToast} />}
          {store && view === "signals" && (
            <Signals
              store={store}
              webhook={webhook}
              busy={busy}
              onWebhook={setWebhook}
              onToast={showToast}
              onSave={() => void send("/api/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ webhookUrl: webhook }) }).then(takeStore)}
              onSweep={() => void send("/api/reminders", { method: "POST" }).then((res) => { takeStore(res); showToast("Sweep complete: reminders processed."); })}
            />
          )}
          {view === "profile" && (
            <ProfileSettings
              profile={userProfile}
              webhook={webhook}
              onUpdateProfile={updateUserProfile}
              onWebhookChange={setWebhook}
              onSaveWebhook={() =>
                void send("/api/settings", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ webhookUrl: webhook }),
                }).then((res) => {
                  takeStore(res);
                  showToast("Slack webhook URL saved successfully!");
                })
              }
              onTestWebhook={async () => {
                if (!webhook) {
                  showToast("Please enter a valid Slack Webhook URL first.");
                  return;
                }
                showToast("Testing connection to Slack...");
                try {
                  const res = await fetch("/api/settings", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ webhookUrl: webhook }),
                  });
                  if (res.ok) {
                    showToast("✓ Slack Webhook verified & connected!");
                  } else {
                    showToast("Failed to verify webhook URL.");
                  }
                } catch {
                  showToast("Network error verifying webhook.");
                }
              }}
              onOpenLoginModal={() => setShowLoginModal(true)}
              onToast={showToast}
            />
          )}
          {!store && <p className="text-mute">Opening the ledger…</p>}
        </main>
      </div>

      {/* Fixed Bottom Footer */}
      <footer className="shrink-0 z-40 border-t border-black/10 bg-paper/95 backdrop-blur-md px-4 py-2.5 md:px-6 shadow-xs">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between text-xs text-mute">
          {/* Left: Memory & In-Force Ledger status */}
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-semibold text-ink">Cross-Meeting Memory Active</span>
            <span className="hidden sm:inline text-black/20">|</span>
            <span className="hidden sm:inline font-mono text-[11px]">3 Nov Northstar Ledger in force (28 Nov · ₹5L · Postgres)</span>
          </div>

          {/* Center: System Telemetry Badges */}
          <div className="hidden lg:flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <span className="text-xs">🛡️</span>
              <span>Governance Gate: Armed</span>
            </span>
            <span className="text-black/20">·</span>
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <span className="text-xs">⏰</span>
              <span>Safety Brake: Active</span>
            </span>
            <span className="text-black/20">·</span>
            <span className="flex items-center gap-1.5 font-medium text-ink">
              <span className="text-xs">⚡</span>
              <span>7 Sub-Agents Live</span>
            </span>
          </div>

          {/* Right: User / Workspace quick status */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            {userProfile.isLoggedIn ? (
              <span className="flex items-center gap-1.5 text-ink font-semibold">
                <GoogleLogo className="h-3 w-3" />
                <span>{userProfile.name}</span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">Google Sync</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowLoginModal(true)}
                className="text-brass hover:underline font-bold"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* Floating Gemini AI Copilot for Doubts & Explanations */}
      <AiChatbox store={store} />

      {showLoginModal && (
        <GoogleLoginModal
          currentProfile={userProfile}
          onLogin={(newProfile) => {
            updateUserProfile(newProfile);
            setShowLoginModal(false);
            showToast(`Signed in with Google as ${newProfile.name}`);
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </div>
  );
}

function Score({ score, label }: { score: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 px-2 py-1">
      <div
        className="grid h-9 w-9 place-items-center rounded-full"
        style={{ background: `conic-gradient(#8d5e12 ${score * 3.6}deg, rgba(28,22,18,0.12) 0)` }}
      >
        <div className="grid h-7 w-7 place-items-center rounded-full bg-paper text-[11px]">{score}</div>
      </div>
      <span className="pr-1 text-xs text-mute">{label}</span>
    </div>
  );
}

function Room({
  store,
  score,
  pending,
  onSample,
  onOpen,
}: {
  store: Store;
  score: { score: number; label: string; overdue: number; conflicts: number };
  pending: Proposal | null;
  onSample: () => void;
  onOpen: (view: View) => void;
}) {
  const governing = store.decisions.filter((decision) => decision.status === "active" && !decision.exceptionTo);
  const exception = store.decisions.find((decision) => decision.topic === "pricing_exception" && decision.status === "active");
  const open = store.tasks.filter((task) => task.status === "open");
  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
      <section>
        <p className="font-serif text-5xl leading-[0.95] md:text-6xl">Decisions made in meetings get lost.</p>
        <p className="mt-4 max-w-xl text-lg text-mute">
          The next meeting contradicts them, and a summarizer files both. Nirgrantha is the record of what is still in force. It will not post a task that breaks that record until a person decides which version the company will keep.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat n={String(governing.length)} label="Decisions in force" />
          <Stat n={String(open.length)} label="Open tasks" />
          <Stat n={String(score.overdue)} label="Already late" />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-paper" type="button" onClick={onSample}>
            Load the 21 Nov launch sync
          </button>
          <button className="rounded-full border border-black/15 px-4 py-2 text-sm" type="button" onClick={() => onOpen(pending ? "gate" : "ingest")}>
            {pending ? "Return to the gate" : "Paste a transcript"}
          </button>
        </div>
        <ol className="mt-8 space-y-2 text-sm text-mute">
          <li>1. Memory already holds the 3 Nov lock and the 14 Nov pricing exception.</li>
          <li>2. Load today’s sync. It contains fillers, self-corrections, and three contradictions.</li>
          <li>3. Let the agent halt. Sweep reminders while the gate is open. Challenged work is held.</li>
          <li>4. Supersede the date, keep Postgres, defer the new budget. Then post.</li>
        </ol>
      </section>
      <section className="ledger rounded-3xl border border-black/10 bg-panel p-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-mute">In force · Northstar launch</div>
        <ul className="mt-3 divide-y divide-black/10">
          {governing.map((decision) => (
            <li key={decision.id} className="py-3">
              <div className="text-xs text-brass">{TOPIC_LABEL[decision.topic]}</div>
              <div className="font-serif text-2xl">{decision.display}</div>
              <p className="text-sm text-mute">{decision.text}</p>
            </li>
          ))}
        </ul>
        {exception && (
          <div className="mt-2 rounded-2xl border border-sage/30 bg-sage/10 p-3 text-sm">
            <div className="text-xs uppercase tracking-[0.16em] text-sage">Scoped exception · not a conflict</div>
            <p className="mt-1">{exception.text}</p>
            <p className="mt-1 text-mute">{exception.scope}</p>
          </div>
        )}
        {pending && (
          <button className="mt-4 w-full rounded-2xl bg-coral px-4 py-3 text-left text-sm text-paper" type="button" onClick={() => onOpen("gate")}>
            {pending.conflicts.length} decisions in today’s meeting argue with this ledger. The tracker has not moved.
          </button>
        )}
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-panel px-3 py-3">
      <div className="font-serif text-3xl">{n}</div>
      <div className="text-xs text-mute">{label}</div>
    </div>
  );
}

function Ingest(props: {
  title: string;
  meetingDate: string;
  transcript: string;
  listening: boolean;
  busy: boolean;
  onTitle: (value: string) => void;
  onDate: (value: string) => void;
  onTranscript: (value: string) => void;
  onSample: () => void;
  onScenario: (scenario: Scenario) => void;
  onMic: () => void;
  onRun: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const detectedSpeakers = useMemo(() => {
    const set = new Set<string>();
    for (const line of props.transcript.split("\n")) {
      const match = line.trim().match(/^([A-Za-z][A-Za-z.'-]+(?:\s[A-Za-z][A-Za-z.'-]+)?)\s*[:\-–—]/);
      if (match) set.add(match[1]);
    }
    return Array.from(set);
  }, [props.transcript]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        props.onTranscript(text);
        props.onTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <section className="rounded-3xl border border-black/10 bg-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-3xl">Read the room</h2>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {SCENARIOS.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => props.onScenario(sc)}
                  className="rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs text-mute hover:border-brass hover:text-ink"
                >
                  {sc.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-black/15 px-3 py-1.5 text-xs text-mute hover:text-ink"
              onClick={() => fileRef.current?.click()}
            >
              Upload file (.txt)
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".txt,.vtt,.srt,.json"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button className={`rounded-full px-3 py-1.5 text-sm ${props.listening ? "bg-coral text-paper" : "border border-black/15"}`} type="button" onClick={props.onMic}>
              {props.listening ? "Stop listening" : "Speak (Wispr/Mic)"}
            </button>
          </div>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Paste a transcript, dictate via speech recognition, or load pre-built scenarios. Nirgrantha attributes each speaker, cleans conversational fillers, preserves self-corrections, and checks against cross-meeting memory.
        </p>

        {detectedSpeakers.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-2xl bg-black/[0.03] px-3 py-2 text-xs">
            <span className="text-mute font-medium">Attributed Speakers:</span>
            {detectedSpeakers.map((sp) => (
              <span key={sp} className="rounded-full bg-paper px-2.5 py-0.5 font-medium text-ink shadow-sm">
                {sp}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px]">
          <input value={props.title} onChange={(event) => props.onTitle(event.target.value)} aria-label="Meeting title" />
          <input type="date" value={props.meetingDate} onChange={(event) => props.onDate(event.target.value)} aria-label="Meeting date" />
        </div>
        <textarea
          className="mt-3 min-h-[340px] w-full p-3 leading-relaxed"
          value={props.transcript}
          onChange={(event) => props.onTranscript(event.target.value)}
          placeholder={"Priya: We should move the launch to December 2, no wait, December 5.\nArjun: I'll freeze the API by Monday. Actually, Tuesday."}
        />
        <button className="mt-3 rounded-full bg-brass px-4 py-2 text-sm font-medium text-paper disabled:opacity-50" type="button" disabled={props.busy} onClick={props.onRun}>
          {props.busy ? "Reading…" : "Run the agent"}
        </button>
      </section>
      <aside className="rounded-3xl border border-black/10 bg-panel p-4 text-sm text-mute">
        <div className="text-[11px] uppercase tracking-[0.16em] text-brass">What this meeting hides</div>
        <ul className="mt-3 space-y-3">
          <li>“December 2, no wait, December 5.” The first date is a stumble.</li>
          <li>“Wednesday. Actually, Thursday.” The offsite explains the correction.</li>
          <li>“Monday. Sorry, Tuesday.” Quotes move a day.</li>
          <li>“Don’t spend the eight lakh until we confirm.” That is not a task.</li>
          <li>₹3,600 for the first 10 logos is already an exception. It must not alarm.</li>
        </ul>
      </aside>
    </div>
  );
}

function Trace({ pending, index, onPick, onGate, onIngest }: { pending: Proposal | null; index: number; onPick: (n: number) => void; onGate: () => void; onIngest: () => void }) {
  if (!pending) return <Empty onIngest={onIngest} title="The agent is idle." body="Ingest a meeting to watch it read, remember, and halt." />;
  const step = pending.steps[index] || pending.steps[0];
  return (
    <div>
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-black/10 bg-panel p-2">
        {pending.steps.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onPick(itemIndex)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs transition-all ${
              itemIndex === index
                ? "bg-brass font-medium text-white shadow-sm"
                : itemIndex < index
                ? "bg-sage/15 text-sage hover:bg-sage/20"
                : "text-mute hover:bg-black/5"
            }`}
          >
            <span>{itemIndex + 1}. {item.agent}</span>
            {itemIndex < index && <span className="text-[10px]">✓</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <ol className="space-y-2">
          {pending.steps.map((item, itemIndex) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onPick(itemIndex)}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition-all ${
                  itemIndex === index ? "border-brass bg-brass/10" : "border-black/10 hover:border-black/25"
                } ${itemIndex > index ? "opacity-50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.16em] text-brass">{item.agent}</span>
                  {itemIndex < index && <span className="text-xs text-sage font-medium">Done</span>}
                </div>
                <div className="mt-1 text-sm">{item.title}</div>
              </button>
            </li>
          ))}
        </ol>
        <section className="rounded-3xl border border-black/10 bg-panel p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.16em] text-mute">{step.agent} · on-device pipeline</span>
            <span className="rounded-full bg-black/[0.04] px-2.5 py-0.5 text-xs text-mute">Step {index + 1} of {pending.steps.length}</span>
          </div>
          <h2 className="mt-2 font-serif text-4xl">{step.title}</h2>
          <p className="mt-3 max-w-2xl text-mute">{step.detail}</p>

          {step.guardrails && step.guardrails.length > 0 && (
            <div className="mt-4 rounded-2xl border border-brass/30 bg-brass/10 p-3 text-xs">
              <div className="text-[11px] uppercase tracking-[0.16em] text-brass font-medium">Negative Constraint / Guardrail Introspection</div>
              <ul className="mt-1.5 space-y-1">
                {step.guardrails.map((g) => (
                  <li key={g} className="text-ink">{g}</li>
                ))}
              </ul>
            </div>
          )}

          <ul className="mt-5 space-y-2">
            {step.evidence.slice(0, 8).map((line) => (
              <li key={line} className="rounded-xl border border-black/10 bg-black/[0.04] px-3 py-2 text-sm">{line}</li>
            ))}
            {step.evidence.length === 0 && <li className="text-sm text-mute">No evidence on this step.</li>}
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {index < pending.steps.length - 1 ? (
              <button
                type="button"
                className="rounded-full border border-black/15 px-4 py-2 text-sm font-medium hover:border-brass hover:text-brass"
                onClick={() => onPick(index + 1)}
              >
                Next step ➔
              </button>
            ) : (
              <button className="rounded-full bg-coral px-4 py-2 text-sm text-paper" type="button" onClick={onGate}>
                Open the Governance Gate
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Gate(props: {
  store: Store;
  pending: Proposal;
  resolutions: Record<string, Resolution>;
  edits: { id: string; title: string; ownerId: string; deadline: string; include: boolean }[];
  busy: boolean;
  conflictsLeft: number;
  onResolve: (id: string, value: Resolution) => void;
  onEdit: (id: string, patch: Partial<{ title: string; ownerId: string; deadline: string; include: boolean }>) => void;
  onRecommend: () => void;
  onConfirm: () => void;
  onDiscard: () => void;
}) {
  const { pending } = props;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-4xl">Nothing has been posted.</h2>
          <p className="mt-2 max-w-2xl text-sm text-mute">
            {pending.meeting.title} on {formatDay(pending.meeting.date)} produced {pending.decisions.length} decisions and {pending.tasks.length} actions.
            {pending.corrections.length > 0 ? ` ${pending.corrections.length} self-corrections were kept before extraction.` : ""} A summarizer would have filed the new values beside the old ones. Nirgrantha will not.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-full border border-black/15 px-3 py-1.5 text-sm" type="button" onClick={props.onRecommend}>Use the recommended calls</button>
          <button className="rounded-full border border-black/15 px-3 py-1.5 text-sm text-mute" type="button" onClick={props.onDiscard}>Discard</button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {pending.conflicts.map((conflict) => (
          <ConflictCard
            key={conflict.id}
            conflict={conflict}
            pending={pending}
            store={props.store}
            resolution={props.resolutions[conflict.id]}
            onResolve={(value) => props.onResolve(conflict.id, value)}
          />
        ))}
        {pending.conflicts.length === 0 && (
          <p className="rounded-2xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm">No governing decision is contradicted. You can still edit the tasks before they post.</p>
        )}
      </div>

      <h3 className="mt-8 font-serif text-2xl">Actions, still unposted</h3>
      <div className="mt-3 space-y-2">
        {props.edits.map((edit) => {
          const proposed = pending.tasks.find((task) => task.id === edit.id);
          const blocked = proposed ? taskBlocked(proposed, pending, props.resolutions) : false;
          return (
            <div key={edit.id} className="grid gap-2 rounded-2xl border border-black/10 bg-panel p-3 md:grid-cols-[auto_1fr_160px_150px]">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={edit.include && !blocked} disabled={blocked} onChange={(event) => props.onEdit(edit.id, { include: event.target.checked })} />
              </label>
              <input value={edit.title} onChange={(event) => props.onEdit(edit.id, { title: event.target.value })} />
              <select value={edit.ownerId} onChange={(event) => props.onEdit(edit.id, { ownerId: event.target.value })}>
                {props.store.people.map((person) => (
                  <option key={person.id} value={person.id}>{person.first}</option>
                ))}
              </select>
              <input type="date" value={edit.deadline} onChange={(event) => props.onEdit(edit.id, { deadline: event.target.value })} />
              {blocked && <p className="md:col-span-4 text-xs text-coral">Will not post. It depends on a decision you kept, deferred, or have not resolved.</p>}
              {proposed?.suggested && !blocked && <p className="md:col-span-4 text-xs text-brass">Deadline suggested from the new launch date.</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-paper disabled:opacity-40" type="button" disabled={props.busy || props.conflictsLeft > 0} onClick={props.onConfirm}>
          {props.conflictsLeft > 0 ? `Resolve ${props.conflictsLeft} conflict${props.conflictsLeft === 1 ? "" : "s"} to post` : "Post to the tracker"}
        </button>
        <p className="text-xs text-mute">Reminders are scheduled only for tasks that post. A webhook, if set, receives this same payload.</p>
      </div>
    </div>
  );
}

function taskBlocked(task: { dependsOnTopic?: string }, pending: Proposal, resolutions: Record<string, Resolution>) {
  if (!task.dependsOnTopic) return false;
  const decision = pending.decisions.find((item) => item.topic === task.dependsOnTopic);
  if (!decision) return false;
  const conflict = pending.conflicts.find((item) => item.newDecisionId === decision.id);
  if (!conflict) return false;
  const resolution = resolutions[conflict.id];
  if (!resolution) return true;
  return resolution === "keep_prior" || resolution === "defer";
}

function ConflictCard({
  conflict,
  pending,
  store,
  resolution,
  onResolve,
}: {
  conflict: Conflict;
  pending: Proposal;
  store: Store;
  resolution?: Resolution;
  onResolve: (value: Resolution) => void;
}) {
  const next = pending.decisions.find((decision) => decision.id === conflict.newDecisionId);
  const prior = store.decisions.find((decision) => decision.id === conflict.priorDecisionId);
  const choices: { id: Resolution; label: string }[] = [
    { id: "keep_prior", label: `Keep ${prior?.display ?? "what is in force"}` },
    { id: "supersede", label: `Supersede with ${next?.display ?? "the new value"}` },
    { id: "exception", label: "Allow as a scoped exception" },
    { id: "defer", label: "Decide later" },
  ];
  return (
    <article className="rounded-3xl border border-coral/30 bg-panel p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] uppercase tracking-[0.16em] text-coral">{conflict.title} · {conflict.severity}</div>
        {resolution && <span className="text-xs text-brass">{choices.find((choice) => choice.id === resolution)?.label}</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="font-serif text-3xl text-mute line-through decoration-coral/80">{prior?.display}</span>
        <span className="text-mute">→</span>
        <span className="font-serif text-3xl">{next?.display}</span>
      </div>
      <p className="mt-2 max-w-3xl text-sm text-mute">{conflict.explanation}</p>
      <p className="mt-2 text-xs text-mute">“{next?.evidence}”</p>
      {conflict.rewrites.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {conflict.rewrites.map((rewrite) => {
            const task = store.tasks.find((item) => item.id === rewrite.taskId);
            const owner = personById(store.people, task?.ownerId || "");
            return (
              <li key={rewrite.taskId} className="rounded-xl bg-black/[0.04] px-3 py-2">
                <span className="text-mute">{owner?.first}: {task?.title}</span>
                <span> → {rewrite.title} · {formatDayShort(rewrite.deadline)}</span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-2 text-xs text-mute">{conflict.context}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => onResolve(choice.id)}
            className={`rounded-full px-3 py-1.5 text-sm ${resolution === choice.id ? "bg-ink text-paper" : "border border-black/15 text-mute"}`}
          >
            {choice.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function Board({
  store,
  receipt,
  onToggle,
  onToast,
}: {
  store: Store;
  receipt: Receipt | null;
  onToggle: (id: string, status: "open" | "done") => void;
  onToast: (msg: string) => void;
}) {
  const copyLinear = async () => {
    const lines = [
      `### Northstar Launch Tracker (Exported from Kept)`,
      `Status as of: ${formatDay(todayISO())}`,
      "",
    ];
    for (const person of store.people) {
      const tasks = store.tasks.filter((t) => t.ownerId === person.id);
      if (tasks.length === 0) continue;
      lines.push(`#### ${person.name} (${person.role})`);
      for (const t of tasks) {
        const check = t.status === "done" ? "[x]" : "[ ]";
        const dec = store.decisions.find((d) => d.id === t.bindsDecisionId);
        lines.push(`- ${check} **${t.title}** (Due: ${formatDayShort(t.deadline)})${dec ? ` · [Binds: ${dec.display}]` : ""}`);
      }
      lines.push("");
    }
    await navigator.clipboard.writeText(lines.join("\n"));
    onToast("Copied task board for Linear / Jira!");
  };

  const exportCSV = () => {
    const headers = ["ID", "Title", "Owner", "Deadline", "Status", "BindsDecision", "Note"];
    const rows = store.tasks.map((t) => {
      const owner = personById(store.people, t.ownerId);
      const dec = store.decisions.find((d) => d.id === t.bindsDecisionId);
      return [
        t.id,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${owner?.name || t.ownerId}"`,
        t.deadline || "",
        t.status,
        `"${dec?.display || ""}"`,
        `"${(t.note || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kept-tasks-${todayISO()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast("Downloaded tasks.csv");
  };

  const copyPayload = async () => {
    const payload = {
      source: "kept",
      timestamp: new Date().toISOString(),
      tasks: store.tasks,
      decisions: store.decisions.filter((d) => d.status === "active"),
    };
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    onToast("Copied integration JSON payload!");
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-panel p-3">
        <div>
          <span className="text-[11px] uppercase tracking-[0.16em] text-brass font-medium">Tracker & Integrations</span>
          <p className="text-xs text-mute mt-0.5">Tasks created out of confirmed meetings. Integrated with webhooks and trackers.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyLinear}
            className="rounded-full border border-black/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-brass"
          >
            📋 Copy for Linear / Jira
          </button>
          <button
            type="button"
            onClick={exportCSV}
            className="rounded-full border border-black/15 bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-brass"
          >
            📥 Download CSV
          </button>
          <button
            type="button"
            onClick={copyPayload}
            className="rounded-full border border-black/15 bg-paper px-3 py-1.5 text-xs text-mute hover:text-ink"
          >
            JSON Payload
          </button>
        </div>
      </div>

      {receipt && (
        <div className="mb-4 rounded-2xl border border-sage/30 bg-sage/10 p-4 text-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-sage">Posted after confirmation</div>
          <p className="mt-1">{receipt.postedTasks.length} tasks posted. {receipt.superseded.length} decisions superseded. {receipt.rejected.length} rejected. {receipt.deferred.length} deferred.</p>
          {receipt.rewritten.length > 0 && <p className="mt-1 text-mute">Rewritten: {receipt.rewritten.join("; ")}</p>}
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {store.people.map((person) => {
          const tasks = store.tasks.filter((task) => task.ownerId === person.id);
          return (
            <section key={person.id} className="rounded-3xl border border-black/10 bg-panel p-3">
              <PersonLine person={person} />
              <ul className="mt-2 space-y-2">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} store={store} onToggle={onToggle} />
                ))}
                {tasks.length === 0 && <li className="text-sm text-mute">No tasks.</li>}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TaskRow({ task, store, onToggle }: { task: Task; store: Store; onToggle: (id: string, status: "open" | "done") => void }) {
  const meeting = store.meetings.find((item) => item.id === task.meetingId);
  const decision = store.decisions.find((item) => item.id === task.bindsDecisionId);
  return (
    <li className="rounded-2xl border border-black/10 px-3 py-2">
      <button type="button" className="text-left" onClick={() => onToggle(task.id, task.status === "open" ? "done" : "open")}>
        <div className={task.status === "done" ? "text-sm text-mute line-through" : "text-sm"}>{task.title}</div>
      </button>
      <div className="mt-1 text-xs text-mute">
        {formatDayShort(task.deadline)} · {task.status} · {meeting?.title || "Meeting"}
        {decision ? ` · serves ${decision.display}` : ""}
      </div>
      {task.note && <div className="mt-1 text-xs text-brass">{task.note}</div>}
    </li>
  );
}

function Memory({ store }: { store: Store }) {
  const ordered = [...store.decisions].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <div>
      <h2 className="font-serif text-4xl">Cross-meeting memory</h2>
      <p className="mt-2 max-w-2xl text-sm text-mute">A decision stays in force until this ledger says otherwise. Superseded decisions remain visible, so the company can see what changed and when. Scoped exceptions sit beside the rule they do not replace.</p>
      <ol className="mt-5 space-y-3">
        {ordered.map((decision) => (
          <DecisionRow key={decision.id} decision={decision} store={store} />
        ))}
      </ol>
    </div>
  );
}

function DecisionRow({ decision, store }: { decision: Decision; store: Store }) {
  const speaker = personById(store.people, decision.speakerId);
  const meeting = store.meetings.find((item) => item.id === decision.meetingId);
  const tone = decision.status === "active" ? "text-ink" : "text-mute";
  return (
    <li className="grid gap-2 rounded-2xl border border-black/10 bg-panel p-4 md:grid-cols-[140px_1fr]">
      <div>
        <div className="font-serif text-xl">{decision.display}</div>
        <div className="text-xs uppercase tracking-[0.14em] text-brass">{decision.status}</div>
      </div>
      <div>
        <div className={`text-sm ${tone}`}>{decision.text}</div>
        <div className="mt-1 text-xs text-mute">{formatDay(decision.createdAt)} · {meeting?.title} · {speaker?.name || decision.speakerId}</div>
        {decision.scope && <div className="mt-1 text-xs text-sage">{decision.scope}</div>}
        <div className="mt-2 text-xs text-mute">“{decision.evidence}”</div>
      </div>
    </li>
  );
}

function Digests({ store, digests, today, onToast }: { store: Store; digests: ReturnType<typeof buildDigests>; today: string; onToast: (msg: string) => void }) {
  const copySlack = async (person: Person, digest: ReturnType<typeof buildDigests>[number]) => {
    const lines = [
      `*Weekly Digest · ${person.name} (${person.role})*`,
      `_Week of ${formatDayShort(weekStart(today))}_`,
      "",
    ];
    if (digest.overdue.length > 0) {
      lines.push("*⚠️ Overdue:*");
      digest.overdue.forEach((t) => lines.push(`• ${t.title} (Due: ${formatDayShort(t.deadline)})`));
      lines.push("");
    }
    if (digest.dueSoon.length > 0) {
      lines.push("*📅 Due in seven days:*");
      digest.dueSoon.forEach((t) => lines.push(`• ${t.title} (Due: ${formatDayShort(t.deadline)})`));
      lines.push("");
    }
    if (digest.threatened.length > 0) {
      lines.push("*⚡ Would change if today’s meeting is accepted (Blast Radius):*");
      digest.threatened.forEach((th) => lines.push(`• ${th.from} → ${th.to}`));
      lines.push("");
    }
    if (digest.notes.length > 0) {
      lines.push("*📝 Rewrites & Updates:*");
      digest.notes.forEach((n) => lines.push(`• ${n}`));
      lines.push("");
    }
    if (digest.open.length === 0 && digest.threatened.length === 0) {
      lines.push("✅ Nothing open. Clear schedule!");
    }
    await navigator.clipboard.writeText(lines.join("\n"));
    onToast(`Copied ${person.first}’s weekly digest for Slack!`);
  };

  return (
    <div>
      <h2 className="font-serif text-4xl">Week of {formatDayShort(weekStart(today))}</h2>
      <p className="mt-2 max-w-2xl text-sm text-mute">One digest per person. It is not a meeting summary. It is what they owe, what is late, and which of their tasks a live conflict would rewrite.</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {digests.map((digest) => {
          const person = personById(store.people, digest.personId);
          if (!person) return null;
          return (
            <article key={digest.personId} className="rounded-3xl border border-black/10 bg-panel p-4 text-ink">
              <div className="flex items-center justify-between gap-2">
                <PersonLine person={person} dark />
                <button
                  type="button"
                  onClick={() => void copySlack(person, digest)}
                  className="rounded-full border border-black/15 px-2.5 py-1 text-xs text-mute hover:border-brass hover:text-ink"
                >
                  📋 Copy for Slack
                </button>
              </div>
              <DigestBlock label="Late" items={digest.overdue.map((task) => `${task.title} · ${formatDayShort(task.deadline)}`)} />
              <DigestBlock label="Due in seven days" items={digest.dueSoon.map((task) => `${task.title} · ${formatDayShort(task.deadline)}`)} />
              <DigestBlock label="Would change if today’s meeting is accepted" items={digest.threatened.map((item) => `${item.from} → ${item.to}`)} />
              <DigestBlock label="Already rewritten" items={digest.notes} />
              {digest.open.length === 0 && digest.threatened.length === 0 && <p className="mt-3 text-sm text-[#6d6256]">Nothing open.</p>}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function DigestBlock({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-[#8a7560]">{label}</div>
      <ul className="mt-1 space-y-1 text-sm">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function Signals(props: {
  store: Store;
  webhook: string;
  busy: boolean;
  onWebhook: (value: string) => void;
  onToast: (msg: string) => void;
  onSave: () => void;
  onSweep: () => void;
}) {
  const heldReminders = props.store.reminders.filter((r) => r.status === "held");

  const testPing = () => {
    props.onToast("Simulation ping: Webhook payload validated and ready to dispatch.");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <h2 className="font-serif text-4xl">Reminders, with a brake</h2>
        <p className="mt-2 text-sm text-mute">A reminder fires the day before a confirmed deadline. If that task serves a decision the current meeting is challenging, the reminder is held instead of sent. Run this while the gate is open.</p>

        {heldReminders.length > 0 && (
          <div className="mt-4 rounded-2xl border border-coral/30 bg-coral/10 p-3 text-xs">
            <div className="font-medium uppercase tracking-[0.16em] text-coral">Safety Brake Engaged · {heldReminders.length} Reminder{heldReminders.length === 1 ? "" : "s"} Held</div>
            <p className="mt-1 text-ink">These reminders were paused because their underlying decisions are being contested at the Governance Gate. Nirgrantha prevents reminding team members to execute invalidated plans.</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded-full bg-brass px-4 py-2 text-sm font-medium text-paper disabled:opacity-50" type="button" disabled={props.busy} onClick={props.onSweep}>
            Sweep due reminders
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {props.store.reminders.map((reminder) => {
            const person = personById(props.store.people, reminder.personId);
            const isHeld = reminder.status === "held";
            return (
              <li key={reminder.id} className={`rounded-2xl border p-3 text-sm ${isHeld ? "border-coral/40 bg-coral/[0.04]" : "border-black/10 bg-panel"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{person?.first} ({person?.role})</span>
                  <span className={`text-xs uppercase tracking-wider font-medium ${isHeld ? "text-coral" : reminder.status === "sent" ? "text-sage" : "text-mute"}`}>
                    {isHeld ? "⛔ Held (Contested)" : reminder.status}
                  </span>
                </div>
                <p className="mt-1 text-mute text-xs">{reminder.message}</p>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="space-y-4">
        <div className="rounded-3xl border border-black/10 bg-panel p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-brass">Tracker integration</div>
          <p className="mt-2 text-sm text-mute">Confirmed work always lands on the Nirgrantha board. Paste a webhook to also post the payload to Slack, Linear, Trello, or a script.</p>
          <input className="mt-3 w-full px-3 py-2" placeholder="https://hooks.slack.com/services/..." value={props.webhook} onChange={(event) => props.onWebhook(event.target.value)} />
          <div className="mt-2 flex gap-2">
            <button className="rounded-full border border-black/15 px-3 py-1.5 text-xs text-ink hover:border-brass" type="button" onClick={props.onSave}>Save webhook</button>
            <button className="rounded-full border border-black/15 px-3 py-1.5 text-xs text-mute hover:text-ink" type="button" onClick={testPing}>Test webhook ping</button>
          </div>
        </div>
        <div className="rounded-3xl border border-black/10 bg-panel p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Deliveries</div>
          <ul className="mt-2 space-y-2">
            {props.store.deliveries.slice(0, 3).map((delivery) => (
              <li key={delivery.id}>
                <div className="text-xs text-mute">{delivery.target}</div>
                <pre className="mt-1 overflow-auto text-xs text-ink">{JSON.stringify(delivery.body, null, 2)}</pre>
              </li>
            ))}
            {props.store.deliveries.length === 0 && <li className="text-sm text-mute">Nothing has been posted yet.</li>}
          </ul>
        </div>
        <div className="rounded-3xl border border-black/10 bg-panel p-4">
          <div className="text-[11px] uppercase tracking-[0.16em] text-mute">Inbox</div>
          <ul className="mt-2 space-y-2 text-sm">
            {props.store.inbox.slice(0, 6).map((item) => (
              <li key={item.id}><span className="text-brass">{item.kind}</span> · {item.title}</li>
            ))}
            {props.store.inbox.length === 0 && <li className="text-mute">Quiet.</li>}
          </ul>
        </div>
      </section>
    </div>
  );
}

function ProfileSettings({
  profile,
  webhook,
  onUpdateProfile,
  onWebhookChange,
  onSaveWebhook,
  onTestWebhook,
  onOpenLoginModal,
  onToast,
}: {
  profile: UserProfile;
  webhook: string;
  onUpdateProfile: (patch: Partial<UserProfile>) => void;
  onWebhookChange: (val: string) => void;
  onSaveWebhook: () => void;
  onTestWebhook: () => void;
  onOpenLoginModal: () => void;
  onToast: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [roleInput, setRoleInput] = useState(profile.role);
  const [orgInput, setOrgInput] = useState(profile.organization);

  const handleSaveProfile = () => {
    onUpdateProfile({
      name: nameInput.trim() || profile.name,
      role: roleInput.trim() || profile.role,
      organization: orgInput.trim() || profile.organization,
    });
    setEditing(false);
    onToast("Profile updated successfully!");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page Title */}
      <div>
        <h2 className="font-serif text-3xl md:text-4xl text-ink font-bold">Profile & Workspace Settings</h2>
        <p className="mt-1 text-sm text-mute">
          Manage your Google authentication, Google Workspace integrations, Slack execution webhook, and agent governance preferences.
        </p>
      </div>

      {/* Section 1: Google Account & Authentication */}
      <div className="rounded-3xl border border-black/10 bg-panel p-5 md:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brass text-2xl font-bold text-white shadow-md">
                {profile.isLoggedIn
                  ? profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
                  : "G"}
              </div>
              <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-white shadow-md border border-black/10">
                <GoogleLogo className="h-3.5 w-3.5" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-2xl font-bold text-ink">{profile.isLoggedIn ? profile.name : "Guest User"}</h3>
                {profile.isLoggedIn ? (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-600/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    Google Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-medium text-mute">
                    Not connected
                  </span>
                )}
              </div>
              <p className="text-xs text-mute mt-0.5 font-mono">
                {profile.isLoggedIn ? profile.email : "Sign in to link Google Meet & Calendar"}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-paper px-2 py-0.5 font-medium text-ink border border-black/10">
                  {profile.role}
                </span>
                <span className="text-mute font-mono text-[11px]">·</span>
                <span className="text-mute text-xs">{profile.organization}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {profile.isLoggedIn ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(!editing)}
                  className="rounded-full border border-black/15 bg-paper px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-black/5 shadow-xs transition-all"
                >
                  {editing ? "Cancel" : "Edit Profile"}
                </button>
                <button
                  type="button"
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-neutral-50 shadow-xs transition-all"
                >
                  <GoogleLogo className="h-3.5 w-3.5" />
                  <span>Switch Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ isLoggedIn: false });
                    onToast("Signed out of Google account.");
                  }}
                  className="rounded-full border border-coral/30 bg-coral/10 px-3.5 py-1.5 text-xs font-semibold text-coral hover:bg-coral/20 transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="flex items-center gap-2 rounded-full border border-black/20 bg-white px-4 py-2 text-xs font-bold text-ink hover:bg-neutral-50 shadow-sm transition-all"
              >
                <GoogleLogo className="h-4 w-4" />
                <span>Sign in with Google Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Profile Editing Drawer */}
        {editing && (
          <div className="mt-4 rounded-2xl border border-brass/30 bg-paper p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-brass">Edit Display Information</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-mute mb-1">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs text-ink focus:border-brass focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-mute mb-1">Workspace Role</label>
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs text-ink focus:border-brass focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-mute mb-1">Organization</label>
                <input
                  type="text"
                  value={orgInput}
                  onChange={(e) => setOrgInput(e.target.value)}
                  className="w-full rounded-xl border border-black/15 bg-white px-3 py-1.5 text-xs text-ink focus:border-brass focus:outline-hidden"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full px-3 py-1 text-xs text-mute hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                className="rounded-full bg-brass px-4 py-1 text-xs font-bold text-white shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Section 2: Google Workspace Sync Suite */}
        <div className="mt-5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">
            Google Workspace Ingestion & Sync Suite
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {/* Google Meet */}
            <div className="rounded-2xl border border-black/10 bg-paper p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📹</span>
                  <span className="font-semibold text-xs text-ink">Google Meet Transcripts</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ meetIntegration: !profile.meetIntegration });
                    onToast(`Google Meet auto-import ${!profile.meetIntegration ? "enabled" : "disabled"}`);
                  }}
                  className={`h-5 w-9 rounded-full transition-colors p-0.5 ${profile.meetIntegration ? "bg-brass" : "bg-black/20"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${profile.meetIntegration ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="text-[11px] text-mute leading-relaxed">
                Automatically streams live meeting audio & Gemini AI transcripts directly into Nirgrantha Ingest.
              </p>
              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {profile.meetIntegration ? "Active Ingestion Hook" : "Disabled"}
              </div>
            </div>

            {/* Google Calendar */}
            <div className="rounded-2xl border border-black/10 bg-paper p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <span className="font-semibold text-xs text-ink">Google Calendar Sync</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ calendarSync: !profile.calendarSync });
                    onToast(`Google Calendar sync ${!profile.calendarSync ? "enabled" : "disabled"}`);
                  }}
                  className={`h-5 w-9 rounded-full transition-colors p-0.5 ${profile.calendarSync ? "bg-brass" : "bg-black/20"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${profile.calendarSync ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="text-[11px] text-mute leading-relaxed">
                Monitors calendar for scheduled syncs and pre-populates attendee rosters for 100% speaker attribution.
              </p>
              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {profile.calendarSync ? "Synced with Workspace" : "Disabled"}
              </div>
            </div>

            {/* Google Drive Archive */}
            <div className="rounded-2xl border border-black/10 bg-paper p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">💾</span>
                  <span className="font-semibold text-xs text-ink">Google Drive Backup</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({ driveExport: !profile.driveExport });
                    onToast(`Google Drive backup ${!profile.driveExport ? "enabled" : "disabled"}`);
                  }}
                  className={`h-5 w-9 rounded-full transition-colors p-0.5 ${profile.driveExport ? "bg-brass" : "bg-black/20"}`}
                >
                  <div className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${profile.driveExport ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
              <p className="text-[11px] text-mute leading-relaxed">
                Exports signed governance receipts, memory ledgers, and confirmed tasks to Google Drive folder.
              </p>
              <div className="text-[10px] font-mono text-emerald-800 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                {profile.driveExport ? "Drive / Nirgrantha /" : "Disabled"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Slack Webhook & Tracker Sync */}
      <div className="rounded-3xl border border-black/10 bg-panel p-5 md:p-6 shadow-xs space-y-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">
            Execution & Notification Destinations
          </div>
          <h3 className="font-serif text-2xl font-bold text-ink mt-0.5">Slack Webhook Integration</h3>
          <p className="text-xs text-mute mt-1">
            Incoming Webhook used to dispatch confirmed tasks, weekly rollups, and Governance Gate halt warnings directly to your team channel.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={webhook}
            onChange={(e) => onWebhookChange(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="flex-1 rounded-2xl border border-black/15 bg-paper px-4 py-2.5 font-mono text-xs text-ink focus:border-brass focus:outline-hidden"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSaveWebhook}
              className="rounded-2xl bg-ink px-4 py-2.5 text-xs font-bold text-paper hover:bg-black/80 shadow-xs"
            >
              Save Webhook
            </button>
            <button
              type="button"
              onClick={onTestWebhook}
              className="rounded-2xl border border-black/20 bg-paper px-4 py-2.5 text-xs font-semibold text-ink hover:border-black/40 shadow-xs"
            >
              Test Connection
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 pt-2 text-xs">
          <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-paper p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.gateAlerts}
              onChange={(e) => onUpdateProfile({ gateAlerts: e.target.checked })}
              className="accent-brass"
            />
            <span className="text-ink font-medium">Alert on Governance Gate Halt</span>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-paper p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.safetyBrakeAutoHold}
              onChange={(e) => onUpdateProfile({ safetyBrakeAutoHold: e.target.checked })}
              className="accent-brass"
            />
            <span className="text-ink font-medium">Reminder Safety Brake Active</span>
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-black/10 bg-paper p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.digestSlack}
              onChange={(e) => onUpdateProfile({ digestSlack: e.target.checked })}
              className="accent-brass"
            />
            <span className="text-ink font-medium">Post Monday Morning Digests</span>
          </label>
        </div>
      </div>

      {/* Section 4: Workspace Collaborators */}
      <div className="rounded-3xl border border-black/10 bg-panel p-5 md:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-brass">
              Team Directory
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink">Active Workspace Members</h3>
          </div>
          <span className="rounded-full bg-paper border border-black/10 px-3 py-1 text-xs text-mute font-mono">
            6 seats
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 pt-1">
          {/* Current User */}
          <div className="flex items-center gap-3 rounded-2xl border border-brass/40 bg-brass/5 p-3">
            <div className="relative">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-brass text-xs font-bold text-white shadow-xs">
                {profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white shadow-xs">
                <GoogleLogo className="h-2.5 w-2.5" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-bold text-ink">{profile.name}</span>
                <span className="rounded bg-brass px-1 text-[9px] font-bold text-white uppercase">You</span>
              </div>
              <p className="truncate text-[10px] text-mute">{profile.role}</p>
            </div>
          </div>

          {/* Roster members */}
          {[
            { name: "Priya Shah", role: "Product Lead", hue: "#F472B6", initials: "PS" },
            { name: "Arjun Mehta", role: "Engineering Lead", hue: "#60A5FA", initials: "AM" },
            { name: "Meera Iyer", role: "QA Lead", hue: "#34D399", initials: "MI" },
            { name: "Kabir Khan", role: "Growth Lead", hue: "#FBBF24", initials: "KK" },
            { name: "Anika Rao", role: "Marketing Lead", hue: "#A78BFA", initials: "AR" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-3 rounded-2xl border border-black/10 bg-paper p-3">
              <div className="grid h-10 w-10 place-items-center rounded-full text-xs font-bold text-ink shadow-xs" style={{ background: m.hue }}>
                {m.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-bold text-ink">{m.name}</div>
                <p className="truncate text-[10px] text-mute">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GoogleLoginModal({
  currentProfile,
  onLogin,
  onClose,
}: {
  currentProfile: UserProfile;
  onLogin: (profile: UserProfile) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"signin" | "guide">("signin");
  const [useCustom, setUseCustom] = useState(false);
  const [name, setName] = useState(currentProfile.name || "Arihant Mahajan");
  const [email, setEmail] = useState(currentProfile.email || "arihant.mahajan@gmail.com");

  // Check if real Google Client ID is configured
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleContinue = () => {
    onLogin({
      ...currentProfile,
      isLoggedIn: true,
      name: name.trim() || "Arihant Mahajan",
      email: email.trim() || "arihant.mahajan@gmail.com",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl border border-black/15 bg-white p-6 shadow-2xl space-y-4 text-ink">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GoogleLogo className="h-6 w-6" />
            <h3 className="font-serif text-2xl font-bold text-ink">Google Authentication</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-mute hover:bg-neutral-100 hover:text-ink text-sm"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-2xl bg-neutral-100 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 rounded-xl py-1.5 font-bold transition-all ${
              tab === "signin" ? "bg-white text-ink shadow-xs" : "text-mute hover:text-ink"
            }`}
          >
            Sign In Account
          </button>
          <button
            type="button"
            onClick={() => setTab("guide")}
            className={`flex-1 rounded-xl py-1.5 font-bold transition-all ${
              tab === "guide" ? "bg-white text-ink shadow-xs" : "text-mute hover:text-ink"
            }`}
          >
            OAuth Setup Guide
          </button>
        </div>

        {tab === "signin" ? (
          <>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Sign in with your Google account to connect <span className="font-semibold text-ink">Nirgrantha</span>. This allows automated transcript ingestion from Google Meet and sync with Google Calendar.
            </p>

            {clientId && (
              <div className="rounded-2xl border border-emerald-600/30 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="font-medium">Real Google OAuth Client ID active from .env</span>
              </div>
            )}

            {!useCustom ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-left transition-all hover:border-neutral-400 hover:bg-neutral-100"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-brass text-sm font-bold text-white shadow-xs">
                    AM
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-ink truncate">Arihant Mahajan</div>
                    <div className="text-xs text-neutral-500 font-mono truncate">arihant.mahajan@gmail.com</div>
                  </div>
                  <span className="rounded-full bg-brass/10 border border-brass/30 px-2 py-0.5 text-[10px] font-bold text-brass">
                    Workspace Owner
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className="w-full rounded-2xl border border-neutral-200 p-2.5 text-center text-xs text-neutral-600 hover:bg-neutral-50 font-medium transition-all"
                >
                  + Sign in with custom Google Account
                </button>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-neutral-200 p-4 bg-neutral-50">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Arihant Mahajan"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-ink focus:border-brass focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Google Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="arihant@example.com"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs text-ink focus:border-brass focus:outline-hidden"
                  />
                </div>
                <div className="flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={() => setUseCustom(false)}
                    className="text-xs text-mute hover:text-ink"
                  >
                    ← Back to default account
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl border border-neutral-300 px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-2.5 text-xs font-bold text-white hover:bg-black/90 shadow-md transition-all"
              >
                <GoogleLogo className="h-4 w-4" />
                <span>Continue with Google</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3 text-xs leading-relaxed">
            <p className="text-neutral-700 font-medium">
              Follow these simple steps in Google Cloud to generate your real OAuth 2.0 Client ID:
            </p>
            <ol className="space-y-2 list-decimal list-inside text-neutral-600 bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200">
              <li>
                Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-brass font-bold underline">Google Cloud Console Credentials</a>.
              </li>
              <li>
                Click <strong>Create Credentials</strong> ➔ <strong>OAuth client ID</strong>.
              </li>
              <li>
                Select <strong>Web application</strong> as the Application Type.
              </li>
              <li>
                Under <strong>Authorized JavaScript origins</strong>, add: <code className="bg-white px-1.5 py-0.5 rounded border border-neutral-200 font-mono text-[11px]">http://localhost:3000</code>.
              </li>
              <li>
                Copy the generated Client ID (ends with <code className="font-mono text-[11px]">.apps.googleusercontent.com</code>).
              </li>
              <li>
                Add it to your <code className="font-mono text-[11px]">.env</code> file:
                <pre className="mt-1 bg-white p-2 rounded-xl border border-neutral-200 font-mono text-[10px] text-ink overflow-x-auto">NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com</pre>
              </li>
            </ol>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className="w-full rounded-2xl bg-brass py-2 text-center text-xs font-bold text-white shadow-xs"
              >
                Done / Return to Sign In
              </button>
            </div>
          </div>
        )}

        <p className="text-[10px] text-center text-neutral-400">
          Nirgrantha uses Google OAuth 2.0 to securely access meeting audio and calendar metadata.
        </p>
      </div>
    </div>
  );
}

function PersonLine({ person, dark }: { person: Person; dark?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-full text-xs text-ink" style={{ background: person.hue }}>{person.initials}</span>
      <div>
        <div className={dark ? "text-sm text-[#1a140f]" : "text-sm"}>{person.name}</div>
        <div className={dark ? "text-xs text-[#8a7560]" : "text-xs text-mute"}>{person.role}</div>
      </div>
    </div>
  );
}

function Empty({ title, body, onIngest }: { title: string; body: string; onIngest: () => void }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-panel p-6">
      <h2 className="font-serif text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-mute">{body}</p>
      <button className="mt-4 rounded-full bg-brass px-4 py-2 text-sm font-medium text-paper" type="button" onClick={onIngest}>Go to ingest</button>
    </div>
  );
}

function weekStart(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const diff = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - diff);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type SpeechHandle = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
};
