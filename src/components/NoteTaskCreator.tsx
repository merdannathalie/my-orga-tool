import { useState } from "react";
import { Plus, X } from "lucide-react";
import { DateField } from "./DateField";
import { cx } from "../utils/cx";
import type { Priority, Task } from "../types";
import styles from "./NoteTaskCreator.module.scss";

type Props = {
  project: number;
  setTasks: (updater: (ts: Task[]) => Task[]) => void;
};

export const NoteTaskCreator = ({ project, setTasks }: Props) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>("moderate");
  const [due, setDue] = useState("");
  const [justAdded, setJustAdded] = useState(false);

  const addTask = () => {
    if (!title.trim()) return;
    setTasks((ts) => {
      const id = Math.max(0, ...ts.map((t) => t.id)) + 1;
      return [...ts, { id, project, title: title.trim(), description: "", priority, due, col: "todo" }];
    });
    setTitle("");
    setPriority("moderate");
    setDue("");
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cx(styles.toggle, open && styles.toggleOpen)}
      >
        {open ? <X size={13} /> : <Plus size={13} />}
        Aufgabe aus dieser Notiz erstellen
      </button>
      {open && (
        <div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel der Aufgabe"
            className={styles.input}
          />
          <div className={styles.row}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className={styles.select}
            >
              <option value="low">low</option>
              <option value="moderate">moderate</option>
              <option value="severe">severe</option>
            </select>
            <DateField value={due} onChange={setDue} className={styles.date} />
            <button onClick={addTask} className={styles.btnAdd}>Anlegen</button>
          </div>
          {justAdded && (
            <div className={styles.confirmation}>
              ✓ Aufgabe angelegt — im To-do-Board und unter "Aufgaben" zu finden.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
