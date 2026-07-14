import styles from "./MindfulnessPanel.module.scss";

type Props = {
  gratitude: string[];
  setGratitude: (g: string[]) => void;
  dayNotes: string;
  setDayNotes: (v: string) => void;
};

export const MindfulnessPanel = ({ gratitude, setGratitude, dayNotes, setDayNotes }: Props) => (
  <div className={styles.panel}>
    <h2 className={styles.title}>Check-In</h2>
    <div className={`${styles.grid} aorg-mindful-grid`}>
      <div>
        <div className={styles.gratitudeGroup}>
          <div className={styles.heading}>Wofür bist du heute dankbar?</div>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.gratitudeRow}>
              <span className={styles.emoji}>🧡</span>
              <input
                value={gratitude[i] || ""}
                onChange={(e) =>
                  setGratitude(gratitude.map((g, gi) => (gi === i ? e.target.value : g)))
                }
                className={styles.gratitudeInput}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className={styles.heading}>Notizen zum Tag</div>
        <textarea
          value={dayNotes}
          onChange={(e) => setDayNotes(e.target.value)}
          placeholder="Kurze Gedanken, Erinnerungen, was heute ansteht…"
          className={styles.textarea}
        />
      </div>
    </div>
  </div>
);
