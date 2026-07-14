import { useState } from "react";
import { X, Pencil, Trash2 } from "lucide-react";
import { DateField } from "./DateField";
import { PriorityPill, CompletedProjectPill } from "./Badges";
import { projectLabel } from "../utils/projects";
import { cx } from "../utils/cx";
import type { Priority, Project, Task } from "../types";
import styles from "./TaskModal.module.scss";

type Props = {
  task: Task;
  projects: Project[];
  onClose: () => void;
  onSave: (t: Task) => void;
  onDelete: (id: number) => void;
};

export const TaskModal = ({ task, projects, onClose, onSave, onDelete }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Task>(task);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const proj = projects.find((p) => p.id === task.project);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(task);
    setEditing(true);
  };

  return (
    <div onClick={onClose} className={styles.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={styles.panel}>
        {!editing ? (
          <div>
            <div className={styles.viewHeader}>
              <h3 className={styles.viewTitle}>{task.title}</h3>
              <button onClick={onClose} aria-label="Schließen" className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.meta}>
              <PriorityPill priority={task.priority} />
              <span className={styles.metaText}>{proj?.name}</span>
              <CompletedProjectPill project={proj} />
              {task.due && <span className={styles.metaDate}>{task.due}</span>}
            </div>
            <p className={cx(styles.description, task.description ? styles.descriptionFilled : styles.descriptionEmpty)}>
              {task.description || "Keine Beschreibung."}
            </p>
            {!confirmDelete ? (
              <div className={styles.actions}>
                <button onClick={startEdit} className={styles.btnEdit}>
                  <Pencil size={15} /> Bearbeiten
                </button>
                <button onClick={() => setConfirmDelete(true)} className={styles.btnDelete}>
                  <Trash2 size={15} /> Löschen
                </button>
              </div>
            ) : (
              <div className={styles.confirmRow}>
                <span className={styles.confirmLabel}>Aufgabe wirklich löschen?</span>
                <button onClick={() => onDelete(task.id)} className={styles.btnConfirmDelete}>Ja, löschen</button>
                <button onClick={() => setConfirmDelete(false)} className={styles.btnCancel}>Abbrechen</button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className={styles.titleInput}
            />
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Beschreibung"
              className={styles.descriptionInput}
            />
            <div className={styles.selectsRow}>
              <select
                value={draft.project}
                onChange={(e) => setDraft((d) => ({ ...d, project: Number(e.target.value) }))}
                className={styles.projectSelect}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{projectLabel(p)}</option>
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
            </div>
            <div className={styles.dueBlock}>
              <div className={styles.dueLabel}>Deadline</div>
              <DateField
                value={draft.due}
                onChange={(v) => setDraft((d) => ({ ...d, due: v }))}
                className={styles.dueField}
              />
            </div>
            <div className={styles.editActions}>
              <button onClick={save} className={styles.btnSave}>Speichern</button>
              <button onClick={() => setEditing(false)} className={styles.btnCancel}>Abbrechen</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
