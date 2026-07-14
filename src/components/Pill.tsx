import type { CSSProperties, ReactNode } from "react";
import styles from "./Pill.module.scss";

type Props = {
  children: ReactNode;
  color: string;
};

export const Pill = ({ children, color }: Props) => (
  <span className={styles.pill} style={{ ["--pill-color" as string]: color } as CSSProperties}>
    {children}
  </span>
);
