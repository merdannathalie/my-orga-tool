import { makeAudit } from "../utils/audit";
import type {
  AuditItem, LearningItem, Meeting, Note, Project, Resource, Task,
} from "../types";

export const initialProjects: Project[] = [
  { id: 1, name: "Nordwind Bank AG", description: "Accessibility-Audit für die Online-Banking-Plattform, Schwerpunkt Checkout- und Überweisungs-Flow.", deadline: "24.07.2026", completed: false },
  { id: 2, name: "Halberg Retail GmbH", description: "Audit von Onlineshop und App-Checkout. Legacy-Component-Library mit vielen Custom-Dropdowns ohne ARIA.", deadline: "31.07.2026", completed: false },
  { id: 3, name: "Ministerium für Digitales", description: "EN 301549-Mapping für das neue Bürgerportal, zusätzlich zu WCAG 2.2 AA.", deadline: "12.08.2026", completed: false },
];

export const initialAudit: AuditItem[] = makeAudit(1, {
  "1.1.1": { status: "erfüllt", note: "Alt-Texte für alle produktrelevanten Bilder vorhanden, Icons als dekorativ markiert." },
  "1.4.3": {
    status: "nicht erfüllt",
    critical: true,
    note: "Fehlermeldungen (Rot #E24B4A auf Rosa #FCEBEB) liegen bei ca. 3.2:1, benötigt werden 4.5:1.",
    codeExample: ".form-error {\n  color: #7A1F1F; /* statt #E24B4A */\n  background: #FCEBEB;\n}",
  },
  "2.4.7": { status: "nicht erfüllt", critical: true, note: "Fokus-Indikator wird von Sticky-Header im Checkout überdeckt." },
  "4.1.2": {
    status: "nicht erfüllt",
    critical: true,
    note: "Custom-Dropdown im Warenkorb hat keine ARIA-Rolle, NVDA liest keinen Namen vor.",
    codeExample: '<div role="listbox" aria-label="Menge auswählen" tabindex="0">\n  ...\n</div>',
  },
  "2.1.1": { status: "erfüllt" },
  "3.3.2": { status: "wird geprüft" },
});

export const initialTasks: Task[] = [
  { id: 1, project: 1, title: "Screenreader-Test Checkout-Flow (NVDA)", description: "Kompletten Checkout mit NVDA + Firefox durchgehen, Fokus-Reihenfolge dokumentieren.", due: "14.07.2026", col: "doing", priority: "severe" },
  { id: 2, project: 1, title: "Audit-Report Entwurf an Engagement Lead", description: "Erste Fassung des Audit-Reports zur Durchsicht schicken.", due: "18.07.2026", col: "todo", priority: "moderate" },
  { id: 3, project: 2, title: "Kick-off-Notizen finalisieren", description: "Notizen aus dem Kick-off-Call ins Protokoll überführen.", due: "11.07.2026", col: "done", priority: "low" },
  { id: 4, project: 3, title: "EN 301549 Mapping vorbereiten", description: "WCAG-Kriterien auf EN 301549 Abschnitte mappen für Ministerium-Mandat.", due: "01.08.2026", col: "todo", priority: "moderate" },
];

export const initialResources: Resource[] = [
  {
    id: 1,
    title: "WCAG 2.2 – Understanding Docs",
    url: "https://www.w3.org/WAI/WCAG22/Understanding/",
    category: "Richtlinie",
    note: "Immer zuerst hier nachschlagen, bevor ich ein Kriterium im Report zitiere. Beispiele bei 'Sufficient Techniques' sind gold für Kunden-Erklärungen.",
  },
  {
    id: 2,
    title: "EN 301549 (aktuelle Fassung)",
    url: "https://www.etsi.org/deliver/etsi_en/301500_301599/301549/",
    category: "Richtlinie",
    note: "Für öffentliche Auftraggeber (z.B. Ministerium-Mandat) zusätzlich zu WCAG mappen.",
  },
  {
    id: 3,
    title: "axe DevTools",
    url: "https://www.deque.com/axe/devtools/",
    category: "Testtool",
    note: "Erster automatisierter Scan. Ersetzt kein manuelles Testing, aber gut für schnelle Vorab-Übersicht.",
  },
  {
    id: 4,
    title: "NVDA Tastenkombinationen (Cheat Sheet)",
    url: "https://webaim.org/resources/shortcuts/nvda",
    category: "Testtool",
    note: "",
  },
];

export const initialLearningItems: LearningItem[] = [
  {
    id: 1,
    title: "A11ycasts (YouTube-Reihe von Rob Dodson)",
    url: "https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g",
    type: "Video",
    note: "Gute Auffrischung zu ARIA-Grundlagen, eignet sich auch als Erklärvideo für Kunden.",
    col: "todo",
  },
  {
    id: 2,
    title: "Deque University Blog",
    url: "https://www.deque.com/blog/",
    type: "Artikel",
    note: "",
    col: "todo",
  },
  {
    id: 3,
    title: "EN 301549 Einführungs-Webinar",
    url: "",
    type: "Kurs",
    note: "Empfehlung von S. Cohen — Titel/Link noch nachtragen.",
    col: "todo",
  },
];

export const initialMeetings: Meeting[] = [
  { id: 1, title: "Abstimmung Reporting-Template", date: "13.07.2026", time: "15:00", participants: "S. Cohen", link: "" },
  { id: 2, title: "Kickoff-Call Nordwind Bank AG", date: "14.07.2026", time: "10:30", participants: "L. Brandt, S. Cohen", link: "" },
  { id: 3, title: "Team-Sync Accessibility Practice", date: "15.07.2026", time: "09:00", participants: "Team", link: "" },
];

export const initialNotes: Note[] = [
  {
    id: 1,
    project: 1,
    date: "08.07.2026",
    type: "Kunden-Call",
    title: "Status-Call Checkout-Flow",
    participants: "L. Brandt (Nordwind, Product Owner), ich",
    protocol: "Fokus-Reihenfolge im Warenkorb springt nach Modal-Close. Kontrast der Fehlermeldungen (Rot auf Rosa) liegt unter 4.5:1 — Screenshot im Ordner. Nordwind priorisiert 4.1.2 vor 1.4.3, da Formular-Redesign ohnehin geplant ist.",
    openPoints: "Fokus-Reihenfolge Warenkorb\nKontrast Fehlermeldungen (4.1.2 vor 1.4.3 priorisiert)",
    nextSteps: "Entwurf Report bis 18.07, danach Review-Call ansetzen.",
  },
  {
    id: 2,
    project: 1,
    date: "01.07.2026",
    type: "Intern",
    title: "Abstimmung mit Engagement Lead",
    participants: "S. Cohen (Engagement Lead), ich",
    protocol: "Scope bleibt bei AA, kein Ausbau auf AAA in diesem Zyklus. Reporting-Template Deloitte-Standard v3 verwenden.",
    openPoints: "",
    nextSteps: "",
  },
  {
    id: 3,
    project: 2,
    date: "05.07.2026",
    type: "Kick-off",
    title: "Kick-off Halberg Retail",
    participants: "T. Nguyen (UX Lead), ich",
    protocol: "Scope: Onlineshop + App-Checkout. Legacy-Component-Library, viele Custom-Dropdowns ohne ARIA.",
    openPoints: "",
    nextSteps: "",
  },
];
