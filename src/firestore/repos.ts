// Repository-Layer für die Firestore-Persistenz.
//
// Datenmodell:
//   users/{uid}/projects/{id}    — pro Projekt ein Doc
//   users/{uid}/tasks/{id}       — pro Aufgabe ein Doc
//   users/{uid}/notes/{id}       — pro Notiz ein Doc
//   users/{uid}/resources/{id}   — pro Ressource ein Doc
//   users/{uid}/learning/{id}    — pro Weiterbildungs-Eintrag ein Doc
//   users/{uid}/audit/{id}       — pro Audit-Kriterium ein Doc
//   users/{uid}/auditPages/{id}  — pro Audit-Seite (Kunden-URL) ein Doc
//   users/{uid}/meetings/{id}    — pro Meeting ein Doc
//   users/{uid}/settings/state   — Einzel-Doc mit gratitude/dayNotes/theme
//
// Doc-ID ist immer String(item.id). Payload enthält das komplette Item
// inkl. `id`, damit das App-Layer nichts umbauen muss.

import {
  collection, doc, getDocs, setDoc, deleteDoc, getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type {
  Project, Task, Note, Resource, LearningItem, AuditItem, AuditPage, Meeting, Theme,
} from "../types";

export type CollectionName =
  | "projects" | "tasks" | "notes" | "resources"
  | "learning" | "audit" | "auditPages" | "meetings";

type Ided = { id: string | number };

const collRef = (uid: string, name: CollectionName) =>
  collection(db, "users", uid, name);

const docRef = (uid: string, name: CollectionName, id: string | number) =>
  doc(db, "users", uid, name, String(id));

export const loadAll = async <T>(uid: string, name: CollectionName): Promise<T[]> => {
  const snap = await getDocs(collRef(uid, name));
  return snap.docs.map((d) => d.data() as T);
};

// Vergleicht current mit previous; schreibt neue/geänderte Items, löscht entfernte.
// previous = Snapshot dessen, was aktuell in Firestore steht.
// Rückgabe: neuer Snapshot (== current, als Copy für den nächsten Diff).
export const syncCollection = async <T extends Ided>(
  uid: string,
  name: CollectionName,
  current: T[],
  previous: T[],
): Promise<T[]> => {
  const prevMap = new Map(previous.map((x) => [String(x.id), x] as const));
  const currMap = new Map(current.map((x) => [String(x.id), x] as const));

  const ops: Promise<void>[] = [];

  for (const [id, item] of currMap) {
    const prev = prevMap.get(id);
    if (!prev || JSON.stringify(prev) !== JSON.stringify(item)) {
      ops.push(setDoc(docRef(uid, name, id), item as object));
    }
  }
  for (const id of prevMap.keys()) {
    if (!currMap.has(id)) {
      ops.push(deleteDoc(docRef(uid, name, id)));
    }
  }

  await Promise.all(ops);
  return current;
};

// Einzel-Doc mit den kleinen Einstellungen — gratitude/dayNotes/theme werden
// nicht als Liste behandelt, weil es dafür keine sinnvolle Doc-Aufteilung gibt.
export type SettingsPayload = {
  gratitude: string[];
  dayNotes: string;
  theme: Theme;
};

const settingsRef = (uid: string) => doc(db, "users", uid, "settings", "state");

export const loadSettings = async (uid: string): Promise<Partial<SettingsPayload> | null> => {
  const snap = await getDoc(settingsRef(uid));
  return snap.exists() ? (snap.data() as Partial<SettingsPayload>) : null;
};

export const saveSettings = async (uid: string, payload: SettingsPayload): Promise<void> => {
  await setDoc(settingsRef(uid), payload);
};

// --- Migration vom alten Modell (users/{uid}/app/state, ein Doc mit allem) ---

const legacyRef = (uid: string) => doc(db, "users", uid, "app", "state");

export type LegacyState = {
  projects?: Project[];
  tasks?: Task[];
  notes?: Note[];
  resources?: Resource[];
  learningItems?: LearningItem[];
  audit?: AuditItem[];
  auditPages?: AuditPage[];
  meetings?: Meeting[];
  gratitude?: string[];
  dayNotes?: string;
  theme?: Theme;
};

export const loadLegacy = async (uid: string): Promise<LegacyState | null> => {
  const snap = await getDoc(legacyRef(uid));
  return snap.exists() ? (snap.data() as LegacyState) : null;
};
