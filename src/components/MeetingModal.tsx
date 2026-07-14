import { useState } from "react";
import { X } from "lucide-react";
import { DateField } from "./DateField";
import { TIME_OPTIONS } from "../constants/nav";
import type { Meeting } from "../types";
import styles from "./MeetingModal.module.scss";

type Props = {
  meeting: Meeting;
  onClose: () => void;
  onSave: (m: Meeting) => void;
};

export const MeetingModal = ({ meeting, onClose, onSave }: Props) => {
  const [draft, setDraft] = useState<Meeting>(meeting);

  const save = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div onClick={onClose} className={styles.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.title}>Meeting bearbeiten</h3>
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
        <div className={styles.inputRow}>
          <DateField
            value={draft.date}
            onChange={(v) => setDraft((d) => ({ ...d, date: v }))}
            className={styles.date}
          />
          <input
            value={draft.time}
            onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
            placeholder="HH:MM"
            list="meeting-time-options"
            className={styles.time}
          />
          <datalist id="meeting-time-options">
            {TIME_OPTIONS.map((t) => <option key={t} value={t} />)}
          </datalist>
        </div>
        <input
          value={draft.participants}
          onChange={(e) => setDraft((d) => ({ ...d, participants: e.target.value }))}
          placeholder="Teilnehmer:innen"
          className={styles.input}
        />
        <input
          value={draft.link}
          onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
          placeholder="Teams-Link (optional)"
          className={styles.link}
        />

        <div className={styles.actions}>
          <button onClick={save} className={styles.btnSave}>Speichern</button>
          <button onClick={onClose} className={styles.btnCancel}>Abbrechen</button>
        </div>
      </div>
    </div>
  );
};
