import { useState } from "react";
import { Checkbox } from "../components/Checkbox";
import { SortToggle } from "../components/SortToggle";
import type { SortDir } from "../components/SortToggle";
import { PriorityPill } from "../components/Badges";
import { TASK_SORT_CRITERIA } from "../constants/nav";
import type { TaskSortKey } from "../constants/nav";
import { TASK_COMPARATORS } from "../utils/projects";
import { cx } from "../utils/cx";
import type { Project, Task } from "../types";
import styles from "./TasksListView.module.scss";

type Props = {
  tasks: Task[];
  toggleTask: (id: number) => void;
  projects: Project[];
};

type SortState = { key: TaskSortKey; dir: SortDir } | null;

export const TasksListView = ({ tasks, toggleTask, projects }: Props) => {
  const [sort, setSort] = useState<SortState>(null);

  const cycle = (key: TaskSortKey) =>
    setSort((s): SortState => {
      if (!s || s.key !== key) return { key, dir: "asc" };
      if (s.dir === "asc") return { key, dir: "desc" };
      return null;
    });

  const sorted = sort
    ? [...tasks].sort((a, b) => {
        const cmp = TASK_COMPARATORS[sort.key](a, b);
        return sort.dir === "desc" ? -cmp : cmp;
      })
    : tasks;

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Aufgaben</h1>

      <div className={styles.sortBar}>
        <span className={styles.sortLabel}>Sortieren nach</span>
        {TASK_SORT_CRITERIA.map((c) => (
          <SortToggle
            key={c.key}
            label={c.label}
            state={sort?.key === c.key ? sort.dir : null}
            onClick={() => cycle(c.key)}
          />
        ))}
      </div>

      <div className={styles.list}>
        {sorted.map((t) => {
          const proj = projects.find((p) => p.id === t.project);
          return (
            <label key={t.id} className={cx(styles.row, "aorg-task-row")}>
              <Checkbox
                checked={t.col === "done"}
                onChange={() => toggleTask(t.id)}
                ariaLabel={`${t.title} als erledigt markieren`}
              />
              <span className={cx(styles.title, t.col === "done" && styles.titleDone, "aorg-task-title")}>
                {t.title}
              </span>
              <span className="aorg-task-priority">
                <PriorityPill priority={t.priority} />
              </span>
              <span className={cx(styles.project, "aorg-task-project")}>
                {proj?.name}{proj?.completed ? " (abgeschlossen)" : ""}
              </span>
              <span className={cx(styles.deadline, "aorg-task-deadline")}>{t.due}</span>
            </label>
          );
        })}
        {sorted.length === 0 && (
          <div className={styles.empty}>
            Noch keine Aufgaben — leg sie im To-do-Board auf der Überblickseite an.
          </div>
        )}
      </div>
    </div>
  );
};
