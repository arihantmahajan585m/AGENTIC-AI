import { readStore, setTaskStatus } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { id?: string; status?: "open" | "done" };
  if (!body.id || (body.status !== "open" && body.status !== "done")) {
    return Response.json({ error: "Missing task." }, { status: 400 });
  }
  try {
    const store = readStore();
    setTaskStatus(store, body.id, body.status);
    return Response.json(readStore());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the task.";
    return Response.json({ error: message }, { status: 400 });
  }
}
