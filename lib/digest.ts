import { addDays } from "./format";
import type { InboxItem, Store, Task } from "./types";

export type Digest = {
  personId: string;
  open: Task[];
  overdue: Task[];
  dueSoon: Task[];
  threatened: { from: string; to: string }[];
  notes: string[];
  recent: InboxItem[];
};

export function buildDigests(store: Store, today: string): Digest[] {
  const soon = addDays(today, 7);
  return store.people.map((person) => {
    const open = store.tasks.filter((task) => task.ownerId === person.id && task.status === "open");
    const threatened = (store.pending?.conflicts ?? []).flatMap((conflict) =>
      conflict.rewrites
        .filter((rewrite) => store.tasks.find((task) => task.id === rewrite.taskId)?.ownerId === person.id)
        .map((rewrite) => {
          const current = store.tasks.find((task) => task.id === rewrite.taskId);
          return { from: current?.title || "Open task", to: rewrite.title };
        }),
    );
    return {
      personId: person.id,
      open,
      overdue: open.filter((task) => task.deadline && task.deadline < today),
      dueSoon: open.filter((task) => task.deadline && task.deadline >= today && task.deadline <= soon),
      threatened,
      notes: open.filter((task) => task.note).map((task) => task.note as string),
      recent: store.inbox.filter((item) => item.personId === person.id).slice(0, 4),
    };
  });
}
