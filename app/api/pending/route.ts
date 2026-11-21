import { discardPending, readStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const store = readStore();
  discardPending(store);
  return Response.json(readStore());
}
