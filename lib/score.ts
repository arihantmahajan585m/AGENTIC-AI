import { todayISO } from "./format";
import type { Store } from "./types";

export function alignment(store: Store, today = todayISO()) {
  const conflicts = store.pending?.conflicts.length ?? 0;
  const overdue = store.tasks.filter(
    (task) => task.status === "open" && task.deadline && task.deadline < today,
  ).length;
  const score = Math.max(6, Math.min(100, 100 - conflicts * 18 - overdue * 6));
  const label = score >= 85 ? "In force" : score >= 60 ? "Drifting" : "Contested";
  return { score, label, overdue, conflicts };
}
