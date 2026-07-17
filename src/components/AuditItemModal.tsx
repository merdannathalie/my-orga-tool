import { useState } from "react";
import { X, Pencil } from "lucide-react";
import { Pill } from "./Pill";
import { SLATE, FOCUS } from "../constants/colors";
import { AUDIT_STATUSES, SEVERITIES, SEVERITY_LABEL } from "../constants/wcag";
import { auditStatusColor, severityColor, severityLabel } from "../utils/audit";
import { cx } from "../utils/cx";
import type { AuditItem, AuditStatus, Severity } from "../types";
import styles from "./AuditItemModal.module.scss";

type Props = {
  item: AuditItem;
  onClose: () => void;
  onSave: (item: AuditItem) => void;
};

export const AuditItemModal = ({ item, onClose, onSave }: Props) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<AuditItem>(item);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(item);
    setEditing(true);
  };

  return (
    <div onClick={onClose} className={styles.overlay}>
      <div onClick={(e) => e.stopPropagation()} className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.tags}>
            <Pill color={FOCUS}>{item.code}</Pill>
            <Pill color={SLATE}>{item.level}</Pill>
          </div>
          <button onClick={onClose} aria-label="Schließen" className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>
        <h3 className={styles.title}>{item.name}</h3>
        <div className={styles.subtitle}>{item.principle} · {item.guideline}</div>

        {!editing ? (
          <div>
            <div className={styles.statusRow}>
              <Pill color={auditStatusColor(item.status)}>{item.status}</Pill>
              {item.severity && (
                <Pill color={severityColor(item.severity)}>{severityLabel(item.severity)}</Pill>
              )}
            </div>
            <div className={styles.label}>Notiz</div>
            <p className={cx(styles.noteText, item.note ? styles.noteTextFilled : styles.noteTextEmpty)}>
              {item.note || "Keine Notiz."}
            </p>
            {item.codeExample && (
              <div>
                <div className={styles.label}>Beispielcode</div>
                <pre className={styles.codePre}>{item.codeExample}</pre>
              </div>
            )}
            {item.recommendation && (
              <div>
                <div className={styles.label}>Empfehlung</div>
                <p className={styles.recommendationText}>{item.recommendation}</p>
              </div>
            )}
            <button onClick={startEdit} className={styles.btnEdit}>
              <Pencil size={13} /> Bearbeiten
            </button>
          </div>
        ) : (
          <div>
            <div className={styles.editRow}>
              <select
                value={draft.status}
                onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as AuditStatus }))}
                className={styles.select}
              >
                {AUDIT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={draft.severity ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    severity: (e.target.value || null) as Severity | null,
                  }))
                }
                className={styles.select}
                aria-label="Schweregrad"
              >
                <option value="">— Schweregrad —</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div className={styles.label}>Notiz</div>
            <textarea
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              placeholder="Befund, Kontext, Begründung…"
              className={styles.textareaNote}
            />
            <div className={styles.label}>Beispielcode</div>
            <textarea
              value={draft.codeExample}
              onChange={(e) => setDraft((d) => ({ ...d, codeExample: e.target.value }))}
              placeholder="z. B. Vorher/Nachher-Snippet"
              className={styles.textareaCode}
            />
            <div className={styles.label}>Empfehlung</div>
            <textarea
              value={draft.recommendation}
              onChange={(e) => setDraft((d) => ({ ...d, recommendation: e.target.value }))}
              placeholder="Was der Kunde konkret tun sollte, um das Kriterium zu erfüllen"
              className={styles.textareaRecommendation}
            />
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
