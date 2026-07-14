import { Check } from "lucide-react";
import { FOCUS } from "../constants/colors";
import { cx } from "../utils/cx";
import styles from "./Checkbox.module.scss";

type Props = {
  checked: boolean;
  onChange: () => void;
  ariaLabel: string;
};

export const Checkbox = ({ checked, onChange, ariaLabel }: Props) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={onChange}
    className={cx(styles.checkbox, checked && styles.checkboxChecked)}
  >
    {checked && <Check size={11} color={FOCUS} strokeWidth={3} />}
  </button>
);
