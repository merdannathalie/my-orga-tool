import styles from "./ConfirmDialog.module.scss";

type Props = {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({ message, onConfirm, onCancel }: Props) => (
  <div onClick={onCancel} className={styles.overlay}>
    <div onClick={(e) => e.stopPropagation()} className={styles.panel}>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button onClick={onConfirm} className={styles.btnConfirm}>
          Ja, löschen
        </button>
        <button onClick={onCancel} className={styles.btnCancel}>
          Abbrechen
        </button>
      </div>
    </div>
  </div>
);
