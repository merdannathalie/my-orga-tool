// React-Hooks, die einen State-Slice debounced mit Firestore synchronisieren.
// Getrennter Hook pro Collection → der Effekt feuert nur, wenn SEIN State
// tatsächlich ändert. So löst z. B. eine Änderung an einer Notiz keinen Diff
// über Projekte/Aufgaben/Ressourcen aus.

import { useEffect } from "react";
import type { RefObject } from "react";
import { syncCollection, saveSettings } from "./repos";
import type { CollectionName } from "./repos";
import type { Theme } from "../types";

const DEBOUNCE_MS = 800;

type Ided = { id: string | number };

export const useDebouncedCollectionSync = <T extends Ided>(
  uid: string,
  hydrated: boolean,
  name: CollectionName,
  current: T[],
  syncedRef: RefObject<T[]>,
): void => {
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(async () => {
      try {
        syncedRef.current = await syncCollection(uid, name, current, syncedRef.current);
      } catch (err) {
        console.error(`Firestore-Speichern (${name}) fehlgeschlagen:`, err);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
    // syncedRef ist bewusst nicht in den deps — es ist ein Ref, nicht State.
    // name ändert sich pro Hook-Instanz nie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, hydrated, uid]);
};

export const useDebouncedSettingsSync = (
  uid: string,
  hydrated: boolean,
  gratitude: string[],
  dayNotes: string,
  theme: Theme,
): void => {
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(async () => {
      try {
        await saveSettings(uid, { gratitude, dayNotes, theme });
      } catch (err) {
        console.error("Firestore-Speichern (settings) fehlgeschlagen:", err);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [uid, hydrated, gratitude, dayNotes, theme]);
};
