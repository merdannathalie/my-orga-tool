import type { CSSProperties } from "react";
import { deToISO, isoToDE } from "../utils/dates";
import { cx } from "../utils/cx";
import styles from "./DateField.module.scss";

type Props = {
  value: string;
  onChange: (deValue: string) => void;
  className?: string;
  style?: CSSProperties;
};

// Datumsfeld mit nativem Kalender-Picker — nach außen bleibt der Wert im
// deutschen Format (TT.MM.JJJJ), das der Rest der App nutzt.
export const DateField = ({ value, onChange, className, style }: Props) => (
  <input
    type="date"
    value={deToISO(value)}
    onChange={(e) => onChange(isoToDE(e.target.value))}
    className={cx(styles.dateField, className)}
    style={style}
  />
);
