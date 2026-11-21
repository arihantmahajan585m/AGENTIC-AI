# ⚡ Nirgrantha: Autonomous Meeting-to-Execution Agent

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?style=flat&logo=google)](https://aistudio.google.com/)
[![Slack Integration](https://img.shields.io/badge/Slack-Webhook%20Ready-4A154B?style=flat&logo=slack)](https://api.slack.com/)

> **Decisions made in meetings get lost.** Nirgrantha is an autonomous meeting-to-execution AI agent that holds cross-meeting memory, eliminates natural speech slips, prevents contradictory commitments from reaching task trackers, and dispatches verified work directly to trackers and Slack.

---

## 🎯 The Core Problem

Standard AI meeting summarizers suffer from **amnesia**: they only listen to one meeting in isolation.
- On **Nov 3**, a team locks their launch date to **Nov 28**, caps the marketing budget at **₹5,00,000**, and standardizes on **PostgreSQL**.
- Three weeks later on **Nov 21**, in a casual sync, someone says: *"Let's move launch to Dec 5"*, *"Let's spend 8 Lakh"*, and *"Let's just switch to MongoDB"*.
- **The Failure**: Traditional AI files both summaries and blindly dumps contradictory work into Jira/Linear. QA tests against the wrong date, marketing overspends, and engineers build the wrong features.

**The summary is only the input. Cross-meeting memory and human governance are the actual product.**

---

## 🧠 The 7-Sub-Agent Architecture

Nirgrantha runs a coordinated 7-sub-agent pipeline:

```
[Messy Audio / Transcript]
          ↓
  1. Ingest Agent (Speaker Attribution: Priya, Arjun, Meera, Kabir, Anika)
          ↓
  2. Speech Repair Agent (Prunes speech slips: "Dec 2... no wait, Dec 5" ➔ Dec 5)
          ↓
  3. Extractor Agent (Extracts Decisions, Tasks, Owners, ISO Deadlines)
          ↓
  4. Cross-Meeting Memory Agent (Compares against Nov 3 in-force ledger)
          ↓
  5. Conflict Critic (Flags true contradictions vs. valid scoped exceptions)
          ↓
  6. Blast Radius Agent (Maps downstream task dependencies & holds reminders)
          ↓
  7. Governance Gate Agent (Halts autonomous posting until human signoff)
          ↓
[Confirmed Execution ➔ Slack Webhook + Linear / Tracker Board]
```

---

## ✨ Key Features

- **🏛️ Cross-Meeting Memory Ledger**: Maintains immutable historical decisions across multiple weeks and months.
- **🎙️ Natural Speech Repair**: Automatically corrects verbal slips, hedges, and conversational corrections before extraction.
- **🛡️ Human Governance Gate**: Strict stop-the-line mechanism. Zero tasks or updates touch external trackers without human review.
- **⏰ Reminder Safety Brake**: Automatically pauses reminders on tasks tied to challenged decisions so teams don't build the wrong thing on time.
- **👤 Per-Person Weekly Digests**: Automatically groups verified tasks, deadlines, and in-force decisions by team lead.
- **✨ Gemini AI Copilot**: Floating context-aware assistant powered by Google Gemini 2.5 Flash to answer doubts about decisions, blast radius, or architecture in real time.
- **💬 Live Slack Dispatch**: Formats and dispatches Markdown execution receipts directly to your team's Slack channels.
- **⚙️ Google Workspace Integration**: Built-in support for Google Calendar sync and Google Meet transcription ingestion.

---

## 🚀 Quickstart & Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd kept
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Add your free API keys in `.env`:
```env
# Google Gemini API Key (Powers AI Copilot in bottom-right)
GEMINI_API_KEY=your_gemini_api_key

# Slack Incoming Webhook (Posts live tasks & receipts to Slack)
WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 4. Run Automated Pipeline Test
Verify all 7 rubric capabilities pass end-to-end:
```bash
npm run check
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Pipeline Test Verification

You can verify the end-to-end meeting reasoning pipeline at any time:
```bash
npm run check
```
Assertions tested:
- ✅ Decision extraction (`launch_date=2026-12-05`, `budget=800000`, `database=mongo`)
- ✅ Task extraction with speaker attribution and deadline normalization
- ✅ Speech correction retention (keeps "December 5", drops "2 Dec 2026")
- ✅ Blast radius mapping (`task_qa` tied to launch date slip)
- ✅ Scoped pricing exception recognition (₹3,600 identified as non-conflicting)

---

## 📋 Hackathon Track 03 Rubric Coverage

| Requirement | Implementation | Status |
| :--- | :--- | :--- |
| **Transcript ingestion with speaker attribution** | Web Speech API & Wispr Flow parser | ✅ 100% |
| **Extraction of decisions, action items, owners, deadlines** | Extractor Agent with ISO date normalizer | ✅ 100% |
| **Detection of conflicts with earlier decisions in memory** | Cross-Meeting Memory Agent & Conflict Critic | ✅ 100% |
| **Creation of tasks in a tracker through an integration** | Tracker Board & Slack Webhook integration | ✅ 100% |
| **Reminders before deadlines (with brake for challenged work)** | Reminder Safety Brake holds blast tasks | ✅ 100% |
| **A weekly digest per person** | Algorithmic Monday digests per team lead | ✅ 100% |
| **Confirmation step before anything gets posted** | Human-in-the-loop Governance Gate | ✅ 100% |

---

## 📄 License
MIT License. Built for the Product Space Agentic AI Hackathon.
