import fs from "fs";
import path from "path";
import { createStore } from "./seed";
import type { Proposal, Receipt, Resolution, Store } from "./types";
import { uid } from "./format";

let memoryStore: Store | null = null;

function getStoreFilePath(): string {
  // Use /tmp on serverless platforms (Vercel, AWS Lambda, Netlify) where root is read-only
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY) {
    return path.join("/tmp", "kept-store.json");
  }
  return path.join(process.cwd(), "data", "store.json");
}

export function readStore(): Store {
  if (memoryStore) return memoryStore;
  const filePath = getStoreFilePath();
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    memoryStore = JSON.parse(raw) as Store;
    return memoryStore;
  } catch {
    const store = createStore();
    writeStore(store);
    return store;
  }
}

export function writeStore(store: Store) {
  memoryStore = store;
  try {
    const filePath = getStoreFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(store, null, 2));
  } catch {
    // If read-only filesystem on serverless, in-memory store keeps running smoothly
  }
}

export function resetStore(): Store {
  const store = createStore();
  writeStore(store);
  return store;
}

function reminderFor(taskId: string, personId: string, deadline: string, title: string): Store["reminders"][number] {
  const [y, m, d] = deadline.split("-").map(Number);
  const when = new Date(y, m - 1, d);
  when.setDate(when.getDate() - 1);
  when.setHours(9, 0, 0, 0);
  return {
    id: uid("rem"),
    taskId,
    personId,
    fireAt: when.toISOString(),
    message: `Due ${deadline}: ${title}. This was confirmed out of a meeting and is safe to act on.`,
    status: "scheduled",
  };
}

export function confirmProposal(
  store: Store,
  input: {
    resolutions: Record<string, Resolution>;
    tasks: { id: string; title: string; ownerId: string; deadline: string | null; include: boolean }[];
  },
): { store: Store; receipt: Receipt } {
  const pending = store.pending;
  if (!pending) throw new Error("Nothing is waiting at the gate.");
  for (const conflict of pending.conflicts) {
    if (!input.resolutions[conflict.id]) {
      throw new Error("Resolve every conflict before anything is posted.");
    }
  }

  const acceptedTopics = new Set<string>();
  const topicDecision = new Map<string, string>();
  const rejected: string[] = [];
  const now = new Date().toISOString();
  const deferred: string[] = [];
  const superseded: string[] = [];
  const exceptions: string[] = [];
  const rewritten: string[] = [];

  for (const decision of pending.decisions) {
    const conflict = pending.conflicts.find((c) => c.newDecisionId === decision.id);
    const resolution: Resolution | "accept" = conflict ? input.resolutions[conflict.id] : "accept";
    if (resolution === "keep_prior") {
      rejected.push(decision.text);
      store.decisions.push({
        id: uid("dec"),
        meetingId: pending.meeting.id,
        topic: decision.topic,
        value: decision.value,
        display: decision.display,
        text: decision.text,
        speakerId: decision.speakerId,
        evidence: decision.evidence,
        status: "rejected",
        createdAt: pending.meeting.date,
      });
      continue;
    }
    if (resolution === "defer") {
      deferred.push(decision.text);
      store.decisions.push({
        id: uid("dec"),
        meetingId: pending.meeting.id,
        topic: decision.topic,
        value: decision.value,
        display: decision.display,
        text: decision.text,
        speakerId: decision.speakerId,
        evidence: decision.evidence,
        status: "deferred",
        createdAt: pending.meeting.date,
      });
      continue;
    }
    if (resolution === "supersede" && conflict) {
      const prior = store.decisions.find((d) => d.id === conflict.priorDecisionId);
      const id = uid("dec");
      if (prior) {
        prior.status = "superseded";
        prior.supersededBy = id;
        superseded.push(`${prior.display} → ${decision.display}`);
      }
      store.decisions.push({
        id,
        meetingId: pending.meeting.id,
        topic: decision.topic,
        value: decision.value,
        display: decision.display,
        text: decision.text,
        speakerId: decision.speakerId,
        evidence: decision.evidence,
        status: "active",
        createdAt: pending.meeting.date,
      });
      for (const rewrite of conflict.rewrites) {
        const task = store.tasks.find((t) => t.id === rewrite.taskId);
        if (!task) continue;
        task.title = rewrite.title;
        task.deadline = rewrite.deadline;
        task.note = `Rewritten when ${prior?.display ?? "the prior decision"} gave way to ${decision.display}.`;
        task.bindsDecisionId = id;
        rewritten.push(`${task.title}`);
        for (const reminder of store.reminders) {
          if (reminder.taskId === task.id && reminder.status !== "sent" && reminder.status !== "cancelled") {
            reminder.status = "cancelled";
          }
        }
        if (task.deadline) store.reminders.push(reminderFor(task.id, task.ownerId, task.deadline, task.title));
        store.inbox.unshift({
          id: uid("in"),
          at: now,
          personId: task.ownerId,
          kind: "rewritten",
          title: task.title,
          body: task.note || "Rewritten because a decision moved.",
        });
      }
      acceptedTopics.add(decision.topic);
      topicDecision.set(decision.topic, id);
      continue;
    }
    if (resolution === "exception" && conflict) {
      const id = uid("dec");
      store.decisions.push({
        id,
        meetingId: pending.meeting.id,
        topic: decision.topic,
        value: decision.value,
        display: decision.display,
        text: decision.text,
        speakerId: decision.speakerId,
        evidence: decision.evidence,
        status: "active",
        scope: "Scoped exception. The prior decision stays in force.",
        exceptionTo: conflict.priorDecisionId,
        createdAt: pending.meeting.date,
      });
      exceptions.push(decision.text);
      acceptedTopics.add(decision.topic);
      topicDecision.set(decision.topic, id);
      continue;
    }
    const acceptedId = uid("dec");
    store.decisions.push({
      id: acceptedId,
      meetingId: pending.meeting.id,
      topic: decision.topic,
      value: decision.value,
      display: decision.display,
      text: decision.text,
      speakerId: decision.speakerId,
      evidence: decision.evidence,
      status: "active",
      createdAt: pending.meeting.date,
    });
    acceptedTopics.add(decision.topic);
    topicDecision.set(decision.topic, acceptedId);
  }

  const postedTasks: string[] = [];
  for (const proposed of pending.tasks) {
    const edited = input.tasks.find((t) => t.id === proposed.id);
    const include = edited ? edited.include : proposed.include;
    if (!include) continue;
    if (proposed.dependsOnTopic && !acceptedTopics.has(proposed.dependsOnTopic)) continue;
    const title = edited?.title || proposed.title;
    const ownerId = edited?.ownerId || proposed.ownerId;
    const deadline = edited ? edited.deadline : proposed.deadline;
    const id = uid("task");
    store.tasks.push({
      id,
      title,
      ownerId,
      deadline,
      status: "open",
      meetingId: pending.meeting.id,
      evidence: proposed.evidence,
      bindsDecisionId: proposed.dependsOnTopic ? topicDecision.get(proposed.dependsOnTopic) : undefined,
      postedAt: now,
    });
    postedTasks.push(title);
    if (deadline) store.reminders.push(reminderFor(id, ownerId, deadline, title));
    store.inbox.unshift({
      id: uid("in"),
      at: now,
      personId: ownerId,
      kind: "posted",
      title,
      body: "Posted to the tracker after confirmation.",
    });
  }

  for (const reminder of store.reminders) {
    if (reminder.status !== "held") continue;
    const task = store.tasks.find((item) => item.id === reminder.taskId);
    if (!task || task.status === "done") {
      reminder.status = "cancelled";
      continue;
    }
    reminder.status = "sent";
    store.inbox.unshift({
      id: uid("in"),
      at: now,
      personId: reminder.personId,
      kind: "reminder",
      title: task.title,
      body: `${reminder.message} Released after the meeting was confirmed and this task still stands.`,
    });
  }

  store.meetings.push(pending.meeting);
  const delivery = {
    id: uid("del"),
    at: now,
    target: store.settings.webhookUrl || "Nirgrantha tracker",
    body: {
      source: "kept",
      meeting: pending.meeting.title,
      date: pending.meeting.date,
      tasks: postedTasks,
      superseded,
      rejected,
      deferred,
      exceptions,
      rewritten,
    },
  };
  store.deliveries.unshift(delivery);
  store.pending = null;
  writeStore(store);

  return {
    store,
    receipt: {
      postedTasks,
      rewritten,
      superseded,
      rejected,
      deferred,
      exceptions,
      reminders: postedTasks.length,
      deliveryId: delivery.id,
    },
  };
}

