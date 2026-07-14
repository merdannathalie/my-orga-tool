import { useEffect, useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

import { ThemeToggle } from "./components/ThemeToggle";
import { MobileNav } from "./components/MobileNav";
import { DashboardView } from "./views/DashboardView";
import { ProjectsView } from "./views/ProjectsView";
import { NotesView } from "./views/NotesView";
import { AuditTracker } from "./views/AuditTracker";
import { TasksListView } from "./views/TasksListView";
import { ResourceLibrary } from "./views/ResourceLibrary";
import { LearningListView } from "./views/LearningListView";

import { NAV } from "./constants/nav";
import type { TabKey } from "./constants/nav";
import {
  initialProjects, initialAudit, initialTasks, initialNotes,
  initialResources, initialLearningItems, initialMeetings,
} from "./constants/initialData";
import { makeAudit } from "./utils/audit";
import { cx } from "./utils/cx";
import type {
  AuditItem, LearningItem, Meeting, Note, Project, Resource, Task, Theme,
} from "./types";
import styles from "./AccessOrg.module.scss";

type Props = {
  uid: string;
  onSignOut: () => void;
};

export const AccessOrg = ({ uid, onSignOut }: Props) => {
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [activeProject, setActiveProject] = useState<number | null>(initialProjects[0]?.id ?? null);
  const [audit, setAudit] = useState<AuditItem[]>(initialAudit);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNote, setActiveNote] = useState<number>(initialNotes[0].id);
  const [noteFilter, setNoteFilter] = useState("");
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [learningItems, setLearningItems] = useState<LearningItem[]>(initialLearningItems);
  const [gratitude, setGratitude] = useState<string[]>(["", "", ""]);
  const [dayNotes, setDayNotes] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [greetingSeed] = useState<number>(() => Math.floor(Math.random() * 1000));
  const [theme, setTheme] = useState<Theme>("dark");

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ref = doc(db, "users", uid, "app", "state");
        const snap = await getDoc(ref);
        if (!cancelled && snap.exists()) {
          const d = snap.data();
          if (d.projects) setProjects(d.projects);
          if (d.audit) setAudit(d.audit);
          if (d.tasks) setTasks(d.tasks);
          if (d.notes) setNotes(d.notes);
          if (d.resources) setResources(d.resources);
          if (d.learningItems) setLearningItems(d.learningItems);
          if (d.gratitude) setGratitude(d.gratitude);
          if (typeof d.dayNotes === "string") setDayNotes(d.dayNotes);
          if (d.meetings) setMeetings(d.meetings);
          if (d.theme) setTheme(d.theme);
        }
      } catch (err) {
        console.error("Firestore-Laden fehlgeschlagen:", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(async () => {
      try {
        const ref = doc(db, "users", uid, "app", "state");
        await setDoc(ref, {
          projects, audit, tasks, notes, resources, learningItems,
          gratitude, dayNotes, meetings, theme,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Firestore-Speichern fehlgeschlagen:", err);
      }
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, audit, tasks, notes, resources, learningItems, gratitude, dayNotes, meetings, theme, hydrated, uid]);

  const toggleTask = (id: number) =>
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, col: x.col === "done" ? "todo" : "done" } : x)));

  const startAudit = (projectId: number) =>
    setAudit((a) => (a.some((x) => x.project === projectId) ? a : [...a, ...makeAudit(projectId)]));

  const updateAuditItem = (updated: AuditItem) =>
    setAudit((a) => a.map((x) => (x.id === updated.id ? updated : x)));

  if (!hydrated) {
    return (
      <div data-theme={theme} className={cx("aorg-shell", styles.loading)}>
        <div className={styles.loadingRow}>
          <Loader2 size={18} className={styles.loadingSpinner} />
          Lade deine Daten…
        </div>
      </div>
    );
  }

  return (
    <div data-theme={theme} className={cx("aorg-shell", styles.shell)}>
      <MobileNav
        tab={tab}
        setTab={setTab}
        theme={theme}
        setTheme={setTheme}
        onSignOut={onSignOut}
      />

      <div className={cx("aorg-sidebar", styles.sidebar)}>
        <nav className={cx("aorg-nav-list", styles.nav)}>
          {NAV.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cx("aorg-nav-btn", styles.navBtn, active && styles.navBtnActive)}
              >
                <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <ThemeToggle theme={theme} setTheme={setTheme} />
          <button
            onClick={onSignOut}
            aria-label="Abmelden"
            title="Abmelden"
            className={styles.signOut}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className={cx("aorg-main", styles.main)}>
        {tab === "dashboard" && (
          <DashboardView
            greetingSeed={greetingSeed}
            gratitude={gratitude}
            setGratitude={setGratitude}
            dayNotes={dayNotes}
            setDayNotes={setDayNotes}
            meetings={meetings}
            setMeetings={setMeetings}
            tasks={tasks}
            setTasks={setTasks}
            projects={projects}
          />
        )}

        {tab === "audit" && (
          <AuditTracker
            audit={audit}
            projects={projects}
            onStartAudit={startAudit}
            onUpdateItem={updateAuditItem}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        )}

        {tab === "tasks" && (
          <TasksListView tasks={tasks} toggleTask={toggleTask} projects={projects} />
        )}

        {tab === "notes" && (
          <NotesView
            notes={notes}
            setNotes={setNotes}
            projects={projects}
            activeNote={activeNote}
            setActiveNote={setActiveNote}
            noteFilter={noteFilter}
            setNoteFilter={setNoteFilter}
            setTasks={setTasks}
          />
        )}

        {tab === "library" && (
          <ResourceLibrary resources={resources} setResources={setResources} />
        )}

        {tab === "learning" && (
          <LearningListView items={learningItems} setItems={setLearningItems} />
        )}

        {tab === "projects" && (
          <ProjectsView
            projects={projects}
            setProjects={setProjects}
            activeProject={activeProject}
            setActiveProject={setActiveProject}
          />
        )}
      </div>
    </div>
  );
};
