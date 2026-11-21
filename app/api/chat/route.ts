import { NextResponse } from "next/server";
import type { Store } from "@/lib/types";

export const runtime = "nodejs";

type Message = {
  role: "user" | "assistant" | "model";
  content: string;
};

function generateFallbackResponse(userPrompt: string, store?: Store | null): string {
  const prompt = userPrompt.toLowerCase();

  if (prompt.includes("database") || prompt.includes("mongo") || prompt.includes("postgres")) {
    return (
      "**Why the MongoDB switch was halted:**\n\n" +
      "1. **In-force Decision**: On 3 Nov, the team formally locked **PostgreSQL** as the core database.\n" +
      "2. **Contradiction Detected**: In today's meeting, Kabir proposed switching to MongoDB to close enterprise deals faster.\n" +
      "3. **Governance Gate Intervention**: Nirgrantha identified this as a direct contradiction with an active architectural decision in cross-meeting memory. Rather than silently changing the stack, the agent halted at the human gate to require an explicit call (Keep Postgres vs. Supersede)."
    );
  }

  if (prompt.includes("brake") || prompt.includes("held") || prompt.includes("reminder")) {
    return (
      "**How the Reminder Safety Brake Works:**\n\n" +
      "When a new meeting challenges an earlier decision (e.g., proposing December 5 instead of 28 Nov for launch), any open tasks in the **blast radius** of that decision (like Meera's Design QA) are automatically **held** by the safety brake.\n\n" +
      "• **Why?** Reminding a team member to execute work that serves a contested decision causes teams to build the wrong thing on time.\n" +
      "• **Release**: Once a human confirms the resolution at the Governance Gate, the held tasks are rewritten or unblocked."
    );
  }

  if (prompt.includes("blast radius") || prompt.includes("launch") || prompt.includes("date")) {
    return (
      "**Blast Radius Analysis for the Launch Date:**\n\n" +
      "• **Active Decision**: Launch locked to 28 Nov.\n" +
      "• **Challenging Proposal**: Move launch to December 5.\n" +
      "• **Blast Radius**: Directly impacts `task_qa` (Design QA for launch). Reminders for this task are suspended until the date conflict is resolved at the Governance Gate.\n" +
      "• **Action Items**: If superseded to December 5, Meera's QA deadline is automatically recalculated and updated in the tracker."
    );
  }

  if (prompt.includes("google") || prompt.includes("sign in") || prompt.includes("login") || prompt.includes("auth")) {
    return (
      "**How to configure Real Google Sign-In:**\n\n" +
      "1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.\n" +
      "2. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.\n" +
      "3. Choose **Web application** and set Authorized JavaScript Origins to `http://localhost:3000` (and your deployed domain).\n" +
      "4. Copy your Client ID and add it to `.env`:\n" +
      "   `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com`\n" +
      "5. Restart your dev server. Google Identity Services will now open the official Google account chooser!"
    );
  }

  if (prompt.includes("agent") || prompt.includes("pipeline") || prompt.includes("7")) {
    return (
      "**Nirgrantha 7-Agent Architecture:**\n\n" +
      "1. **Ingest Agent**: Normalizes transcripts & attaches speaker attribution.\n" +
      "2. **Speech Repair Agent**: Cleans speech slips, verbal fillers, and self-corrections (keeps 'December 5', drops '2 Dec').\n" +
      "3. **Extractor Agent**: Pulls candidate decisions, action items, owners, and due dates.\n" +
      "4. **Cross-Meeting Memory Agent**: Matches proposals against the in-force historical ledger.\n" +
      "5. **Conflict Critic**: Detects contradictions, false alarms (scoped pricing exceptions), and assigns severity.\n" +
      "6. **Blast Radius Agent**: Maps downstream dependencies & holds reminders on affected tasks.\n" +
      "7. **Governance Gate Agent**: Enforces human-in-the-loop signoff before anything touches Linear, trackers, or Slack."
    );
  }

  return (
    `I am the **Nirgrantha AI Copilot**, powered by Gemini. ` +
    `I can help clarify meeting decisions, explain why the Governance Gate halted on contradictions (like the MongoDB proposal or the December 5 slip), ` +
    `analyze the Blast Radius on tasks, or explain the Reminder Safety Brake. What would you like to explore?`
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history = [], store } = body as {
      message: string;
      history?: Message[];
      store?: Store | null;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing message string" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If no API key is set, use local contextual engine
    if (!apiKey) {
      const fallback = generateFallbackResponse(message, store);
      return NextResponse.json({ reply: fallback });
    }

    // Build context summary from store if available
    let storeContext = "";
    if (store) {
      const activeDecisions = store.decisions
        .filter((d) => d.status === "active")
        .map((d) => `• [${d.topic}] ${d.display}: "${d.text}"`)
        .join("\n");
      const pendingConflicts = store.pending?.conflicts
        .map((c) => `• [${c.topic}] ${c.title}: "${c.explanation}"`)
        .join("\n");

      storeContext = `
Current System State:
Active In-Force Decisions in Memory:
${activeDecisions || "None recorded"}

Pending Gate Conflicts (Halted):
${pendingConflicts || "None currently halted"}
`;
    }

    const systemInstruction = `You are Nirgrantha AI Copilot, the intelligent meeting governance and execution assistant for Nirgrantha (a meeting-to-execution AI agent platform).
Your role is to help users resolve doubts about:
1. Meeting transcripts, extracted tasks, owners, and deadlines.
2. Contradictions between new meetings and earlier decisions stored in cross-meeting memory.
3. Why the agent halted at the Governance Gate (e.g. Postgres vs Mongo, budget increases, launch date slips).
4. The Blast Radius of decisions and why the Reminder Safety Brake holds reminders on dependent tasks.
5. The 7-step pipeline (Ingest, Speech Repair, Extractor, Memory Ledger, Conflict Critic, Blast Radius, Governance Gate).
6. Google Workspace & Slack integrations.

Always be concise, professional, insightful, and markdown-formatted with clear bullet points.
${storeContext}`;

    // Format contents for Gemini API
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [
      {
        role: "user",
        parts: [{ text: systemInstruction }],
      },
      {
        role: "model",
        parts: [{ text: "Understood. I am ready to assist the user with full context on Nirgrantha and their meeting execution." }],
      },
    ];

    // Append conversation history
    for (const h of history.slice(-6)) {
      contents.push({
        role: h.role === "assistant" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.content }],
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Try Gemini 2.5 Flash, then 1.5 Flash
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];
    let lastError: unknown = null;

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const replyText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            generateFallbackResponse(message, store);
          return NextResponse.json({ reply: replyText });
        }
      } catch (err) {
        lastError = err;
      }
    }

    // If external call failed (e.g. offline sandbox or quota), return contextual fallback
    const fallback = generateFallbackResponse(message, store);
    return NextResponse.json({ reply: fallback });
  } catch (caught) {
    return NextResponse.json(
      { reply: generateFallbackResponse("help") },
      { status: 200 }
    );
  }
}
