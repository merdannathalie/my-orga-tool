// Zentrale Domain-Typen. Werden von Views, Components und Firestore-Payload gleichermaßen benutzt.

export type Priority = "low" | "moderate" | "severe";

export type KanbanCol = "todo" | "doing" | "done";

export type AuditStatus =
  | "wird geprüft"
  | "nicht anwendbar"
  | "nicht erfüllt"
  | "teilweise erfüllt"
  | "erfüllt";

export type Severity = "kritisch" | "schwerwiegend" | "moderat" | "gering";

export type Principle = "Wahrnehmbar" | "Bedienbar" | "Verständlich" | "Robust";

export type NoteType = "Kunden-Call" | "Intern" | "Kick-off" | "Review";

export type LearningType = "Video" | "Artikel" | "Kurs" | "Podcast" | "Sonstiges";

export type ResourceCategory = "Richtlinie" | "Testtool" | "Vorlage" | "Sonstiges";

export type Theme = "dark" | "light";

export type Project = {
  id: number;
  name: string;
  description: string;
  deadline: string;
  completed: boolean;
};

export type Task = {
  id: number;
  project: number;
  title: string;
  description: string;
  due: string;
  col: KanbanCol;
  priority: Priority;
};

export type AuditItem = {
  id: string;
  project: number;
  page: string;
  code: string;
  name: string;
  level: "A" | "AA";
  principle: Principle;
  guideline: string;
  status: AuditStatus;
  severity: Severity | null;
  note: string;
  codeExample: string;
  recommendation: string;
};

export type AuditPage = {
  id: string;
  project: number;
  title: string;
  url: string;
};

export type AuditOverride = Partial<
  Omit<AuditItem, "id" | "project" | "page" | "code" | "name" | "level" | "principle" | "guideline">
>;

export type Note = {
  id: number;
  project: number;
  date: string;
  type: NoteType;
  title: string;
  participants: string;
  protocol: string;
  openPoints: string;
  nextSteps: string;
};

export type Resource = {
  id: number;
  title: string;
  url: string;
  category: ResourceCategory;
  note: string;
};

export type LearningItem = {
  id: number;
  title: string;
  url: string;
  type: LearningType;
  note: string;
  col: KanbanCol;
};

export type Meeting = {
  id: number;
  title: string;
  date: string;
  time: string;
  participants: string;
  link: string;
};

export type WcagCriterion = {
  code: string;
  name: string;
  level: "A" | "AA";
  principle: Principle;
  guideline: string;
};
