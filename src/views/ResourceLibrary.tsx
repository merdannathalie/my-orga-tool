import { useState } from "react";
import { Search, Plus, X, Trash2, Link2 } from "lucide-react";
import { Pill } from "../components/Pill";
import { SLATE } from "../constants/colors";
import { RESOURCE_CATEGORIES } from "../constants/nav";
import { cx } from "../utils/cx";
import type { Resource, ResourceCategory } from "../types";
import styles from "./ResourceLibrary.module.scss";

type Props = {
  resources: Resource[];
  setResources: (updater: (rs: Resource[]) => Resource[]) => void;
};

type Draft = Omit<Resource, "id">;

const emptyDraft = (): Draft => ({ title: "", url: "", category: "Sonstiges", note: "" });

export const ResourceLibrary = ({ resources, setResources }: Props) => {
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const filtered = resources.filter((r) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return (r.title + r.url + r.category + r.note).toLowerCase().includes(q);
  });

  const addResource = () => {
    if (!draft.title.trim()) return;
    const id = Math.max(0, ...resources.map((r) => r.id)) + 1;
    setResources((rs) => [{ ...draft, id }, ...rs]);
    setDraft(emptyDraft());
    setShowForm(false);
  };

  const updateNote = (id: number, note: string) =>
    setResources((rs) => rs.map((r) => (r.id === id ? { ...r, note } : r)));

  const remove = (id: number) => setResources((rs) => rs.filter((r) => r.id !== id));

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Ressourcen</h1>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={14} color={SLATE} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Ressourcen durchsuchen…"
            className={styles.searchInput}
          />
        </div>
        <button onClick={() => setShowForm((s) => !s)} className={styles.btnToggle}>
          {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? "Abbrechen" : "Ressource hinzufügen"}
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <div className={styles.formRow}>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Titel"
              className={styles.formTitleInput}
            />
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as ResourceCategory }))}
              className={styles.formCategorySelect}
            >
              {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <input
            value={draft.url}
            onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
            placeholder="https://…"
            className={styles.formUrl}
          />
          <textarea
            value={draft.note}
            onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            placeholder="Notiz zu dieser Ressource (optional)"
            className={styles.formNote}
          />
          <button onClick={addResource} className={styles.btnSave}>Speichern</button>
        </div>
      )}

      <div className={styles.list}>
        {filtered.map((r) => (
          <div key={r.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div className={styles.itemBody}>
                <div className={styles.itemTitleRow}>
                  <span className={styles.itemTitle}>{r.title}</span>
                  <Pill color={SLATE}>{r.category}</Pill>
                </div>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className={styles.itemLink}>
                    <Link2 size={11} /> {r.url}
                  </a>
                )}
              </div>
              <button
                onClick={() => remove(r.id)}
                aria-label="Ressource löschen"
                className={styles.iconBtn}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <textarea
              value={r.note}
              onChange={(e) => updateNote(r.id, e.target.value)}
              placeholder="Notiz hinzufügen…"
              className={styles.itemNote}
            />
          </div>
        ))}
        {filtered.length === 0 && <div className={styles.empty}>Keine Treffer.</div>}
      </div>
    </div>
  );
};
