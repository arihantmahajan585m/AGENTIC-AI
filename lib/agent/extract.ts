import { databaseMention, parseDates, parseMoney } from "../dates";
import { matchPerson } from "../people";
import type { Person, ProposedDecision, ProposedTask, Topic, TranscriptTurn } from "../types";
import { normalizeSpeech } from "./normalize";
import { uid } from "../format";

const NOT_NAMES = new Set([
  "okay", "ok", "so", "and", "but", "the", "then", "also", "monday", "tuesday",
  "wednesday", "thursday", "friday", "saturday", "sunday", "december", "november",
  "january", "wait", "sorry", "actually", "let", "lets",
]);

export function parseTurns(transcript: string, people: Person[], anchor: string): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];
  let current: { speakerId: string; speakerName: string; raw: string[] } | null = null;

  const push = () => {
    if (!current) return;
    const raw = current.raw.join(" ").replace(/\s{2,}/g, " ").trim();
    if (!raw) return;
    const norm = normalizeSpeech(raw, anchor);
    turns.push({
      speakerId: current.speakerId,
      speakerName: current.speakerName,
      raw,
      cleaned: norm.text,
      corrections: norm.notes,
    });
  };

  for (const line of transcript.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([A-Za-z][A-Za-z.'-]+(?:\s[A-Za-z][A-Za-z.'-]+)?)\s*(?:\([^)]{1,40}\))?\s*[:\-–—]\s+(.+)$/);
    const named = match ? resolveSpeaker(match[1], people) : null;
    if (match && named) {
      push();
      current = { speakerId: named.id, speakerName: named.name, raw: [match[2]] };
    } else if (current) {
      current.raw.push(trimmed);
    } else {
      current = { speakerId: "room", speakerName: "Room", raw: [trimmed] };
    }
  }
  push();
  return turns;
}

function resolveSpeaker(token: string, people: Person[]): { id: string; name: string } | null {
  const known = matchPerson(people, token);
  if (known) return { id: known.id, name: known.name };
  const first = token.split(/\s+/)[0];
  if (NOT_NAMES.has(first.toLowerCase())) return null;
  if (!/^[A-Z]/.test(token)) return null;
  return { id: first.toLowerCase(), name: token };
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
}

function clauseBits(sentence: string): string[] {
  if (!/\bbut\b/i.test(sentence)) return [sentence];
  return sentence.split(/\bbut\b/i).map((s) => s.trim()).filter(Boolean);
}

function isAside(sentence: string): boolean {
  return /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|december|november|january)\b.+\bis\b/i.test(sentence)
    || /\b(is the offsite|is the .+ call|won't be honest|has sailed)\b/i.test(sentence);
}

function isHistorical(sentence: string): boolean {
  return /\b(had said|we had|previously|used to|ship has sailed)\b/i.test(sentence);
}

