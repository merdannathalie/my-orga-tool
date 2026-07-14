import { PRIORITY_RANK } from "../constants/nav";
import type { TaskSortKey } from "../constants/nav";
import { parseGermanDate } from "./dates";
import type { Project, Task } from "../types";

// Zeigt den Projektnamen in <select>-Optionen an, mit Hinweis wenn das Projekt abgeschlossen ist.
export const projectLabel = (p: Project | undefined): string =>
  p ? `${p.name}${p.completed ? " (abgeschlossen)" : ""}` : "";

export const TASK_COMPARATORS: Record<TaskSortKey, (a: Task, b: Task) => number> = {
  priority: (a, b) => (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3),
  deadline: (a, b) => {
    const da = parseGermanDate(a.due);
    const db = parseGermanDate(b.due);
    if (da == null && db == null) return 0;
    if (da == null) return 1;
    if (db == null) return -1;
    return da - db;
  },
};
