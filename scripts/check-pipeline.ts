import { runPipeline } from "../lib/agent/pipeline";
import { PEOPLE } from "../lib/people";
import { SAMPLE_DATE, SAMPLE_TITLE, SAMPLE_TRANSCRIPT } from "../lib/sample";
import { createStore } from "../lib/seed";

const store = createStore();
const proposal = runPipeline({
  transcript: SAMPLE_TRANSCRIPT,
  title: SAMPLE_TITLE,
  meetingDate: SAMPLE_DATE,
  people: PEOPLE,
  decisions: store.decisions,
  tasks: store.tasks,
  meetings: store.meetings,
});

const topics = proposal.decisions.map((d) => `${d.topic}=${d.value}`).join(", ");
const taskLine = proposal.tasks
  .map((t) => `${t.ownerId}: ${t.title} @ ${t.deadline} [${t.dependsOnTopic ?? "free"}]`)
  .join("\n");
const conflictLine = proposal.conflicts.map((c) => `${c.topic} blast=${c.blastTaskIds.join("+")}`).join("\n");

console.log("DECISIONS", topics);
console.log("TASKS\n" + taskLine);
console.log("CONFLICTS\n" + conflictLine);
console.log("CORRECTIONS\n" + proposal.corrections.join("\n"));
console.log("TURNS\n" + proposal.turns.map((t) => `${t.speakerName}: ${t.cleaned}`).join("\n"));

const errors: string[] = [];
const has = (topic: string, value: string) => proposal.decisions.some((d) => d.topic === topic && d.value === value);
if (!has("launch_date", "2026-12-05")) errors.push("missing Dec 5 launch");
if (proposal.decisions.some((d) => d.topic === "launch_date" && d.value !== "2026-12-05")) errors.push("extra launch value");
if (!has("budget", "800000")) errors.push("missing 8 lakh");
if (proposal.decisions.some((d) => d.topic === "budget" && d.value === "500000")) errors.push("5 lakh was treated as a new cap");
if (!has("database", "mongo")) errors.push("missing mongo");
if (proposal.decisions.some((d) => d.topic === "pricing")) errors.push("false pricing decision");
if (proposal.conflicts.length !== 3) errors.push(`expected 3 conflicts, got ${proposal.conflicts.length}`);
const launch = proposal.conflicts.find((c) => c.topic === "launch_date");
const budget = proposal.conflicts.find((c) => c.topic === "budget");
if (!launch?.blastTaskIds.includes("task_qa")) errors.push("QA not in launch blast");
if (!budget?.blastTaskIds.includes("task_media")) errors.push("media plan not in budget blast");
const email = proposal.tasks.find((t) => /beta customers/i.test(t.title));
if (!email || email.ownerId !== "meera" || email.deadline !== "2026-11-26") errors.push(`email wrong: ${JSON.stringify(email)}`);
const quotes = proposal.tasks.find((t) => /quotes/i.test(t.title));
if (!quotes || quotes.ownerId !== "kabir" || quotes.deadline !== "2026-11-24") errors.push(`quotes wrong: ${JSON.stringify(quotes)}`);
const freeze = proposal.tasks.find((t) => /Freeze the public API/i.test(t.title));
if (!freeze || freeze.ownerId !== "arjun" || freeze.deadline !== "2026-12-01") errors.push(`freeze wrong: ${JSON.stringify(freeze)}`);
const plan = proposal.tasks.find((t) => /revised launch plan/i.test(t.title));
if (!plan || plan.ownerId !== "anika" || plan.deadline !== "2026-11-27") errors.push(`plan wrong: ${JSON.stringify(plan)}`);
if (proposal.tasks.some((t) => /spend the eight/i.test(t.title))) errors.push("created a spend task from a negation");
if (proposal.corrections.length < 3) errors.push("expected at least 3 corrections");

if (errors.length) {
  console.error("FAILED\n" + errors.join("\n"));
  process.exit(1);
}
console.log("PASSED");