function isNegative(sentence: string): boolean {
  return /\b(don't|do not|dont|until we confirm|not spend)\b/i.test(sentence);
}

function namesIn(sentence: string, people: Person[]): Person[] {
  const found: Person[] = [];
  for (const person of people) {
    const re = new RegExp(`\\b${person.first}\\b`, "i");
    if (re.test(sentence)) found.push(person);
  }
  return found;
}

function ownerOf(sentence: string, speakerId: string, people: Person[], fallback?: Person): string {
  const names = namesIn(sentence, people);
  if (/\bowns\b/i.test(sentence) && names[0]) return names[0].id;
  if (names[0] && !/\b(i|i'll|i will|i can|i need)\b/i.test(sentence)) return names[0].id;
  if (/\b(i|i'll|i will|i can|i need)\b/i.test(sentence)) return speakerId;
  if (fallback) return fallback.id;
  return speakerId === "room" ? names[0]?.id || "priya" : speakerId;
}

function titleFrom(sentence: string): string {
  if (/email/i.test(sentence) && /customer|beta/i.test(sentence)) return "Email beta customers about the launch slip";
  if (/\bqa\b/i.test(sentence)) return "Redo design QA for the new launch date";
  if (/quote/i.test(sentence)) return "Send the revised quotes";
  if (/freeze/i.test(sentence)) return "Freeze the public API";
  if (/draft/i.test(sentence) && /plan/i.test(sentence)) return "Draft the revised launch plan";
  let t = sentence.replace(/^(and|also|so|okay|alright|then)\b[, ]*/i, "");
  t = t.replace(/^(i'll|i will|i can|we'll|we will|i need to)\s+/i, "");
  t = t.replace(/\b(by|for|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|december|january|november)\b.*$/i, "");
  t = t.replace(/[.!?]+$/g, "").trim();
  if (!t) return "Follow up from the meeting";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function extractCommitments(
  turns: TranscriptTurn[],
  people: Person[],
  anchor: string,
): { decisions: ProposedDecision[]; tasks: ProposedTask[]; suppressed: { text: string; reason: string }[] } {
  const decisions: ProposedDecision[] = [];
  const tasks: ProposedTask[] = [];
  const suppressed: { text: string; reason: string }[] = [];
  const seen = new Set<string>();

  const addDecision = (d: Omit<ProposedDecision, "id">) => {
    const key = `${d.topic}:${d.value}`;
    if (seen.has(key)) return;
    seen.add(key);
    decisions.push({ ...d, id: uid("pdec") });
  };

  for (const turn of turns) {
    let pendingIntent: string | null = null;
    for (const sentence of splitSentences(turn.cleaned)) {
      if (sentence.endsWith("?") || isAside(sentence) || isHistorical(sentence)) continue;
      const bits = clauseBits(sentence);
      const sentenceNames = namesIn(sentence, people);
      bits.forEach((bit, index) => {
        const low = bit.toLowerCase();
        if (isNegative(bit) && !/\bdraft\b/.test(low)) return;
        const dates = parseDates(bit, anchor);
        const money = parseMoney(bit);
        const db = databaseMention(bit);
        const fallback = sentenceNames[index] || sentenceNames[sentenceNames.length - 1];

        const launchChange = /launch/.test(low) && /(move|moved|slip|slipped|push|new date|that's the new date|locked|lock in)/.test(low) && dates.length > 0;
        const budgetChange = /(spend|budget|cap|lakh)/.test(low) && money.length > 0 && !/(too tight|too low|not enough)/.test(low);
        const dbChange = !!db && /(switch|move|use|going with|let's|lets|database)/.test(low);
        const priceChange = /(price|pricing|per seat)/.test(low) && money.length > 0;

        if (launchChange) {
          const date = dates[dates.length - 1];
          addDecision({
            topic: "launch_date",
            value: date.iso,
            display: date.label,
            text: `Move the launch to ${date.label}.`,
            speakerId: turn.speakerId,
            evidence: turn.raw,
            cleaned: bit,
            confidence: 0.93,
          });
        } else if (budgetChange && !isNegative(bit)) {
          const amount = money[money.length - 1];
          addDecision({
            topic: "budget",
            value: String(amount.amount),
            display: amount.label,
            text: `Raise the launch marketing cap to ${amount.label}.`,
            speakerId: turn.speakerId,
            evidence: turn.raw,
            cleaned: bit,
            confidence: /want/.test(low) ? 0.8 : 0.9,
          });
        } else if (dbChange && db) {
          addDecision({
            topic: "database",
            value: db.value,
            display: db.display,
            text: `Switch the primary database to ${db.display}.`,
            speakerId: turn.speakerId,
            evidence: turn.raw,
            cleaned: bit,
            confidence: 0.91,
          });
        } else if (priceChange) {
          const amount = money[money.length - 1];
          const scoped = /(first \d+|exception|only for)/.test(low);
          const topic: Topic = scoped ? "pricing_exception" : "pricing";
          addDecision({
            topic,
            value: String(amount.amount),
            display: amount.label,
            text: scoped
              ? `Carve a scoped price exception at ${amount.label}.`
              : `Change the list price to ${amount.label}.`,
            speakerId: turn.speakerId,
            evidence: turn.raw,
            cleaned: bit,
            confidence: 0.86,
          });
        }

        const someone = /\bsomeone\b|\bsomebody\b/.test(low) && namesIn(bit, people).length === 0;
        if (someone && /email|send|tell|update/.test(low)) {
          pendingIntent = titleFrom(bit);
          return;
        }

        const inherited = /\b(i can do that|i'll do that|i will do that|i can take that)\b/.test(low) && pendingIntent;
        const actionCue = inherited
          || /\b(i'll|i will|i can|i need to|owns|need to redo|will freeze|will prepare|will send|will update|will review|will draft)\b/.test(low)
          || (/\bdraft\b/.test(low) && /\bplan\b/.test(low))
          || (/\bsend\b/.test(low) && /\bquote/.test(low));

        if (isNegative(bit)) {
          if (/(spend|budget|lakh|eight)/i.test(low)) {
            suppressed.push({
              text: bit.trim(),
              reason: "Budget guardrail: 'until we confirm' condition suppressed unauthorized spend commitment.",
            });
          }
          return;
        }

        if (!actionCue || launchChange || dbChange || budgetChange) {
          if (!inherited) return;
        }

        const deadline = dates.length ? dates[dates.length - 1].iso : null;
        let depends: Topic | undefined;
        const title = inherited && pendingIntent ? pendingIntent : titleFrom(bit);
        if (/slip|launch|qa|freeze/.test(title.toLowerCase()) || /launch|qa|freeze/.test(low)) depends = "launch_date";
        if (/plan/.test(low) || /plan/.test(title.toLowerCase())) depends = "budget";
        if (/quote/.test(low)) depends = undefined;

        const suggested = !deadline && /qa/.test(title.toLowerCase());
        const launch = decisions.find((d) => d.topic === "launch_date");
        const qaDeadline = suggested && launch ? shiftDay(launch.value, -1) : deadline;

        tasks.push({
          id: uid("ptask"),
          title,
          ownerId: ownerOf(bit, turn.speakerId, people, fallback),
          deadline: qaDeadline,
          evidence: turn.raw,
          dependsOnTopic: depends,
          include: true,
          suggested,
        });
        pendingIntent = null;
      });
    }
  }

  return { decisions, tasks: dedupeTasks(tasks), suppressed };
}

function shiftDay(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dedupeTasks(tasks: ProposedTask[]): ProposedTask[] {
  const out: ProposedTask[] = [];
  for (const task of tasks) {
    const twin = out.find((t) => t.title === task.title && t.ownerId === task.ownerId);
    if (twin) {
      if (!twin.deadline && task.deadline) twin.deadline = task.deadline;
      continue;
    }
    out.push(task);
  }
  return out;
}
