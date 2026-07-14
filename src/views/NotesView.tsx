import { Search, Plus } from "lucide-react";
import { NoteTypeBadge, CompletedProjectPill } from "../components/Badges";
import { NoteTaskCreator } from "../components/NoteTaskCreator";
import { SLATE } from "../constants/colors";
import { projectLabel } from "../utils/projects";
import { cx } from "../utils/cx";
import type { Note, NoteType, Project, Task } from "../types";
import styles from "./NotesView.module.scss";

type Props = {
  notes: Note[];
  setNotes: (updater: (ns: Note[]) => Note[]) => void;
  projects: Project[];
  activeNote: number | null;
  setActiveNote: (id: number) => void;
  noteFilter: string;
  setNoteFilter: (v: string) => void;
  setTasks: (updater: (ts: Task[]) => Task[]) => void;
};

const NOTE_TYPES: NoteType[] = ["Kunden-Call", "Intern", "Kick-off", "Review"];

export const NotesView = ({
  notes, setNotes, projects, activeNote, setActiveNote, noteFilter, setNoteFilter, setTasks,
}: Props) => {
  const filtered = notes
    .filter((n) => {
      const q = noteFilter.toLowerCase();
      if (!q) return true;
      const proj = projects.find((p) => p.id === n.project)?.name || "";
      const haystack = [n.title, n.participants, n.protocol, n.openPoints, n.nextSteps, proj, n.type].join(" ");
      return haystack.toLowerCase().includes(q);
    })
    .sort((a, b) =>
      b.date.split(".").reverse().join("").localeCompare(a.date.split(".").reverse().join("")),
    );

  const current = notes.find((n) => n.id === activeNote) || filtered[0];

  const updateCurrent = (field: keyof Note, value: Note[keyof Note]) => {
    if (!current) return;
    setNotes((ns) => ns.map((n) => (n.id === current.id ? { ...n, [field]: value } : n)));
  };

  const addNote = () => {
    const id = Math.max(0, ...notes.map((n) => n.id)) + 1;
    const fresh: Note = {
      id,
      project: projects.find((p) => !p.completed)?.id ?? projects[0]?.id ?? 1,
      date: new Date().toLocaleDateString("de-DE"),
      type: "Intern",
      title: "Neue Notiz",
      participants: "",
      protocol: "",
      openPoints: "",
      nextSteps: "",
    };
    setNotes((ns) => [fresh, ...ns]);
    setActiveNote(id);
  };

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Notizen & Meeting-Protokolle</h1>

      <div className="aorg-notes-layout">
        <div className="aorg-notes-list">
          <div className={styles.searchBar}>
            <Search size={14} color={SLATE} />
            <input
              value={noteFilter}
              onChange={(e) => setNoteFilter(e.target.value)}
              placeholder="Notizen durchsuchen…"
              className={styles.searchInput}
            />
          </div>
          <button onClick={addNote} className={styles.newBtn}>
            <Plus size={13} /> Neue Notiz
          </button>
          <div className={styles.list}>
            {filtered.map((n) => {
              const proj = projects.find((p) => p.id === n.project);
              const active = current && n.id === current.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setActiveNote(n.id)}
                  className={cx(styles.listItem, active && styles.listItemActive)}
                >
                  <div className={cx(styles.listTitle, "aorg-card-title")}>{n.title}</div>
                  <div className={styles.listMeta}>
                    <span>{proj?.name} · {n.date}</span>
                    <CompletedProjectPill project={proj} />
                  </div>
                  <NoteTypeBadge type={n.type} />
                </button>
              );
            })}
            {filtered.length === 0 && <div className={styles.empty}>Keine Treffer.</div>}
          </div>
        </div>

        {current && (
          <div className={styles.editor}>
            <input
              value={current.title}
              onChange={(e) => updateCurrent("title", e.target.value)}
              className={styles.editorTitle}
            />
            <div className={styles.selectRow}>
              <select
                value={current.project}
                onChange={(e) => updateCurrent("project", Number(e.target.value))}
                className={styles.select}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{projectLabel(p)}</option>
                ))}
              </select>
              <select
                value={current.type}
                onChange={(e) => updateCurrent("type", e.target.value as NoteType)}
                className={styles.select}
              >
                {NOTE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <span className={styles.dateMono}>{current.date}</span>
            </div>

            <div className={styles.label}>Teilnehmer:innen</div>
            <input
              value={current.participants}
              onChange={(e) => updateCurrent("participants", e.target.value)}
              placeholder="z. B. L. Brandt (Product Owner), ich"
              className={styles.input}
            />

            <div className={styles.label}>Protokoll</div>
            <textarea
              value={current.protocol}
              onChange={(e) => updateCurrent("protocol", e.target.value)}
              placeholder="Was wurde besprochen…"
              className={cx(styles.textarea, styles.textareaProtocol)}
            />

            <div className={styles.label}>Offene Punkte</div>
            <textarea
              value={current.openPoints}
              onChange={(e) => updateCurrent("openPoints", e.target.value)}
              placeholder="Was noch geklärt werden muss…"
              className={cx(styles.textarea, styles.textareaOpen)}
            />

            <div className={styles.label}>Next Steps</div>
            <textarea
              value={current.nextSteps}
              onChange={(e) => updateCurrent("nextSteps", e.target.value)}
              placeholder="Was als Nächstes ansteht…"
              className={cx(styles.textarea, styles.textareaNext)}
            />

            <NoteTaskCreator project={current.project} setTasks={setTasks} />
          </div>
        )}
      </div>
    </div>
  );
};
