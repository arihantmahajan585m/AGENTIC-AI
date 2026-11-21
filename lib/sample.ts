export const SAMPLE_TITLE = "Launch sync";
export const SAMPLE_DATE = "2026-11-21";

export const SAMPLE_TRANSCRIPT = `Priya: Okay uh so quick sync, sorry I'm jumping around. Arjun, where are we on the freeze?

Arjun: The freeze slipped. I think we should move the launch to December 2, no wait, December 5. The API won't be honest before then.

Priya: December 5. Alright, that's the new date then. We had said the 28th but that ship has sailed.

Anika: Also, the five lakh cap is too tight. Marketing wants to spend eight lakh on the launch, influencers plus a city dinner.

Kabir: And while we're ripping things up, the enterprise deals would close faster if we just switched the database to Mongo. It's what two of the logos already use. Let's switch to Mongo.

Meera: If the date moves I need to redo QA. Also someone has to email existing beta customers about the slip. I can do that by Wednesday. Actually, Thursday, Wednesday is the offsite.

Kabir: I'll send the revised quotes by Monday. Sorry, Tuesday. Monday is the Acme legal call.

Priya: Arjun owns the new API freeze for December 1. And Anika, don't spend the eight lakh until we confirm, but draft the revised plan by Friday.`;

export type Scenario = {
  id: string;
  name: string;
  badge: string;
  title: string;
  date: string;
  transcript: string;
  description: string;
  highlight: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "launch_sync",
    name: "21 Nov Launch Sync",
    badge: "Primary Demo",
    title: SAMPLE_TITLE,
    date: SAMPLE_DATE,
    transcript: SAMPLE_TRANSCRIPT,
    description: "Launch slipped to Dec 5, 8L marketing spend, Mongo switch. 3 active conflicts with memory.",
    highlight: "Demonstrates speech repair, 3 real contradictions, blast-radius task rewrite, and held reminders.",
  },
  {
    id: "enterprise_exception",
    name: "14 Nov Pricing & Exception Sync",
    badge: "Scoped Exception",
    title: "Enterprise exception",
    date: "2026-11-14",
    transcript: `Kabir: The first 10 enterprise logos can be quoted at ₹3,600.
Priya: That is an exception. The list price stays ₹4,200 for everyone else.
Kabir: Understood. I'll send the Acme exception quote by Monday.`,
    description: "Demonstrates scoped exception recognition where ₹3,600 does not conflict with ₹4,200 list price.",
    highlight: "Shows that Nirgrantha does not raise false alarms when a discount is explicitly scoped as an exception.",
  },
  {
    id: "clean_followup",
    name: "26 Nov Execution Follow-up",
    badge: "Aligned Sync",
    title: "Post-lock execution follow-up",
    date: "2026-11-26",
    transcript: `Priya: Quick check-in on the December 5 launch preparations.
Arjun: I will freeze the public API by Monday.
Meera: I will email beta customers about the schedule by Wednesday.
Kabir: I'll send the revised enterprise quotes by Thursday.
Anika: I will draft the media plan update by Friday.`,
    description: "A clean follow-up meeting where all new commitments align with the updated memory record.",
    highlight: "Shows the agent operating smoothly with zero false conflicts when tasks respect in-force decisions.",
  },
];
