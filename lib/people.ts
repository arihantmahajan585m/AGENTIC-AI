import type { Person } from "./types";

export const PEOPLE: Person[] = [
  { id: "priya", name: "Priya Shah", first: "Priya", role: "Product", initials: "PS", hue: "#f0d7a2" },
  { id: "arjun", name: "Arjun Mehta", first: "Arjun", role: "Engineering", initials: "AM", hue: "#c9daf5" },
  { id: "meera", name: "Meera Iyer", first: "Meera", role: "Design", initials: "MI", hue: "#cfe8d8" },
  { id: "kabir", name: "Kabir Khan", first: "Kabir", role: "Sales", initials: "KK", hue: "#f6d0c4" },
  { id: "anika", name: "Anika Rao", first: "Anika", role: "Marketing", initials: "AR", hue: "#e4d4f6" },
];

export function personById(people: Person[], id: string): Person | undefined {
  return people.find((p) => p.id === id);
}

export function matchPerson(people: Person[], raw: string): Person | undefined {
  const token = raw.trim().toLowerCase();
  return people.find(
    (p) =>
      p.first.toLowerCase() === token ||
      p.name.toLowerCase() === token ||
      p.name.toLowerCase().startsWith(token + " ") ||
      token === p.name.toLowerCase(),
  );
}
