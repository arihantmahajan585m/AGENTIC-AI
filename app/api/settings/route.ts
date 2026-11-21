import { readStore, setWebhook } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as { webhookUrl?: string };
  const store = readStore();
  setWebhook(store, (body.webhookUrl || "").trim());
  return Response.json(readStore());
}
