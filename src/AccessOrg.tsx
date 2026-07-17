import { useEffect, useRef, useState } from "react";
import { LogOut, Loader2 } from "lucide-react";

import {
  loadAll, syncCollection, loadSettings, saveSettings, loadLegacy,
} from "./firestore/repos";
import {
  useDebouncedCollectionSync, useDebouncedSettingsSync,
} from "./firestore/hooks";

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
import { makeAudit, migrateAuditItem } from "./utils/audit";
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

  // Letzter bekannter Firestore-Stand pro Collection. Wird beim Load initialisiert
  // und pro Hook-Aufruf nach erfolgreichem Diff-Sync fortgeschrieben. Der Diff
  // gegen den Ref entscheidet, was upgedatet und was gelöscht wird.
  // Getrennte Refs → jeder Save-Hook hat seinen eigenen Snapshot, unabhängig
  // von den anderen Collections.
  const projectsSynced = useRef<Project[]>([]);
  const tasksSynced = useRef<Task[]>([]);
  const notesSynced = useRef<Note[]>([]);
  const resourcesSynced = useRef<Resource[]>([]);
  const learningSynced = useRef<LearningItem[]>([]);
  const auditSynced = useRef<AuditItem[]>([]);
  const meetingsSynced = useRef<Meeting[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 1) Parallel aus allen Collections laden
        const [
          projectsDb, tasksDb, notesDb, resourcesDb, learningDb, auditDb, meetingsDb, settingsDb,
        ] = await Promise.all([
          loadAll<Project>(uid, "projects"),
          loadAll<Task>(uid, "tasks"),
          loadAll<Note>(uid, "notes"),
          loadAll<Resource>(uid, "resources"),
          loadAll<LearningItem>(uid, "learning"),
          loadAll<unknown>(uid, "audit").then((raws) => raws.map(migrateAuditItem)),
          loadAll<Meeting>(uid, "meetings"),
          loadSettings(uid),
        ]);

        // 2) Falls alle Collections + Settings leer sind, aber ein Legacy-Doc
        //    existiert (users/{uid}/app/state), einmalig hoch-migrieren.
        const allEmpty =
          !projectsDb.length && !tasksDb.length && !notesDb.length &&
          !resourcesDb.length && !learningDb.length && !auditDb.length &&
          !meetingsDb.length && !settingsDb;

        if (allEmpty) {
          const legacy = await loadLegacy(uid);
          if (!cancelled && legacy) {
            await Promise.all([
              syncCollection(uid, "projects", legacy.projects ?? [], []),
              syncCollection(uid, "tasks", legacy.tasks ?? [], []),
              syncCollection(uid, "notes", legacy.notes ?? [], []),
              syncCollection(uid, "resources", legacy.resources ?? [], []),
              syncCollection(uid, "learning", legacy.learningItems ?? [], []),
              syncCollection(uid, "audit", legacy.audit ?? [], []),
              syncCollection(uid, "meetings", legacy.meetings ?? [], []),
              saveSettings(uid, {
                gratitude: legacy.gratitude ?? ["", "", ""],
                dayNotes: legacy.dayNotes ?? "",
                theme: legacy.theme ?? "dark",
              }),
            ]);

            if (cancelled) return;

            // States aus dem Legacy-Doc befüllen
            if (legacy.projects) setProjects(legacy.projects);
            if (legacy.tasks) setTasks(legacy.tasks);
            if (legacy.notes) setNotes(legacy.notes);
            if (legacy.resources) setResources(legacy.resources);
            if (legacy.learningItems) setLearningItems(legacy.learningItems);
            if (legacy.audit) setAudit(legacy.audit);
            if (legacy.meetings) setMeetings(legacy.meetings);
            if (legacy.gratitude) setGratitude(legacy.gratitude);
            if (typeof legacy.dayNotes === "string") setDayNotes(legacy.dayNotes);
            if (legacy.theme) setTheme(legacy.theme);

            projectsSynced.current = legacy.projects ?? [];
            tasksSynced.current = legacy.tasks ?? [];
            notesSynced.current = legacy.notes ?? [];
            resourcesSynced.current = legacy.resources ?? [];
            learningSynced.current = legacy.learningItems ?? [];
            auditSynced.current = legacy.audit ?? [];
            meetingsSynced.current = legacy.meetings ?? [];
          }
        } else if (!cancelled) {
          // Normalfall: State aus den Collections befüllen
          if (projectsDb.length) setProjects(projectsDb);
          if (tasksDb.length) setTasks(tasksDb);
          if (notesDb.length) setNotes(notesDb);
          if (resourcesDb.length) setResources(resourcesDb);
          if (learningDb.length) setLearningItems(learningDb);
          if (auditDb.length) setAudit(auditDb);
          if (meetingsDb.length) setMeetings(meetingsDb);
          if (settingsDb?.gratitude) setGratitude(settingsDb.gratitude);
          if (typeof settingsDb?.dayNotes === "string") setDayNotes(settingsDb.dayNotes);
          if (settingsDb?.theme) setTheme(settingsDb.theme);

          projectsSynced.current = projectsDb;
          tasksSynced.current = tasksDb;
          notesSynced.current = notesDb;
          resourcesSynced.current = resourcesDb;
          learningSynced.current = learningDb;
          auditSynced.current = auditDb;
          meetingsSynced.current = meetingsDb;
        }
      } catch (err) {
        console.error("Firestore-Laden fehlgeschlagen:", err);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => { cancelled = true; };
  }, [uid]);

  // Ein eigener debounced Sync pro Collection. Jeder Hook feuert nur, wenn SEIN
  // State-Slice sich ändert — bearbeitet man z. B. nur eine Notiz, wird nur die
  // notes-Collection angefasst; projects/tasks/resources/… bleiben stumm.
  useDebouncedCollectionSync(uid, hydrated, "projects", projects, projectsSynced);
  useDebouncedCollectionSync(uid, hydrated, "tasks", tasks, tasksSynced);
  useDebouncedCollectionSync(uid, hydrated, "notes", notes, notesSynced);
  useDebouncedCollectionSync(uid, hydrated, "resources", resources, resourcesSynced);
  useDebouncedCollectionSync(uid, hydrated, "learning", learningItems, learningSynced);
  useDebouncedCollectionSync(uid, hydrated, "audit", audit, auditSynced);
  useDebouncedCollectionSync(uid, hydrated, "meetings", meetings, meetingsSynced);
  useDebouncedSettingsSync(uid, hydrated, gratitude, dayNotes, theme);

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
