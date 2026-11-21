export type Topic =
  | "launch_date"
  | "budget"
  | "database"
  | "pricing"
  | "pricing_exception"
  | "scope";

export type DecisionStatus = "active" | "superseded" | "rejected" | "deferred";

export type Resolution = "keep_prior" | "supersede" | "exception" | "defer";

export type Person = {
  id: string;
  name: string;
  first: string;
  role: string;
  initials: string;
  hue: string;
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  transcript: string;
  attendeeIds: string[];
};

export type Decision = {
  id: string;
  meetingId: string;
  topic: Topic;
  value: string;
  display: string;
  text: string;
  speakerId: string;
  evidence: string;
  status: DecisionStatus;
  scope?: string;
  exceptionTo?: string;
  supersededBy?: string;
  createdAt: string;
};

export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  title: string;
  ownerId: string;
  deadline: string | null;
  status: TaskStatus;
  meetingId: string;
  evidence: string;
  bindsDecisionId?: string;
  postedAt?: string;
  note?: string;
};

export type Reminder = {
  id: string;
  taskId: string;
  personId: string;
  fireAt: string;
  message: string;
  status: "scheduled" | "sent" | "held" | "cancelled";
};

export type Delivery = {
  id: string;
  at: string;
  target: string;
  body: unknown;
};

export type InboxItem = {
  id: string;
  at: string;
  personId: string;
  kind: "reminder" | "held" | "posted" | "rewritten";
  title: string;
  body: string;
};

export type AgentStep = {
  id: string;
  agent: string;
  title: string;
  detail: string;
  evidence: string[];
  rationale?: string[];
  guardrails?: string[];
};

export type TranscriptTurn = {
  speakerId: string;
  speakerName: string;
  raw: string;
  cleaned: string;
  corrections: string[];
};

export type ProposedDecision = {
  id: string;
  topic: Topic;
  value: string;
  display: string;
  text: string;
  speakerId: string;
  evidence: string;
  cleaned: string;
  confidence: number;
};

export type ProposedTask = {
  id: string;
  title: string;
  ownerId: string;
  deadline: string | null;
  evidence: string;
  dependsOnTopic?: Topic;
  include: boolean;
  suggested: boolean;
};

export type Conflict = {
  id: string;
  topic: Topic;
  severity: "high" | "medium";
  newDecisionId: string;
  priorDecisionId: string;
  title: string;
  explanation: string;
  blastTaskIds: string[];
  rewrites: { taskId: string; title: string; deadline: string | null }[];
  context: string;
  resolution?: Resolution;
};

export type Proposal = {
  meeting: Meeting;
  turns: TranscriptTurn[];
  decisions: ProposedDecision[];
  tasks: ProposedTask[];
  conflicts: Conflict[];
  steps: AgentStep[];
  corrections: string[];
  consulted: { id: string; text: string; display: string }[];
  engine: "on-device" | "hybrid (gemini + on-device)";
  suppressed?: { text: string; reason: string }[];
};

export type Receipt = {
  postedTasks: string[];
  rewritten: string[];
  superseded: string[];
  rejected: string[];
  deferred: string[];
  exceptions: string[];
  reminders: number;
  deliveryId: string;
};

export type Store = {
  people: Person[];
  meetings: Meeting[];
  decisions: Decision[];
  tasks: Task[];
  reminders: Reminder[];
  deliveries: Delivery[];
  inbox: InboxItem[];
  pending: Proposal | null;
  settings: { webhookUrl: string };
};

export const TOPIC_LABEL: Record<Topic, string> = {
  launch_date: "Launch date",
  budget: "Marketing cap",
  database: "Database of record",
  pricing: "List price",
  pricing_exception: "Pricing exception",
  scope: "Scope",
};
