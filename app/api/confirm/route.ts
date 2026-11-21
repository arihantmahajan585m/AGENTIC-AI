import { confirmProposal, noteDelivery, readStore } from "@/lib/store";
import type { Resolution } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    resolutions?: Record<string, Resolution>;
    tasks?: { id: string; title: string; ownerId: string; deadline: string | null; include: boolean }[];
  };
  try {
    const store = readStore();
    const { receipt } = confirmProposal(store, {
      resolutions: body.resolutions || {},
      tasks: body.tasks || [],
    });
    const saved = readStore();
    const delivery = saved.deliveries.find((item) => item.id === receipt.deliveryId);
    if (saved.settings.webhookUrl && delivery) {
      try {
        const dBody = delivery.body as Record<string, unknown>;
        const tasks = Array.isArray(dBody.tasks) ? dBody.tasks : [];
        const superseded = Array.isArray(dBody.superseded) ? dBody.superseded : [];
        const rewritten = Array.isArray(dBody.rewritten) ? dBody.rewritten : [];
        const rejected = Array.isArray(dBody.rejected) ? dBody.rejected : [];
        const deferred = Array.isArray(dBody.deferred) ? dBody.deferred : [];

        let summaryText = `*📋 Nirgrantha Tracker Update: ${dBody.meeting || "Meeting"} (${dBody.date || "Confirmed"})*\n\n`;
        if (tasks.length > 0) {
          summaryText += `*✅ Confirmed Action Items:*\n` + tasks.map((t: unknown) => `• ${String(t)}`).join("\n") + "\n\n";
        }
        if (superseded.length > 0) {
          summaryText += `*🔄 Superseded Decisions:*\n` + superseded.map((s: unknown) => `• ${String(s)}`).join("\n") + "\n\n";
        }
        if (rewritten.length > 0) {
          summaryText += `*📝 Rewritten In-Flight Tasks:*\n` + rewritten.map((r: unknown) => `• ${String(r)}`).join("\n") + "\n\n";
        }
        if (rejected.length > 0) {
          summaryText += `*❌ Rejected:*\n` + rejected.map((r: unknown) => `• ${String(r)}`).join("\n") + "\n\n";
        }
        if (deferred.length > 0) {
          summaryText += `*⏳ Deferred:*\n` + deferred.map((d: unknown) => `• ${String(d)}`).join("\n") + "\n\n";
        }

        const outgoingPayload = {
          text: summaryText.trim(),
          ...dBody,
        };

        const response = await fetch(saved.settings.webhookUrl, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(outgoingPayload),
          signal: AbortSignal.timeout(5000),
        });
        noteDelivery(saved, delivery.id, `${saved.settings.webhookUrl} · HTTP ${response.status}`);
      } catch {
        noteDelivery(saved, delivery.id, `${saved.settings.webhookUrl} · delivery failed, kept locally`);
      }
    }
    return Response.json({ store: readStore(), receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not post.";
    return Response.json({ error: message }, { status: 400 });
  }
}
