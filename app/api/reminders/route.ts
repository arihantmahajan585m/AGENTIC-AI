import { readStore, runReminders } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  const store = readStore();
  const result = runReminders(store);
  return Response.json({ store: readStore(), ...result });
}
