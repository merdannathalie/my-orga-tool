import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NAV } from "../constants/nav";
import type { TabKey } from "../constants/nav";
import { cx } from "../utils/cx";
import type { Theme } from "../types";
import styles from "./MobileNav.module.scss";

type Props = {
  tab: TabKey;
  setTab: (t: TabKey) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  onSignOut: () => void;
};

export const MobileNav = ({ tab, setTab, theme, setTheme, onSignOut }: Props) => {
  const [open, setOpen] = useState(false);

  const selectTab = (key: TabKey) => {
    setTab(key);
    setOpen(false);
  };

  return (
    <div className={styles.mobileNav}>
      <div className={styles.topbar}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button
          type="button"
          aria-label={open ? "Menü schließen" : "Menü öffnen"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={styles.burger}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className={styles.drawer}>
          <nav className={styles.nav}>
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => selectTab(key)}
                className={cx(styles.navBtn, tab === key && styles.navBtnActive)}
              >
                <Icon size={16} strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <button onClick={onSignOut} className={styles.signOut}>
            <LogOut size={16} />
            <span>Abmelden</span>
          </button>
        </div>
      )}
    </div>
  );
};
