import { Sun, Moon } from "lucide-react";
import type { Theme } from "../types";
import { cx } from "../utils/cx";
import styles from "./ThemeToggle.module.scss";

type Props = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

export const ThemeToggle = ({ theme, setTheme }: Props) => {
  const isDark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Zu Light Mode wechseln" : "Zu Dark Mode wechseln"}
      role="switch"
      aria-checked={!isDark}
      className={styles.toggle}
    >
      <Sun size={13} className={styles.iconSun} />
      <Moon size={12} className={styles.iconMoon} />
      <span className={cx(styles.thumb, isDark && styles.thumbRight)} />
    </button>
  );
};