export function savePending(store: Store, pending: Proposal) {
  store.pending = pending;
  writeStore(store);
}

export function discardPending(store: Store) {
  store.pending = null;
  writeStore(store);
}

export function setWebhook(store: Store, webhookUrl: string) {
  store.settings.webhookUrl = webhookUrl;
  writeStore(store);
}

export function setTaskStatus(store: Store, taskId: string, status: "open" | "done") {
  const task = store.tasks.find((item) => item.id === taskId);
  if (!task) throw new Error("Task not found.");
  task.status = status;
  writeStore(store);
}

export function noteDelivery(store: Store, deliveryId: string, target: string) {
  const delivery = store.deliveries.find((item) => item.id === deliveryId);
  if (delivery) delivery.target = target;
  writeStore(store);
}

export function runReminders(store: Store, now = new Date()): { sent: number; held: number } {
  const challenged = new Set((store.pending?.conflicts ?? []).flatMap((conflict) => conflict.blastTaskIds));
  let sent = 0;
  let held = 0;
  const at = now.toISOString();
  for (const reminder of store.reminders) {
    if (reminder.status === "sent" || reminder.status === "cancelled") continue;
    if (new Date(reminder.fireAt).getTime() > now.getTime()) continue;
    const task = store.tasks.find((item) => item.id === reminder.taskId);
    if (task?.status === "done") {
      reminder.status = "cancelled";
      continue;
    }
    if (challenged.has(reminder.taskId)) {
      if (reminder.status !== "held") {
        reminder.status = "held";
        held += 1;
        store.inbox.unshift({
          id: uid("in"),
          at,
          personId: reminder.personId,
          kind: "held",
          title: task?.title || "Reminder held",
          body: `${reminder.message} Held, because the decision this task serves is being challenged in a meeting that has not been confirmed.`,
        });
      }
      continue;
    }
    reminder.status = "sent";
    sent += 1;
    store.inbox.unshift({
      id: uid("in"),
      at,
      personId: reminder.personId,
      kind: "reminder",
      title: task?.title || "Reminder",
      body: reminder.message,
    });
  }
  writeStore(store);
  return { sent, held };
}
