export type FoundDate = {
  iso: string;
  label: string;
  index: number;
  length: number;
};

const MONTHS: Record<string, number> = {
  january: 0, jan: 0, february: 1, feb: 1, march: 2, mar: 2,
  april: 3, apr: 3, may: 4, june: 5, jun: 5, july: 6, jul: 6,
  august: 7, aug: 7, september: 8, sept: 8, sep: 8,
  october: 9, oct: 9, november: 10, nov: 10, december: 11, dec: 11,
};

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
};

function isoFrom(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function labelFrom(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function pushUnique(out: FoundDate[], item: FoundDate) {
  if (out.some((o) => o.index === item.index && o.iso === item.iso)) return;
  out.push(item);
}

export function parseDates(text: string, anchorISO: string): FoundDate[] {
  const [ay, am, ad] = anchorISO.split("-").map(Number);
  const anchor = new Date(ay, am - 1, ad);
  const out: FoundDate[] = [];

  const monthFirst = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi;
  for (const m of text.matchAll(monthFirst)) {
    const month = MONTHS[m[1].toLowerCase()];
    const day = Number(m[2]);
    let year = anchor.getFullYear();
    if (month < anchor.getMonth() && month !== anchor.getMonth()) year += 1;
    if (month < anchor.getMonth()) year = anchor.getFullYear() + 1;
    const iso = isoFrom(year, month, day);
    pushUnique(out, { iso, label: labelFrom(iso), index: m.index ?? 0, length: m[0].length });
  }

  const dayFirst = /\b(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)\b/gi;
  for (const m of text.matchAll(dayFirst)) {
    const day = Number(m[1]);
    const month = MONTHS[m[2].toLowerCase()];
    let year = anchor.getFullYear();
    if (month < anchor.getMonth()) year += 1;
    const iso = isoFrom(year, month, day);
    pushUnique(out, { iso, label: labelFrom(iso), index: m.index ?? 0, length: m[0].length });
  }

  const weekday = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/gi;
  for (const m of text.matchAll(weekday)) {
    const word = m[1].toLowerCase();
    const date = new Date(anchor);
    if (word === "today") {
      /* anchor */
    } else if (word === "tomorrow") {
      date.setDate(date.getDate() + 1);
    } else {
      const target = WEEKDAYS.indexOf(word);
      const diff = (target - anchor.getDay() + 7) % 7;
      date.setTime(anchor.getTime());
      date.setDate(anchor.getDate() + diff);
    }
    const iso = isoFrom(date.getFullYear(), date.getMonth(), date.getDate());
    pushUnique(out, { iso, label: labelFrom(iso), index: m.index ?? 0, length: m[0].length });
  }

  const ordinal = /\bthe\s+(\d{1,2})(?:st|nd|rd|th)\b/gi;
  for (const m of text.matchAll(ordinal)) {
    const day = Number(m[1]);
    const date = new Date(anchor);
    if (day < anchor.getDate()) date.setMonth(date.getMonth() + 1);
    date.setDate(day);
    const iso = isoFrom(date.getFullYear(), date.getMonth(), date.getDate());
    pushUnique(out, { iso, label: labelFrom(iso), index: m.index ?? 0, length: m[0].length });
  }

  return out.sort((a, b) => a.index - b.index);
}

export type FoundMoney = { amount: number; label: string; index: number; length: number };

export function parseMoney(text: string): FoundMoney[] {
  const out: FoundMoney[] = [];
  const word = new RegExp(`\\b(${Object.keys(WORDS).join("|")}|\\d+)\\s+lakhs?\\b`, "gi");
  for (const m of text.matchAll(word)) {
    const n = WORDS[m[1].toLowerCase()] ?? Number(m[1]);
    if (!n) continue;
    const amount = n * 100000;
    out.push({ amount, label: `₹${amount.toLocaleString("en-IN")}`, index: m.index ?? 0, length: m[0].length });
  }
  const symbol = /(?:₹|rs\.?|inr)\s*(\d[\d,]*)/gi;
  for (const m of text.matchAll(symbol)) {
    const amount = Number(m[1].replace(/,/g, ""));
    if (!amount) continue;
    out.push({ amount, label: `₹${amount.toLocaleString("en-IN")}`, index: m.index ?? 0, length: m[0].length });
  }
  return out.sort((a, b) => a.index - b.index);
}

export function databaseMention(text: string): { value: string; display: string } | null {
  if (/\bmongo(?:db)?\b/i.test(text)) return { value: "mongo", display: "MongoDB" };
  if (/\bpostgres(?:ql)?\b/i.test(text)) return { value: "postgres", display: "PostgreSQL" };
  if (/\bmysql\b/i.test(text)) return { value: "mysql", display: "MySQL" };
  return null;
}
