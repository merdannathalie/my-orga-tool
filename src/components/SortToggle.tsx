import { ArrowUp, ArrowDown } from "lucide-react";
import { cx } from "../utils/cx";
import styles from "./SortToggle.module.scss";

export type SortDir = "asc" | "desc";

type Props = {
  label: string;
  state: SortDir | null;
  onClick: () => void;
};

export const SortToggle = ({ label, state, onClick }: Props) => {
  const active = state != null;
  return (
    <button
      onClick={onClick}
      className={cx(styles.toggle, active && styles.toggleActive)}
    >
      {label}
      {state === "asc" && <ArrowUp size={12} />}
      {state === "desc" && <ArrowDown size={12} />}
    </button>
  );
};
