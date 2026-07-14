import { MindfulnessPanel } from "../components/MindfulnessPanel";
import { MeetingsPanel } from "../components/MeetingsPanel";
import { KanbanBoard } from "../components/KanbanBoard";
import { getHomeGreeting } from "../utils/greeting";
import { cx } from "../utils/cx";
import type { Meeting, Project, Task } from "../types";
import styles from "./DashboardView.module.scss";

type Props = {
  greetingSeed: number;
  gratitude: string[];
  setGratitude: (g: string[]) => void;
  dayNotes: string;
  setDayNotes: (v: string) => void;
  meetings: Meeting[];
  setMeetings: (updater: (ms: Meeting[]) => Meeting[]) => void;
  tasks: Task[];
  setTasks: (updater: (ts: Task[]) => Task[]) => void;
  projects: Project[];
};

export const DashboardView = ({
  greetingSeed,
  gratitude, setGratitude,
  dayNotes, setDayNotes,
  meetings, setMeetings,
  tasks, setTasks,
  projects,
}: Props) => (
  <div>
    <div className={styles.header}>
      <h1 className={cx(styles.greeting, "aorg-h1")}>
        {getHomeGreeting(new Date().getHours(), greetingSeed)}
      </h1>
      <span className={styles.date}>
        {new Date().toLocaleDateString("de-DE", {
          weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
        })}
      </span>
    </div>

    <MindfulnessPanel
      gratitude={gratitude}
      setGratitude={setGratitude}
      dayNotes={dayNotes}
      setDayNotes={setDayNotes}
    />

    <MeetingsPanel meetings={meetings} setMeetings={setMeetings} />

    <KanbanBoard tasks={tasks} setTasks={setTasks} projects={projects} />
  </div>
);
