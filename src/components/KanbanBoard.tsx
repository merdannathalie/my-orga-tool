import { useState } from "react";
import { Plus, X, Trash2, GripVertical } from "lucide-react";
import { DateField } from "./DateField";
import { TaskModal } from "./TaskModal";
import { PriorityPill, CompletedProjectPill } from "./Badges";
import { SLATE } from "../constants/colors";
import { KANBAN_COLS } from "../constants/nav";
import { cx } from "../utils/cx";
import type { KanbanCol, Priority, Project, Task } from "../types";
import styles from "./KanbanBoard.module.scss";

type Props = {
  tasks: Task[];
  setTasks: (updater: (ts: Task[]) => Task[]) => void;
  projects: Project[];
};

type Draft = {
  title: string;
  description: string;
  project: number;
  priority: Priority;
  due: string;
};

const initialDraft = (projects: Project[]): Draft => ({
  title: "",
  description: "",
  project: projects.find((p) => !p.completed)?.id ?? projects[0]?.id ?? 1,
  priority: "moderate",
  due: "",
});

export const KanbanBoard = ({ tasks, setTasks, projects }: Props) => {
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<KanbanCol | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Draft>(() => initialDraft(projects));

  const selectedTask = tasks.find((t) => t.id === selectedId) || null;

  const moveTo = (id: number, col: KanbanCol) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, col } : t)));

  const clearDone = () => setTasks((ts) => ts.filter((t) => t.col !== "done"));

  const addTask = () => {
    if (!draft.title.trim()) return;
    const id = Math.max(0, ...tasks.map((t) => t.id)) + 1;
    setTasks((ts) => [
      ...ts,
      {
        id,
        project: Number(draft.project),
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        due: draft.due,
        col: "todo",
      },
    ]);
    setDraft(initialDraft(projects));
    setShowForm(false);
  };

  const saveTask = (updated: Task) =>
    setTasks((ts) => ts.map((t) => (t.id === updated.id ? { ...updated } : t)));

  const deleteTask = (id: number) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    setSelectedId(null);
  };

  const doneCount = tasks.filter((t) => t.col === "done").length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>To-do-Board</h2>
        <div className={styles.headerActions}>
          <button onClick={() => setShowForm((s) => !s)} className={styles.btnToggle}>
            {showForm ? <X size={12} /> : <Plus size={12} />} Aufgabe
          </button>
          <button
            onClick={clearDone}
            disabled={doneCount === 0}
            className={cx(styles.btnClearDone, doneCount > 0 && styles.btnClearDoneActive)}
          >
            <Trash2 size={12} /> Erledigte löschen ({doneCount})
          </button>
        </div>
      </div>

      {showForm && (
        <div className={styles.form}>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Titel"
            className={styles.formInput}
          />
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="Beschreibung (optional)"
            className={styles.formTextarea}
          />
          <div className={styles.formRow}>
            <select
              value={draft.project}
              onChange={(e) => setDraft((d) => ({ ...d, project: Number(e.target.value) }))}
              className={styles.projectSelect}
            >
              {projects.filter((p) => !p.completed).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={draft.priority}
              onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as Priority }))}
              className={styles.prioritySelect}
            >
              <option value="low">low</option>
              <option value="moderate">moderate</option>
              <option value="severe">severe</option>
            </select>
            <DateField
              value={draft.due}
              onChange={(v) => setDraft((d) => ({ ...d, due: v }))}
              className={styles.date}
            />
            <button onClick={addTask} className={styles.btnCreate}>Anlegen</button>
          </div>
        </div>
      )}

      <div className="aorg-kanban-grid">
        {KANBAN_COLS.map((col) => {
          const items = tasks.filter((t) => t.col === col.key);
          const isOver = overCol === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId != null) moveTo(dragId, col.key);
                setDragId(null);
                setOverCol(null);
              }}
              className={cx(styles.lane, isOver && styles.laneOver)}
            >
              <div className={styles.laneHeader}>
                <span>{col.label}</span>
                <span>{items.length}</span>
              </div>
              <div className={styles.laneList}>
                {items.map((t) => {
                  const proj = projects.find((p) => p.id === t.project);
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => setDragId(null)}
                      onClick={() => setSelectedId(t.id)}
                      className={cx(styles.card, dragId === t.id && styles.cardDragging)}
                    >
                      <div className={styles.cardBody}>
                        <GripVertical size={13} color={SLATE} className={styles.grip} />
                        <div className={styles.cardMain}>
                          <div className={styles.cardTitle}>{t.title}</div>
                          <div className={styles.cardMeta}>
                            <PriorityPill priority={t.priority} />
                            <span className={styles.cardProject}>
                              {proj?.name}{t.due ? ` · ${t.due}` : ""}
                            </span>
                            <CompletedProjectPill project={proj} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div className={styles.empty}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => setSelectedId(null)}
          onSave={saveTask}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
};
