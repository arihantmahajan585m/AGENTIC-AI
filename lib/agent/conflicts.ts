import { addDays, formatINR } from "../format";
import type { Conflict, Decision, ProposedDecision, Task, Topic } from "../types";
import { uid } from "../format";
import { TOPIC_LABEL } from "../types";

function governing(decisions: Decision[]): Decision[] {
  return decisions.filter((d) => d.status === "active" && !d.exceptionTo);
}

export function findConflicts(
  proposed: ProposedDecision[],
  memory: Decision[],
  tasks: Task[],
  anchor: string,
): Conflict[] {
  const conflicts: Conflict[] = [];
  for (const next of proposed) {
    const prior = governing(memory).find((d) => d.topic === next.topic && d.value !== next.value);
    if (!prior) continue;
    const open = tasks.filter((t) => t.bindsDecisionId === prior.id && t.status === "open");
    const done = tasks.filter((t) => t.bindsDecisionId === prior.id && t.status === "done");
    const rewrites = open.map((task) => rewriteFor(task, next, anchor));
    conflicts.push({
      id: uid("conf"),
      topic: next.topic,
      severity: next.topic === "scope" ? "medium" : "high",
      newDecisionId: next.id,
      priorDecisionId: prior.id,
      title: `${TOPIC_LABEL[next.topic]} is already decided`,
      explanation: explain(prior, next),
      blastTaskIds: open.map((t) => t.id),
      rewrites,
      context: done.length
        ? `${done.length} completed task stays in the record: ${done.map((t) => t.title).join("; ")}.`
        : "No completed work is tied to this decision.",
    });
  }
  return conflicts;
}

function explain(prior: Decision, next: ProposedDecision): string {
  if (prior.topic === "launch_date") {
    return `${prior.display} is the launch date in force. This meeting moves it to ${next.display}. A summarizer would file both. Nirgrantha stops the tracker until someone chooses which date the company will keep.`;
  }
  if (prior.topic === "budget") {
    const oldN = Number(prior.value);
    const newN = Number(next.value);
    const pct = oldN ? Math.round(((newN - oldN) / oldN) * 100) : 0;
    return `The cap in force is ${prior.display}. This meeting proposes ${next.display}${pct ? `, ${pct}% over the cap` : ""}. Spending tasks written against the old cap become wrong the moment this is accepted.`;
  }
  if (prior.topic === "database") {
    return `${prior.display} is the database of record. This meeting proposes ${next.display}. Later meetings will quote whichever one you leave in force.`;
  }
  if (prior.topic === "pricing") {
    return `List price is ${prior.display}. This meeting would replace it with ${next.display}. Scoped exceptions, such as a first-10-logos price, do not trip this alarm.`;
  }
  return `Memory holds “${prior.text}” (${prior.display}). This meeting says “${next.text}” (${next.display}).`;
}

function rewriteFor(
  task: Task,
  next: ProposedDecision,
  anchor: string,
): { taskId: string; title: string; deadline: string | null } {
  if (next.topic === "launch_date") {
    return {
      taskId: task.id,
      title: `Redo design QA for the ${next.display} launch`,
      deadline: addDays(next.value, -1),
    };
  }
  if (next.topic === "budget") {
    return {
      taskId: task.id,
      title: `Reset the media plan to ${formatINR(Number(next.value))}`,
      deadline: addDays(anchor, 6),
    };
  }
  return { taskId: task.id, title: task.title, deadline: task.deadline };
}

export function sameTopicNote(memory: Decision[]): string | null {
  const exception = memory.find((d) => d.topic === "pricing_exception" && d.status === "active");
  const list = governing(memory).find((d) => d.topic === "pricing");
  if (!exception || !list) return null;
  return `Checked ${exception.display} (${exception.scope || "scoped exception"}) against the ${list.display} list price. A scoped exception does not contradict the list price, so no alarm fired.`;
}

export function topicOf(value: Topic): string {
  return TOPIC_LABEL[value];
}
