import { useState } from "react";
import { X } from "lucide-react";
import { LEARNING_TYPES } from "../constants/nav";
import type { LearningItem, LearningType } from "../types";
import styles from "./LearningItemModal.module.scss";

type Props = {
  item: LearningItem;
  onClose: () => void;
  onSave: (i: LearningItem) => void;
};

export const LearningItemModal = ({ item, onClose, onSave }: Props) => {
  const [draft, setDraft] = useState<LearningItem>(item);

  const save = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div onClick={onClose} className={styles.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Eintrag bearbeiten</h3>
          <button onClick={onClose} aria-label="Schließen" className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <input
          value={draft.title}
          onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          placeholder="Titel"
          className={styles.input}
        />
        <select
          value={draft.type}
          onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as LearningType }))}
          className={styles.input}
        >
          {LEARNING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <input
          value={draft.url}
          onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
          placeholder="https://…"
          className={styles.input}
        />
        <textarea
          value={draft.note}
          onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
          placeholder="Notiz…"
          className={styles.textarea}
        />

        <div className={styles.actions}>
          <button onClick={save} className={styles.btnSave}>Speichern</button>
          <button onClick={onClose} className={styles.btnCancel}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
};
