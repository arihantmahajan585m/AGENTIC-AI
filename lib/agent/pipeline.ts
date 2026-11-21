import { extractCommitments, parseTurns } from "./extract";
import { findConflicts, sameTopicNote } from "./conflicts";
import { personById } from "../people";
import type { Decision, Meeting, Person, Proposal, Task } from "../types";
import { uid } from "../format";

export function runPipeline(input: {
  transcript: string;
  title: string;
  meetingDate: string;
  people: Person[];
  decisions: Decision[];
  tasks: Task[];
  meetings: Meeting[];
}): Proposal {
  const turns = parseTurns(input.transcript, input.people, input.meetingDate);
  const extracted = extractCommitments(turns, input.people, input.meetingDate);
  const decisions = extracted.decisions;
  const conflicts = findConflicts(decisions, input.decisions, input.tasks, input.meetingDate);
  const launchRewrite = conflicts.some((c) => c.topic === "launch_date" && c.rewrites.length > 0);
  const tasks = launchRewrite
    ? extracted.tasks.filter((task) => !/redo design qa/i.test(task.title))
    : extracted.tasks;
  const corrections = turns.flatMap((t) => t.corrections.map((note) => `${t.speakerName}: ${note}`));
  const governing = input.decisions.filter((d) => d.status === "active" && !d.exceptionTo);
  const exceptionNote = sameTopicNote(input.decisions);
  const name = (id: string) => personById(input.people, id)?.first || "Someone";

  const meeting: Meeting = {
    id: uid("meet"),
    title: input.title,
    date: input.meetingDate,
    transcript: input.transcript,
    attendeeIds: [...new Set(turns.map((t) => t.speakerId).filter((id) => id !== "room"))],
  };

  const steps = [
    {
      id: "ingest",
      agent: "Ingest",
      title: "Read the room",
      detail: `${turns.length} speaker turns from ${meeting.attendeeIds.length || 1} people. Fillers dropped. Nothing posted.`,
      evidence: turns.map((t) => `${t.speakerName}: ${t.cleaned}`),
    },
    {
      id: "repair",
      agent: "Speech repair",
      title: "Keep the correction, drop the stumble",
      detail: corrections.length
        ? "Self-corrections were resolved before anything was extracted. The first number said out loud is not the decision."
        : "No self-corrections in this transcript.",
      evidence: corrections.length ? corrections : ["Speech was already clean."],
    },
    {
      id: "extract",
      agent: "Extractor",
      title: "Decisions, owners, deadlines",
      detail: `${decisions.length} decision${decisions.length === 1 ? "" : "s"} and ${tasks.length} action${tasks.length === 1 ? "" : "s"}. Questions and asides were left out.`,
      evidence: [
        ...decisions.map((d) => `${name(d.speakerId)} · ${d.text}`),
        ...tasks.map((t) => `${name(t.ownerId)} · ${t.title}${t.deadline ? ` · ${t.deadline}` : ""}`),
      ],
      guardrails: extracted.suppressed.map((s) => `Guardrail suppressed: “${s.text}” · ${s.reason}`),
    },
    {
      id: "memory",
      agent: "Memory",
      title: "What earlier meetings already locked",
      detail: `${governing.length} governing decision${governing.length === 1 ? "" : "s"} retrieved from ${input.meetings.length} earlier meeting${input.meetings.length === 1 ? "" : "s"}.`,
      evidence: [
        ...governing.map((d) => `${d.display} · ${d.text}`),
        ...(exceptionNote ? [exceptionNote] : []),
      ],
    },
    {
      id: "critic",
      agent: "Conflict critic",
      title: conflicts.length ? "This meeting argues with memory" : "Nothing here contradicts memory",
      detail: conflicts.length
        ? `${conflicts.length} governing decision${conflicts.length === 1 ? "" : "s"} would change if this meeting is posted as said.`
        : "New commitments fit the decisions already in force.",
      evidence: conflicts.length
        ? conflicts.map((c) => c.explanation)
        : ["No value in this meeting replaces a value in force."],
    },
    {
      id: "blast",
      agent: "Blast radius",
      title: "Work already in flight",
      detail: conflicts.some((c) => c.blastTaskIds.length)
        ? "Open tasks bound to a challenged decision are listed before anyone posts."
        : "No open task is bound to a challenged decision.",
      evidence: conflicts.flatMap((c) =>
        c.rewrites.map((r) => {
          const task = input.tasks.find((t) => t.id === r.taskId);
          return task ? `${task.title} → ${r.title}` : r.title;
        }),
      ),
    },
    {
      id: "gate",
      agent: "Governance gate",
      title: "Halt",
      detail: "The tracker, the reminders, and the weekly digest are unchanged. A person has to resolve every conflict before anything is posted.",
      evidence: ["Posted nothing."],
    },
  ];

  return {
    meeting,
    turns,
    decisions,
    tasks,
    conflicts,
    steps,
    corrections,
    consulted: governing.map((d) => ({ id: d.id, text: d.text, display: d.display })),
    engine: process.env.GEMINI_API_KEY ? "hybrid (gemini + on-device)" : "on-device",
    suppressed: extracted.suppressed,
  };
}
