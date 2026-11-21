# ⚡ Nirgrantha: Autonomous Meeting-to-Execution Agent

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?style=for-the-badge&logo=google)](https://aistudio.google.com/)
[![Slack Integration](https://img.shields.io/badge/Slack-Webhook%20Live-4A154B?style=for-the-badge&logo=slack)](https://api.slack.com/)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deploy%20Ready-black?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Decisions made in meetings get lost.** Nirgrantha is an autonomous meeting-to-execution AI agent that holds cross-meeting memory, eliminates natural speech slips, prevents contradictory commitments from reaching task trackers, and dispatches verified work directly to trackers and Slack.

---

## 📌 Problem Statement: Track 03 (Meeting-to-Execution Agent)

> *"Decisions made in meetings get lost. Teams must build: transcript ingestion with speaker attribution; extraction of decisions, action items, owners, and deadlines; detection of conflicts with earlier decisions stored in memory; creation of tasks in a tracker through an integration; reminders before deadlines; a weekly digest per person; a confirmation step before anything gets posted.*
>
> *The cross-meeting memory and conflict detection are what make this a real system rather than a transcript summarizer."*

---

## 💥 The Real-World Problem vs. The Solution

### The Problem: AI Meeting Amnesia
Today, AI meeting summarizers (Otter, Zoom AI, Fireflies) listen to meetings in isolation. They have **zero cross-meeting memory**.

**A Typical Team Disaster:**
1. **Nov 3 (Strategy Sync)**: The team formally locks the product launch date to **Nov 28**, caps the marketing spend at **₹5,00,000**, and standardizes on **PostgreSQL**.
2. **Nov 21 (Casual Sync)**: Three weeks later, someone casually says: *"Let's move launch to Dec 5"*, *"Let's spend 8 Lakh on marketing"*, and *"Let's just switch to MongoDB"*.
3. **The Failure**: Traditional AI files a tidy summary and blindly dumps these contradictory tasks into Jira or Linear. Nobody realizes this violates commitments made 3 weeks ago. QA tests against the wrong deadline, marketing overspends, and engineers build conflicting databases.

### The Solution: Nirgrantha's Active Governance
Nirgrantha recognizes that **the summary is only the input; memory and governance are the product**:
- It maintains an immutable **Cross-Meeting Memory Ledger** of historical decisions still in force.
- It repairs conversational speech slips before extraction (drops *"Dec 2"*, captures *"Dec 5"*).
- It compares proposed tasks against the ledger and **halts at a Human Governance Gate** when contradictions are detected.
- It calculates the **Blast Radius** on downstream work and triggers an automated **Reminder Safety Brake**, pausing notifications for contested tasks so teams don't build the wrong thing on time.
- It dispatches confirmed, verified tasks to Slack and trackers only after human confirmation.

---

## 🧠 The 7-Sub-Agent Architecture & Inner Workings

Nirgrantha runs a coordinated multi-agent pipeline of 7 specialized sub-agents:

```
                  [Messy Audio / Speech / Transcript]
                                  ↓
       1. Ingest Agent (Speaker Attribution: Priya, Arjun, Meera, Kabir, Anika)
                                  ↓
       2. Speech Repair Agent (Scrubs verbal slips: "Dec 2... wait, Dec 5" ➔ Dec 5)
                                  ↓
       3. Extractor Agent (Extracts Decisions, Tasks, Owners, ISO Deadlines)
                                  ↓
       4. Cross-Meeting Memory Agent (Compares against Nov 3 in-force ledger)
                                  ↓
       5. Conflict Critic (Flags true contradictions vs. valid scoped exceptions)
                                  ↓
       6. Blast Radius Agent (Maps task dependencies & activates Reminder Brake)
                                  ↓
       7. Governance Gate Agent (Halts execution until human decision is made)
                                  ↓
     [Verified Execution ➔ Slack Webhook (#all-arihant) + Tracker Board / Linear / n8n]
```

### Detailed Agent Duties:
1. **Ingest Agent**: Attributes spoken dialogue to team members using Web Speech API or Wispr Flow transcript formats.
2. **Speech Repair Agent**: Resolves conversational self-corrections (keeps *"Thursday"*, drops *"Wednesday"*; keeps *"December 5"*, drops *"2 Dec 2026"*).
3. **Extractor Agent**: Extracts clean structured JSON with ISO 8601 deadlines (`YYYY-MM-DD`). Suppresses non-tasks (e.g. *"Don't spend the eight lakh"* is parsed as a constraint, not an action item).
4. **Cross-Meeting Memory Agent**: Interrogates the active ledger. Evaluates proposed changes against active commitments.
5. **Conflict Critic**: Detects semantic contradictions with severity ratings. Crucially distinguishes true conflicts from valid exceptions (e.g., recognizing a ₹3,600 pricing exception as non-conflicting with the ₹4,200 list price).
6. **Blast Radius Agent**: Maps which downstream tasks break if a decision changes (e.g., slipping the launch date impacts Meera's QA task). Automatically places reminders on **HELD** status.
7. **Governance Gate Agent**: Stops the pipeline cold. Presents the blast radius and human choices (*Supersede*, *Keep Prior*, or *Defer*). Nothing reaches trackers without human signoff.

---

## 🔑 Configured API Keys & Integrations

> **Security Note:** Real API keys are stored strictly in `.env` (which is `.gitignore` protected and never committed). Only variable names are documented here:

| Environment Variable | Provider / Platform | Purpose & Live Usage |
| :--- | :--- | :--- |
| **`GEMINI_API_KEY`** | **Google Gemini 2.5 / 1.5 Flash** | Powers the floating **Nirgrantha AI Copilot (`✨`)** in the bottom-right corner. It injects full real-time context of the in-force memory ledger, pending contradictions, and held reminders so users or judges can ask doubts about meeting decisions, blast radius calculations, or agent governance in natural language. |
| **`WEBHOOK_URL`** | **Slack Incoming Webhook** | Connects Nirgrantha directly to your team's Slack channel (`#all-arihant`). When the Governance Gate confirms decisions, it dispatches live Markdown receipts containing rewritten tasks, superseded deadlines, and held reminder alerts. (Also compatible with **n8n / Zapier**). |
| **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`** *(Architecture / Ready)* | **Google Identity Services (OAuth 2.0)** | Enables Google Workspace account authentication in **Profile & Settings** to integrate Google Calendar meeting sync and Google Meet transcript ingestion with the user profile (*Arihant Mahajan*). |

---

## 🛠️ Complete Tech Stack

- **Frontend & App Shell:** Next.js 15 (App Router), React 19, TypeScript 5.8
- **Styling & Layout:** Tailwind CSS 3.4
  - **Fixed App Shell:** Viewport-locked layout (`h-screen overflow-hidden`) with a permanent **Fixed Header** (brand, profile, agent cockpit) and **Fixed Footer** (system telemetry, memory in force, safety brake status).
  - **Independently Scrollable Center:** Only the workspace content area scrolls.
  - **Editorial Palette:** `paper` (`#f6f1e8`), `ink` (`#1c1612`), `brass` (`#8d5e12`), `coral` (`#c2412d`), `sage` (`#1c7a4a`).
- **AI & NLP Engine:** Google Gemini 2.5 & 1.5 Flash via direct Google REST API (zero bloated dependencies) with an offline heuristic fallback engine for 100% demo uptime.
- **Audio & Native Web APIs:** Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`) supporting live voice dictation with Indian English (`en-IN`) acoustic models.
- **Data Persistence:** Serverless-resilient state engine (`lib/store.ts`) that detects Vercel, AWS Lambda, or Netlify and routes state through `/tmp/kept-store.json` with an in-memory fallback, preventing read-only file system (`EROFS`) crashes in production.
- **External Webhooks:** Slack BlockKit Markdown dispatcher, n8n automation webhook compatible, Google Workspace integration suite.
- **Automated Validation:** Custom TSX validation harness (`scripts/check-pipeline.ts`) asserting 100% compliance across all 7 rubric points.

---

## 🖥️ End-to-End Application Walkthrough

### 1. Welcome Page & Gate Agreement
- Editorial hero section explaining meeting amnesia.
- 4 real-time metrics, 6 architectural capability cards, and a horizontal 7-step pipeline.
- Collapsible Terms & Conditions accordion requiring user agreement before unlocking the platform.

### 2. The In-Force Room (`🏛️`)
- Displays the active historical ledger locked on Nov 3 (Launch: 28 Nov, Budget: ₹5L, Database: Postgres).
- Displays the scoped ₹3,600 pricing exception (recognized as non-conflicting).

### 3. Ingest & Speech Repair (`🎙️`)
- Supports loading sample meetings, uploading custom transcripts, or live microphone dictation.
- Shows real-time speaker attribution and visual speech-repair diffs.

### 4. Agent Trace (`⚡`)
- Displays the internal 7-step reasoning steps of the multi-agent pipeline with guardrail suppression logs.

### 5. Governance Gate (`🛡️`)
- Halts execution when contradictions occur.
- Displays the 3 conflicts (date slip, budget spike, database switch) and maps their Blast Radius.
- Provides recommended calls (*Supersede launch date*, *Keep Postgres*, *Defer budget*).

### 6. Tracker Board (`📋`)
- Displays confirmed tasks. Meera's QA task is automatically rewritten with the new deadline; the MongoDB switch is rejected. Supports Linear and CSV export.

### 7. Reminder Safety Brake (`⏰`)
- Displays scheduled reminders. Automatically pauses (**HELD**) reminders on tasks tied to contested decisions.

### 8. Weekly Digests (`👤`)
- Generates individualized Monday morning executive digests for Priya, Arjun, Meera, Kabir, and Anika.

### 9. Profile & Settings (`⚙️`)
- Shows authenticated Google profile (**Arihant Mahajan · Google Workspace Connected**).
- Toggles for Google Meet transcripts, Google Calendar sync, and Google Drive backup.
- Live Slack Webhook configuration with connection testing.

### 10. Gemini AI Copilot (`✨`)
- Floating assistant in the bottom-right corner powered by Gemini 2.5 Flash. Context-aware doubt solver for decisions, contradictions, and system architecture.

---

## 🚀 Where & How We Deploy

### Deploying to Vercel (Recommended)

Nirgrantha is engineered to be 100% cloud-ready with zero serverless filesystem crashes:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **Add New Project** ➔ Import your repository.
3. In **Environment Variables**, add:
   - `GEMINI_API_KEY` = *your Google Gemini API key*
   - `WEBHOOK_URL` = *your Slack webhook URL*
4. Click **Deploy**.
5. **How Storage Works on Vercel:** Nirgrantha automatically detects `VERCEL=1` and writes mutable state to `/tmp/kept-store.json` with an in-memory fallback. This completely eliminates the `EROFS: read-only file system` crash that plagues standard Node apps on Vercel serverless functions!

### Deploying to AWS Lambda / Netlify / Render
The state engine in `lib/store.ts` also natively detects `AWS_LAMBDA_FUNCTION_NAME` and `NETLIFY`, ensuring seamless zero-config deployment across any cloud provider.

---

## 💻 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/arihantmahajan585m/AGENTIC-AI.git
cd AGENTIC-AI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 4. Run automated pipeline verification
```bash
npm run check
```

### 5. Start the local server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Automated Test Assertions (`npm run check`)

The test harness runs end-to-end assertions against the pipeline:
- ✅ Decision extraction (`launch_date=2026-12-05`, `budget=800000`, `database=mongo`)
- ✅ Task extraction with speaker attribution and deadline normalization
- ✅ Speech correction retention (keeps "December 5", drops "2 Dec 2026")
- ✅ Blast radius mapping (`task_qa` tied to launch date slip)
- ✅ Scoped pricing exception recognition (₹3,600 recognized as valid)

---

## 🏆 Hackathon Track 03 Rubric Matrix

| Hackathon Requirement | Implementation in Nirgrantha | Status |
| :--- | :--- | :--- |
| **Transcript ingestion with speaker attribution** | Web Speech API, Wispr Flow, speaker attribution parser | ✅ 100% Verified |
| **Extraction of decisions, action items, owners, deadlines** | Extractor Agent with ISO 8601 date normalizer | ✅ 100% Verified |
| **Detection of conflicts with earlier decisions in memory** | Cross-Meeting Memory Agent & Conflict Critic | ✅ 100% Verified |
| **Creation of tasks in a tracker through an integration** | Tracker Board, CSV/Linear export, Slack Webhook dispatch | ✅ 100% Verified |
| **Reminders before deadlines (with brake for challenged work)** | Reminder Safety Brake holding blast radius tasks | ✅ 100% Verified |
| **A weekly digest per person** | Algorithmic Monday rollups for each team member | ✅ 100% Verified |
| **Confirmation step before anything gets posted** | Human-in-the-loop Governance Gate with blast radius preview | ✅ 100% Verified |

---

## 📄 License
This project is open-source under the [MIT License](LICENSE). Built for the Product Space Agentic AI Hackathon.
