import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { LearningCard } from "../components/LearningCard";
import { LearningItemModal } from "../components/LearningItemModal";
import { SLATE } from "../constants/colors";
import { LEARNING_TYPES, LEARNING_COLS } from "../constants/nav";
import { cx } from "../utils/cx";
import type { KanbanCol, LearningItem, LearningType } from "../types";
import styles from "./LearningListView.module.scss";

type Props = {
  items: LearningItem[];
  setItems: (updater: (its: LearningItem[]) => LearningItem[]) => void;
};

type Draft = Omit<LearningItem, "id" | "col">;

const emptyDraft = (): Draft => ({ title: "", url: "", type: "Video", note: "" });

export const LearningListView = ({ items, setItems }: Props) => {
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<KanbanCol | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const filtered = items.filter((i) => {
    const q = filter.toLowerCase();
    if (!q) return true;
    return (i.title + i.url + i.type + i.note).toLowerCase().includes(q);
  });

  const addItem = () => {
    if (!draft.title.trim()) return;
    const id = Math.max(0, ...items.map((i) => i.id)) + 1;
    setItems((its) => [{ ...draft, id, col: "todo" }, ...its]);
    setDraft(emptyDraft());
    setShowForm(false);
  };

  const saveItem = (updated: LearningItem) =>
    setItems((its) => its.map((i) => (i.id === updated.id ? { ...updated } : i)));

  const remove = (id: number) => setItems((its) => its.filter((i) => i.id !== id));

  const moveTo = (id: number, col: KanbanCol) =>
    setItems((its) => its.map((i) => (i.id === id ? { ...i, col } : i)));

  const editingItem = editingId != null ? items.find((i) => i.id === editingId) : undefined;

  return (
    <div>
      <h1 className={cx(styles.h1, "aorg-h1")}>Weiterbildung</h1>

      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <Search size={14} color={SLATE} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Weiterbildung durchsuchen…"
            className={styles.searchInput}
          />
        </div>
        <button onClick={() => setShowForm((s) => !s)} className={styles.btnToggle}>
          {showForm ? <X size={13} /> : <Plus size={13} />} {showForm ? "Abbrechen" : "Hinzufügen"}
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
              value={draft.type}
              onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as LearningType }))}
              className={styles.formTypeSelect}
            >
              {LEARNING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
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
            placeholder="Notiz (optional) — warum interessant, wer hat's empfohlen…"
            className={styles.formNote}
          />
          <button onClick={addItem} className={styles.btnSave}>Speichern</button>
        </div>
      )}

      <div className="aorg-kanban-grid">
        {LEARNING_COLS.map((col) => {
          const colItems = filtered.filter((i) => i.col === col.key);
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
                <span>{colItems.length}</span>
              </div>
              <div className={styles.laneList}>
                {colItems.map((i) => (
                  <LearningCard
                    key={i.id}
                    item={i}
                    onEdit={(it) => setEditingId(it.id)}
                    onDelete={remove}
                    dragId={dragId}
                    setDragId={setDragId}
                  />
                ))}
                {colItems.length === 0 && <div className={styles.empty}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editingItem && (
        <LearningItemModal
          item={editingItem}
          onClose={() => setEditingId(null)}
          onSave={saveItem}
        />
      )}
    </div>
  );
};
