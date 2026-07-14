import {
  LayoutGrid, FolderKanban, ClipboardCheck, ListTodo,
  StickyNote, Library, GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PASS, AMBER, FAIL } from "./colors";
import type {
  KanbanCol, LearningType, Priority, ResourceCategory,
} from "../types";

export type TabKey = "dashboard" | "projects" | "tasks" | "notes" | "audit" | "library" | "learning";

export type NavEntry = {
  key: TabKey;
  label: string;
  icon: LucideIcon;
};

export const NAV: NavEntry[] = [
  { key: "dashboard", label: "Home", icon: LayoutGrid },
  { key: "projects", label: "Projekte", icon: FolderKanban },
  { key: "tasks", label: "Aufgaben", icon: ListTodo },
  { key: "notes", label: "Notizen", icon: StickyNote },
  { key: "audit", label: "Audit-Tracker", icon: ClipboardCheck },
  { key: "library", label: "Ressourcen", icon: Library },
  { key: "learning", label: "Weiterbildung", icon: GraduationCap },
];

export const PRIORITY_LABEL: Record<Priority, string> = { low: "low", moderate: "moderate", severe: "severe" };
export const PRIORITY_COLOR: Record<Priority, string> = { low: PASS, moderate: AMBER, severe: FAIL };
export const PRIORITY_RANK: Record<Priority, number> = { severe: 0, moderate: 1, low: 2 };

export type KanbanColumn = { key: KanbanCol; label: string };

export const KANBAN_COLS: KanbanColumn[] = [
  { key: "todo", label: "To do" },
  { key: "doing", label: "Doing" },
  { key: "done", label: "Done" },
];

export const LEARNING_TYPES: LearningType[] = ["Video", "Artikel", "Kurs", "Podcast", "Sonstiges"];
export const LEARNING_COLS: KanbanColumn[] = [
  { key: "todo", label: "Möchte ich noch" },
  { key: "doing", label: "Schaue/lese gerade" },
  { key: "done", label: "Gesehen" },
];

export const RESOURCE_CATEGORIES: ResourceCategory[] = ["Richtlinie", "Testtool", "Vorlage", "Sonstiges"];

export type TaskSortKey = "priority" | "deadline";
export const TASK_SORT_CRITERIA: Array<{ key: TaskSortKey; label: string }> = [
  { key: "priority", label: "Dringlichkeit" },
  { key: "deadline", label: "Deadline" },
];

export const TIME_OPTIONS: string[] = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});
