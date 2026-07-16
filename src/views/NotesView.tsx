import { useState } from "react";
import { Search, Plus, Trash2, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NoteTypeBadge, CompletedProjectPill } from "../components/Badges";
import { NoteTaskCreator } from "../components/NoteTaskCreator";
import { SLATE } from "../constants/colors";
import { projectLabel } from "../utils/projects";
import { downloadMarkdown } from "../utils/notesMarkdown";
import { cx } from "../utils/cx";
import type { AnchorHTMLAttributes } from "react";
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

const MARKDOWN_COMPONENTS = {
  a: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  ),
};

const MarkdownField = ({ value, empty }: { value: string; empty: string }) => {
  if (!value.trim()) return <div className={styles.markdownEmpty}>{empty}</div>;
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {value}
      </ReactMarkdown>
    </div>
  );
};

export const NotesView = ({
  notes, setNotes, projects, activeNote, setActiveNote, noteFilter, setNoteFilter, setTasks,
}: Props) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [noteModes, setNoteModes] = useState<Map<number, "edit" | "preview">>(new Map());

  const currentMode = (id: number): "edit" | "preview" => noteModes.get(id) ?? "edit";
  const setMode = (id: number, mode: "edit" | "preview") =>
    setNoteModes((prev) => {
      const next = new Map(prev);
      next.set(id, mode);
      return next;
    });

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

  const deleteNote = (id: number) => {
    setNotes((ns) => ns.filter((n) => n.id !== id));
    setConfirmDeleteId(null);
    if (activeNote === id) {
      const remaining = notes.filter((n) => n.id !== id);
      setActiveNote(remaining[0]?.id ?? 0);
    }
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
                  <span className={styles.badgeSlot}>
                    <NoteTypeBadge type={n.type} />
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && <div className={styles.empty}>Keine Treffer.</div>}
          </div>
        </div>

        {current && (
          <div className={styles.editor}>
            <div className={styles.titleRow}>
              <input
                value={current.title}
                onChange={(e) => updateCurrent("title", e.target.value)}
                className={styles.editorTitle}
              />
              <div className={styles.modeToggle} role="group" aria-label="Ansichtsmodus">
                <button
                  type="button"
                  aria-pressed={currentMode(current.id) === "edit"}
                  onClick={() => setMode(current.id, "edit")}
                  className={cx(
                    styles.modeToggleBtn,
                    currentMode(current.id) === "edit" && styles.modeToggleBtnActive,
                  )}
                >
                  Bearbeiten
                </button>
                <button
                  type="button"
                  aria-pressed={currentMode(current.id) === "preview"}
                  onClick={() => setMode(current.id, "preview")}
                  className={cx(
                    styles.modeToggleBtn,
                    currentMode(current.id) === "preview" && styles.modeToggleBtnActive,
                  )}
                >
                  Vorschau
                </button>
              </div>
            </div>
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
            {currentMode(current.id) === "edit" ? (
              <textarea
                value={current.protocol}
                onChange={(e) => updateCurrent("protocol", e.target.value)}
                placeholder="Was wurde besprochen…"
                className={cx(styles.textarea, styles.textareaProtocol)}
              />
            ) : (
              <MarkdownField value={current.protocol} empty="Keine Einträge." />
            )}

            <div className={styles.label}>Offene Punkte</div>
            {currentMode(current.id) === "edit" ? (
              <textarea
                value={current.openPoints}
                onChange={(e) => updateCurrent("openPoints", e.target.value)}
                placeholder="Was noch geklärt werden muss…"
                className={cx(styles.textarea, styles.textareaOpen)}
              />
            ) : (
              <MarkdownField value={current.openPoints} empty="Keine offenen Punkte." />
            )}

            <div className={styles.label}>Next Steps</div>
            {currentMode(current.id) === "edit" ? (
              <textarea
                value={current.nextSteps}
                onChange={(e) => updateCurrent("nextSteps", e.target.value)}
                placeholder="Was als Nächstes ansteht…"
                className={cx(styles.textarea, styles.textareaNext)}
              />
            ) : (
              <MarkdownField value={current.nextSteps} empty="Keine Next Steps." />
            )}

            <NoteTaskCreator project={current.project} setTasks={setTasks} />

            <div className={styles.deleteSection}>
              <button
                onClick={() => downloadMarkdown(current, projects.find((p) => p.id === current.project))}
                className={styles.btnExport}
                title="Diese Notiz als Markdown-Datei herunterladen"
              >
                <Download size={13} /> Als Markdown exportieren
              </button>
              {confirmDeleteId === current.id ? (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmText}>Notiz wirklich löschen?</span>
                  <button onClick={() => deleteNote(current.id)} className={styles.btnConfirmDelete}>
                    Ja, löschen
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)} className={styles.btnCancel}>
                    Abbrechen
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(current.id)}
                  className={styles.btnDelete}
                >
                  <Trash2 size={13} /> Notiz löschen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
