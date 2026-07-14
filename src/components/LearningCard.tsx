import { Pencil, Trash2, Link2 } from "lucide-react";
import { Pill } from "./Pill";
import { SLATE } from "../constants/colors";
import { cx } from "../utils/cx";
import type { LearningItem } from "../types";
import styles from "./LearningCard.module.scss";

type Props = {
  item: LearningItem;
  onEdit: (i: LearningItem) => void;
  onDelete: (id: number) => void;
  dragId: number | null;
  setDragId: (id: number | null) => void;
};

export const LearningCard = ({ item, onEdit, onDelete, dragId, setDragId }: Props) => (
  <div
    draggable
    onDragStart={() => setDragId(item.id)}
    onDragEnd={() => setDragId(null)}
    className={cx(styles.card, dragId === item.id && styles.cardDragging)}
  >
    <div className={styles.top}>
      <div className={styles.titleRow}>
        <span className={styles.title}>{item.title}</span>
        <Pill color={SLATE}>{item.type}</Pill>
      </div>
      <div className={styles.actions}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
          aria-label="Bearbeiten"
          className={styles.iconBtn}
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          aria-label="Löschen"
          className={styles.iconBtn}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
    {item.url && (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={styles.link}
      >
        <Link2 size={11} /> {item.url}
      </a>
    )}
    {item.note && <div className={styles.note}>{item.note}</div>}
  </div>
);
