import { parseDates, parseMoney } from "../dates";

const FILLER = /\b(um+|uh+|er+|ah+|hmm+)\b[,]?\s*/gi;
const INTRA = /\b(no wait|wait no|scratch that|i mean|or rather)\b/i;

function sentencesOf(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function replaceSpan(source: string, index: number, length: number, next: string): string {
  return `${source.slice(0, index)}${next}${source.slice(index + length)}`.replace(/\s{2,}/g, " ").trim();
}

function spliceValue(before: string, after: string, anchor: string): { text: string; note: string | null } {
  const replacement = after
    .replace(/^(actually|sorry|no wait|wait|i mean|correction)\b[,:]?\s*/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
  const afterDates = parseDates(replacement, anchor);
  const beforeDates = parseDates(before, anchor);
  if (afterDates[0] && beforeDates.length) {
    const target = beforeDates[beforeDates.length - 1];
    const next = afterDates[0].label.replace(/ \d{4}$/, "") === afterDates[0].label
      ? replacement
      : afterDates[0].iso
        ? parseDates(replacement, anchor)[0]
          ? replacement.match(/^[A-Za-z]+\s+\d{1,2}|^\d{1,2}\s+[A-Za-z]+|^[A-Za-z]+day\b/i)?.[0] || afterDates[0].label
          : replacement
        : replacement;
    const phrase = (replacement.match(
      /^(?:the\s+)?(?:\d{1,2}(?:st|nd|rd|th)?\s+)?(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)(?:\s+\d{1,2}(?:st|nd|rd|th)?)?|^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i,
    ) || [afterDates[0].label])[0];
    return {
      text: replaceSpan(before, target.index, target.length, phrase),
      note: `Kept “${phrase.trim()}” and dropped “${target.label}”.`,
    };
  }
  const afterMoney = parseMoney(replacement);
  const beforeMoney = parseMoney(before);
  if (afterMoney[0] && beforeMoney.length) {
    const target = beforeMoney[beforeMoney.length - 1];
    const phrase = replacement.match(/^(?:(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+lakhs?|₹\s*[\d,]+)/i)?.[0] || afterMoney[0].label;
    return {
      text: replaceSpan(before, target.index, target.length, phrase),
      note: `Kept “${phrase.trim()}” and dropped “${target.label}”.`,
    };
  }
  if (replacement.split(/\s+/).length <= 6 && /\b(to|by|on|at)\s+\S+/i.test(before)) {
    const text = before.replace(/\b(to|by|on|at)\s+[^,.;]+$/i, `$1 ${replacement}`);
    if (text !== before) return { text, note: `Kept “${replacement}”.` };
  }
  return { text: before, note: null };
}

function fixIntra(sentence: string, anchor: string): { text: string; notes: string[] } {
  const notes: string[] = [];
  let current = sentence;
  for (let i = 0; i < 4; i++) {
    const match = current.match(new RegExp(`^(.*?)\\b(?:no wait|wait no|scratch that|i mean|or rather)\\b\\s*,?\\s*(.+)$`, "i"));
    if (!match) break;
    const spliced = spliceValue(match[1].replace(/[,\s]+$/, ""), match[2], anchor);
    current = spliced.text;
    if (spliced.note) notes.push(spliced.note);
    else break;
  }
  return { text: current, notes };
}

export function normalizeSpeech(raw: string, anchor: string): { text: string; notes: string[] } {
  const stripped = raw.replace(FILLER, "").replace(/\s{2,}/g, " ").trim();
  const notes: string[] = [];
  const kept: string[] = [];
  for (const sentence of sentencesOf(stripped)) {
    const intra = fixIntra(sentence, anchor);
    notes.push(...intra.notes);
    let current = intra.text.trim();
    if (!current) continue;
    const previous = kept[kept.length - 1];
    const strippedCue = current.replace(/^(actually|sorry|no wait|wait no|i mean|correction)\b[,:]?\s*/i, "");
    const bareCorrection = /^(actually|sorry|no wait|wait no|i mean|correction)\b/i.test(current)
      && strippedCue.split(/\s+/).length <= 6;
    const bareValue = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|december|january|february|november)\b/i.test(current)
      && current.split(/\s+/).length <= 3;
    if (previous && (bareCorrection || bareValue) && (parseDates(current, anchor).length || INTRA.test(current))) {
      const spliced = spliceValue(previous, current, anchor);
      if (spliced.note) {
        kept[kept.length - 1] = spliced.text;
        notes.push(spliced.note);
        continue;
      }
    }
    kept.push(current.replace(/^(actually|sorry)\b[,:]?\s*/i, ""));
  }
  const text = kept
    .map((sentence) => (/[.!?]$/.test(sentence.trim()) ? sentence.trim() : `${sentence.trim()}.`))
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return { text, notes };
}
