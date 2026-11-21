# ⚡ Nirgrantha: Autonomous Meeting-to-Execution Agent
### *Decisions Made in Meetings Get Lost. Nirgrantha Remembers.*

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS 3.4](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange?style=flat&logo=google)](https://aistudio.google.com/)
[![Slack Integration](https://img.shields.io/badge/Slack-Live%20Webhook-4A154B?style=flat&logo=slack)](https://api.slack.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📌 Problem Statement: Track 03 (Meeting-to-Execution Agent)

> **"Decisions made in meetings get lost. Teams must build:**
> - Transcript ingestion with speaker attribution;
> - Extraction of decisions, action items, owners, and deadlines;
> - Detection of conflicts with earlier decisions stored in memory;
> - Creation of tasks in a tracker through an integration;
> - Reminders before deadlines (with a brake for challenged work);
> - A weekly digest per person;
> - A confirmation step before anything gets posted.
> 
> *The cross-meeting memory and the conflict detection are what make this a real system rather than a transcript summarizer."*

---

## 🛑 The Core Problem: Why Standard AI Summarizers Fail

Most modern teams use AI meeting tools like Otter.ai, Fireflies, or Zoom AI. But these tools suffer from **catastrophic meeting amnesia**:
- They process meetings in silos with zero historical awareness.
- **The Failure Scenario:**
  - On **Nov 3**, your leadership locks the launch to **Nov 28**, sets a **₹5,00,000** budget cap, and standardizes on **PostgreSQL**.
  - On **Nov 21**, in a casual engineering sync, someone says: *"Let's move launch to December 5"*, *"Let's spend ₹8 Lakh"*, and *"Let's just switch to MongoDB"*.
  - A traditional summarizer writes a tidy note and blindly dumps those contradictory tasks into Jira or Linear.
  - QA tests against the wrong date, marketing overspends, and developers build contradictory features.
- **The Core Insight:** A summary is merely an input. **Cross-meeting memory, conflict critic detection, and human governance are the actual product.**

---

## 💡 The Solution: Nirgrantha

**Nirgrantha** is an autonomous meeting-to-execution governance agent. It guarantees that:
1. Historical decisions locked in previous meetings are preserved in an immutable memory ledger.
2. Natural speech slips (*"Dec 2... no wait, Dec 5"*) are automatically repaired.
3. Every new meeting proposal is compared against cross-meeting memory.
4. Contradictions trigger an immediate **halt at a Human Governance Gate** — nothing touches Jira, Linear, or Slack until an authorized human decides to *Supersede*, *Keep Prior*, or *Defer*.
5. An automated **Reminder Safety Brake** halts deadline reminders on tasks affected by contested decisions to prevent teams from building the wrong thing on time.

---

## 🧠 The 7-Sub-Agent Pipeline Architecture

Nirgrantha orchestrates 7 specialized sub-agents in a sequential reasoning pipeline:

```
                  ┌────────────────────────────────────────┐
                  │      Messy Transcript / Live Audio     │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 1. Ingest Agent                        │
                  │    • Multi-speaker attribution         │
                  │    • Audio normalizer (Web Speech)     │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 2. Speech Repair Agent                 │
                  │    • Scrubs verbal slips & false starts│
                  │    • "Dec 2... wait, Dec 5" ➔ Dec 5    │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 3. Extractor Agent                     │
                  │    • Decisions, tasks, owners, dates   │
                  │    • Suppresses conditional hedges     │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 4. Cross-Meeting Memory Agent          │
                  │    • Compares against Nov 3 ledger     │
                  │    • Verifies in-force commitments     │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 5. Conflict Critic Agent               │
                  │    • Identifies true contradictions    │
                  │    • Suppresses valid scoped exceptions│
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 6. Blast Radius Agent                  │
                  │    • Maps downstream task dependencies │
                  │    • Activates Reminder Safety Brake   │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ 7. Governance Gate Agent (HALT)        │
                  │    • Human reviews blast radius        │
                  │    • Calls: Supersede / Keep / Defer   │
                  └───────────────────┬────────────────────┘
                                      │
                        ┌─────────────┴─────────────┐
                        ▼                           ▼
            ┌───────────────────────┐   ┌───────────────────────┐
            │ Confirmed Tasks Board │   │ Live Slack Webhook    │
            │ (Linear / CSV Export) │   │ Dispatch (#channel)   │
            └───────────────────────┘   └───────────────────────┘
```

---

## 🔑 API Keys Added & What They Connect To

| Environment Variable | Service / Provider | Connected Target | Purpose & Functionality |
| :--- | :--- | :--- | :--- |
| **`GEMINI_API_KEY`** | **Google Gemini AI** | `generativelanguage.googleapis.com` (Gemini 2.5 Flash) | Powers the interactive **Ask AI Copilot (`✨`)** in the bottom-right corner. It injects full real-time context of in-force decisions, pending gate conflicts, and held reminders so users can ask doubts about decisions or system architecture. |
| **`WEBHOOK_URL`** | **Slack API** | Slack Incoming Webhook (`#all-arihant`) | Automatically dispatches formatted Markdown execution receipts into Slack the second a human confirms decisions at the **Governance Gate**. Posts rewritten tasks, superseded deadlines, rejected proposals, and held reminder notices. |
| **`NEXT_PUBLIC_GOOGLE_CLIENT_ID`** *(Optional)* | **Google Cloud Platform** | Google Identity Services (OAuth 2.0) | Connects Google Workspace in **Profile & Settings** for syncing Google Calendar events and Google Meet transcripts with the user's profile (*Arihant Mahajan*). |

---

## 🛠️ Complete Tech Stack

- **Framework**: [Next.js 15.5](https://nextjs.org/) (App Router, Server Actions, Serverless API Routes)
- **Frontend Core**: [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/)
- **Styling & Design**: [Tailwind CSS 3.4](https://tailwindcss.com/)
  - Custom palette: `paper` (`#f6f1e8`), `ink` (`#1c1612`), `brass` (`#8d5e12`), `coral` (`#c2412d`), `sage` (`#1c7a4a`)
  - **App Shell Architecture**: Pinned Top Header, Pinned Bottom Footer, and independently scrollable central workspace
- **Generative AI & LLM**: Google Gemini 2.5 / 1.5 Flash via native REST client with local contextual heuristic fallback engine
- **Audio & Speech Engine**: Native Web Speech API (`webkitSpeechRecognition`) supporting live voice transcription with Indian English (`en-IN`) acoustic models
- **Backend & Storage**: Serverless-resilient state engine (`lib/store.ts`) with `/tmp` filesystem routing and in-memory persistence (preventing read-only `EROFS` crashes on Vercel/AWS Lambda)
- **Workflow Automation & Webhooks**: Compatible with Slack Incoming Webhooks, **n8n**, Linear, and CSV exports

---

## 🖥️ How It Works: Complete User Journey

### 1. The Welcome Landing Page
- Explains the lost decision problem through an editorial hero section, 4 metric cards, and 6 core capability cards.
- Users review the **Terms & Conditions** disclosure covering cross-meeting memory retention and click **"Enter the Platform →"** to access the system.

### 2. The Command Workspace (Fixed Header & Footer)
- **Fixed Top Header**: Displays the brand mark (`⚡`), active Google profile (**Arihant Mahajan · Google Connected**), Alignment Score gauge (**28% Contested**), and a live visual 7-subagent pipeline connector.
- **Fixed Bottom Footer**: Displays live system telemetry (`Cross-Meeting Memory Active` · `Governance Gate Armed` · `Safety Brake Active`).
- **Middle Workspace**: The left navigation sidebar and main view area scroll independently between the pinned header and footer.

### 3. The 7 Views
- **🏛️ Room**: View in-force historical commitments (Nov 3 decisions: Nov 28 Launch, ₹5L Budget, PostgreSQL) and valid scoped exceptions (₹3,600 price exception).
- **🎙️ Ingest**: Load sample meeting transcripts or use live microphone dictation. Demonstrates automatic speaker attribution and natural speech repair.
- **⚡ Agent Trace**: Step-by-step transparency into the 7 sub-agents' internal reasoning chains.
- **🛡️ Governance Gate**: When a meeting contradicts memory, the agent **halts**. Displays the 3 conflicts and their blast radius, providing 1-click recommended resolutions (*Supersede*, *Keep Prior*, *Defer*).
- **📋 Tracker Board**: Confirmed tasks are posted here. The launch date is updated to Dec 5, Meera's QA task is automatically rewritten with a new deadline, and MongoDB is rejected.
- **⏰ Reminders Brake**: Demonstrates the safety brake in action. Reminders for tasks tied to contested decisions are automatically held until confirmed.
- **👤 Weekly Digests**: Generates automated per-person Monday morning summaries for each team lead.
- **⚙️ Profile & Settings**: Manage Google Workspace connections, Google Calendar sync, and Slack Webhook endpoints.
- **✨ Gemini AI Copilot**: Floating assistant in the bottom-right answering doubts in real time.

---

## 🚀 How to Deploy

Nirgrantha is architected with a **serverless-resilient storage engine** (`lib/store.ts`) that automatically detects production cloud environments and routes file writes to `/tmp`, preventing read-only file system (`EROFS`) errors.

### Deploying on Vercel (Recommended)

1. Push this repository to GitHub:
   ```bash
   git remote add origin https://github.com/arihantmahajan585m/AGENTIC-AI.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com/) and click **Add New > Project**.
3. Import your `AGENTIC-AI` repository.
4. Add your Environment Variables:
   - `GEMINI_API_KEY`: Your Google Gemini API key
   - `WEBHOOK_URL`: Your Slack Incoming Webhook URL
5. Click **Deploy**. Your app will be live within 60 seconds!

---

## 🧪 Local Setup & Automated Verification

### 1. Clone & Install
```bash
git clone https://github.com/arihantmahajan585m/AGENTIC-AI.git
cd AGENTIC-AI
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your free API keys into `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_URL=https://hooks.slack.com/services/...
```

### 3. Run Automated Pipeline Test
Run the automated test suite verifying all 7 track rubric requirements:
```bash
npm run check
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Hackathon Track 03 Rubric Checklist

| Hackathon Rubric Requirement | Nirgrantha Implementation | Status |
| :--- | :--- | :--- |
| **1. Transcript ingestion with speaker attribution** | Web Speech API & Wispr Flow parser attributing turns to Priya, Arjun, Meera, Kabir, Anika | ✅ Verified |
| **2. Extraction of decisions, action items, owners, deadlines** | Extractor Agent with ISO 8601 deadline normalizer | ✅ Verified |
| **3. Detection of conflicts with earlier decisions in memory** | Cross-Meeting Memory Agent & Conflict Critic with false-alarm suppression | ✅ Verified |
| **4. Creation of tasks in a tracker through an integration** | Confirmed tasks posted to Tracker Board and dispatched via Slack Webhook | ✅ Verified |
| **5. Reminders before deadlines (with brake for challenged work)** | Reminder Safety Brake holds reminders on tasks in the blast radius | ✅ Verified |
| **6. A weekly digest per person** | Algorithmic Monday digests grouped by team lead | ✅ Verified |
| **7. A confirmation step before anything gets posted** | Human Governance Gate halting autonomous posting on contradictions | ✅ Verified |

---

## 👥 Authors & License
- **Author**: Arihant Mahajan
- **Event**: Product Space Agentic AI Hackathon
- **Track**: Track 03 — Meeting-to-Execution Agent
- **License**: MIT License
