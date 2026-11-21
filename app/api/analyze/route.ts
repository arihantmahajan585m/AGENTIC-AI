import { runPipeline } from "@/lib/agent/pipeline";
import { readStore, savePending } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { transcript?: string; title?: string; meetingDate?: string };
  const transcript = body.transcript?.trim() || "";
  if (transcript.length < 12) {
    return Response.json({ error: "Paste a transcript before running the agent." }, { status: 400 });
  }
  const store = readStore();
  const proposal = runPipeline({
    transcript,
    title: body.title?.trim() || "Untitled meeting",
    meetingDate: body.meetingDate || new Date().toISOString().slice(0, 10),
    people: store.people,
    decisions: store.decisions,
    tasks: store.tasks,
    meetings: store.meetings,
  });
  savePending(store, proposal);
  return Response.json(readStore());
}
