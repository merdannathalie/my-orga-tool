import { useState } from "react";
import {
  Plus, X, Trash2, Pencil, Link2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { DateField } from "./DateField";
import { MeetingModal } from "./MeetingModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { TIME_OPTIONS } from "../constants/nav";
import { formatDEDate, isSameDay, parseGermanDateTime } from "../utils/dates";
import { cx } from "../utils/cx";
import type { Meeting } from "../types";
import styles from "./MeetingsPanel.module.scss";

type Props = {
  meetings: Meeting[];
  setMeetings: (updater: (ms: Meeting[]) => Meeting[]) => void;
};

type Draft = Omit<Meeting, "id">;

const emptyDraft = (): Draft => ({
  title: "",
  date: formatDEDate(new Date()),
  time: "",
  participants: "",
  link: "",
});

export const MeetingsPanel = ({ meetings, setMeetings }: Props) => {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  const realToday = new Date();
  realToday.setHours(0, 0, 0, 0);

  const baseDate = new Date(realToday);
  baseDate.setDate(realToday.getDate() + dayOffset);
  const day2 = new Date(baseDate);
  day2.setDate(baseDate.getDate() + 1);
  const day3 = new Date(baseDate);
  day3.setDate(baseDate.getDate() + 2);

  const columns = [baseDate, day2, day3].map((d, i) => ({
    key: `col-${i}`,
    label: isSameDay(d, realToday) ? "Heute" : formatDEDate(d),
    dateStr: formatDEDate(d),
  }));

  const sortByTime = (list: Meeting[]) =>
    [...list].sort((a, b) => {
      const ta = parseGermanDateTime(a.date, a.time);
      const tb = parseGermanDateTime(b.date, b.time);
      if (ta == null && tb == null) return 0;
      if (ta == null) return 1;
      if (tb == null) return -1;
      return ta - tb;
    });

  const addMeeting = () => {
    if (!draft.title.trim()) return;
    const id = Math.max(0, ...meetings.map((m) => m.id)) + 1;
    setMeetings((ms) => [...ms, { ...draft, id }]);
    setDraft(emptyDraft());
    setShowForm(false);
  };

  const saveMeeting = (updated: Meeting) =>
    setMeetings((ms) => ms.map((m) => (m.id === updated.id ? { ...updated } : m)));

  const remove = (id: number) => setMeetings((ms) => ms.filter((m) => m.id !== id));

  const moveToDate = (id: number, dateStr: string) =>
    setMeetings((ms) => ms.map((m) => (m.id === id ? { ...m, date: dateStr } : m)));

  const editingMeeting = editingId != null ? meetings.find((m) => m.id === editingId) : undefined;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Anstehende Meetings</h2>
        <button onClick={() => setShowForm((s) => !s)} className={styles.btnToggle}>
          {showForm ? <X size={12} /> : <Plus size={12} />} Meeting
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <input
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Titel"
            className={styles.formInput}
          />
          <div className={styles.formRow}>
            <DateField
              value={draft.date}
              onChange={(v) => setDraft((d) => ({ ...d, date: v }))}
              className={styles.date}
            />
            <input
              value={draft.time}
              onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
              placeholder="HH:MM"
              list="new-meeting-time-options"
              className={styles.time}
            />
            <datalist id="new-meeting-time-options">
              {TIME_OPTIONS.map((t) => <option key={t} value={t} />)}
            </datalist>
            <input
              value={draft.participants}
              onChange={(e) => setDraft((d) => ({ ...d, participants: e.target.value }))}
              placeholder="Teilnehmer:innen"
              className={styles.participants}
            />
          </div>
          <input
            value={draft.link}
            onChange={(e) => setDraft((d) => ({ ...d, link: e.target.value }))}
            placeholder="Teams-Link (optional)"
            className={styles.link}
          />
          <button onClick={addMeeting} className={styles.btnSave}>Speichern</button>
        </div>
      )}

      <div className={styles.dayNav}>
        <div className={styles.arrows}>
          <button
            onClick={() => setDayOffset((o) => o - 1)}
            aria-label="Einen Tag zurück"
            className={styles.btnArrow}
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={() => setDayOffset((o) => o + 1)}
            aria-label="Einen Tag vor"
            className={styles.btnArrow}
          >
            <ChevronRight size={15} />
          </button>
        </div>
        {dayOffset !== 0 && (
          <button onClick={() => setDayOffset(0)} className={styles.btnToday}>
            Zu Heute springen
          </button>
        )}
      </div>

      <div className="aorg-kanban-grid">
        {columns.map((col) => {
          const items = sortByTime(meetings.filter((m) => m.date === col.dateStr));
          const isOver = overCol === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
              onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId != null) moveToDate(dragId, col.dateStr);
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
                {items.map((m) => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={() => setDragId(m.id)}
                    onDragEnd={() => setDragId(null)}
                    className={cx(styles.card, dragId === m.id && styles.cardDragging)}
                  >
                    <div className={styles.cardBody}>
                      <div className={styles.cardMain}>
                        {m.time && <div className={styles.cardTime}>{m.time}</div>}
                        <div className={styles.cardTitle}>{m.title}</div>
                        {m.participants && (
                          <div className={styles.cardParticipants}>{m.participants}</div>
                        )}
                        {m.link && (
                          <a
                            href={m.link}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={styles.cardLink}
                          >
                            <Link2 size={11} /> {m.link}
                          </a>
                        )}
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          onClick={() => setEditingId(m.id)}
                          aria-label="Meeting bearbeiten"
                          className={styles.iconBtn}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(m.id)}
                          aria-label="Meeting löschen"
                          className={styles.iconBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className={styles.empty}>—</div>}
              </div>
            </div>
          );
        })}
      </div>

      {editingMeeting && (
        <MeetingModal
          meeting={editingMeeting}
          onClose={() => setEditingId(null)}
          onSave={saveMeeting}
        />
      )}

      {confirmDeleteId != null && (
        <ConfirmDialog
          message="Dieses Meeting wirklich löschen?"
          onConfirm={() => { remove(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
};
