import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DateField } from "../components/DateField";
import { cx } from "../utils/cx";
import type { Project } from "../types";
import styles from "./ProjectsView.module.scss";

type Props = {
  projects: Project[];
  setProjects: (updater: (ps: Project[]) => Project[]) => void;
  activeProject: number | null;
  setActiveProject: (id: number | null) => void;
};

export const ProjectsView = ({ projects, setProjects, activeProject, setActiveProject }: Props) => {
  const activeList = projects.filter((p) => !p.completed);
  const completedList = projects.filter((p) => p.completed);
  const current = activeList.find((p) => p.id === activeProject) || activeList[0];
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const updateCurrent = (field: keyof Project, value: Project[keyof Project]) => {
    if (!current) return;
    setProjects((ps) => ps.map((p) => (p.id === current.id ? { ...p, [field]: value } : p)));
  };

  const addProject = () => {
    const id = Math.max(0, ...projects.map((p) => p.id)) + 1;
    const fresh: Project = { id, name: "Neues Projekt", description: "", deadline: "", completed: false };
    setProjects((ps) => [fresh, ...ps]);
    setActiveProject(id);
  };

  const completeProject = (id: number) => {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, completed: true } : p)));
    if (activeProject === id) {
      const rest = activeList.filter((p) => p.id !== id);
      setActiveProject(rest[0]?.id ?? null);
    }
  };

  const restoreProject = (id: number) => {
    setProjects((ps) => ps.map((p) => (p.id === id ? { ...p, completed: false } : p)));
    setActiveProject(id);
  };

  const permanentlyDeleteProject = (id: number) => {
    setProjects((ps) => ps.filter((p) => p.id !== id));
    setConfirmDeleteId(null);
    if (activeProject === id) {
      const rest = activeList.filter((p) => p.id !== id);
      setActiveProject(rest[0]?.id ?? null);
    }
  };

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Projekte</h1>

      <div className={styles.toolbar}>
        <button onClick={addProject} className={styles.newProjectBtn}>
          <Plus size={13} /> Neues Projekt
        </button>
      </div>

      <div className="aorg-notes-layout">
        <div className="aorg-notes-list">
          <div className={styles.list}>
            {activeList.map((p) => {
              const active = current && p.id === current.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProject(p.id)}
                  className={cx(styles.listItem, active && styles.listItemActive)}
                >
                  <div className={cx(styles.listItemName, "aorg-card-title")}>{p.name}</div>
                  {p.deadline && <div className={styles.listItemDeadline}>{p.deadline}</div>}
                </button>
              );
            })}
            {activeList.length === 0 && (
              <div className={styles.empty}>Noch keine Projekte angelegt.</div>
            )}
          </div>

          {completedList.length > 0 && (
            <div className={styles.completedSection}>
              <div className={styles.completedTitle}>Abgeschlossene Projekte</div>
              <div className={styles.list}>
                {completedList.map((p) => (
                  <div key={p.id} className={styles.completedRow}>
                    <span className={styles.completedName}>{p.name}</span>
                    <button onClick={() => restoreProject(p.id)} className={styles.restoreBtn}>
                      Wiederherstellen
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {current && (
          <div className={styles.editor}>
            <input
              value={current.name}
              onChange={(e) => updateCurrent("name", e.target.value)}
              className={styles.editorTitle}
            />
            <div className={styles.deadlineRow}>
              <span className={styles.deadlineLabel}>Deadline</span>
              <DateField
                value={current.deadline}
                onChange={(v) => updateCurrent("deadline", v)}
                className={styles.deadlineField}
              />
            </div>
            <div className={styles.descLabel}>Beschreibung</div>
            <textarea
              value={current.description}
              onChange={(e) => updateCurrent("description", e.target.value)}
              placeholder="Scope, Ansprechpartner, Besonderheiten…"
              className={styles.descTextarea}
            />
            {confirmDeleteId === current.id ? (
              <div className={styles.confirmRow}>
                <span className={styles.confirmText}>Endgültig löschen?</span>
                <button onClick={() => permanentlyDeleteProject(current.id)} className={styles.btnConfirmDelete}>
                  Ja, löschen
                </button>
                <button onClick={() => setConfirmDeleteId(null)} className={styles.btnCancel}>
                  Abbrechen
                </button>
              </div>
            ) : (
              <div className={styles.actions}>
                <button onClick={() => setConfirmDeleteId(current.id)} className={styles.btnDelete}>
                  <Trash2 size={16} />
                </button>
                <button onClick={() => completeProject(current.id)} className={styles.btnComplete}>
                  Projekt abgeschlossen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
