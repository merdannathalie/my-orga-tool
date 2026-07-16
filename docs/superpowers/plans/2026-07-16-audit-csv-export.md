# Audit-Tracker VPAT-Datenmodell & CSV-Export — Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** WCAG-Audit-Tracker VPAT-konform machen (5 Konformitäts-Stufen, 4-stufige Severity statt boolean, Empfehlungs-Feld) und CSV-Export pro Projekt in Excel-DACH-freundlichem Format ausliefern.

**Architecture:** Datenmodell in `src/types.ts` moderat erweitern; alte Firestore-Daten runtime beim Laden migrieren; UI in `AuditItemModal` + `AuditTracker` an das neue Modell anpassen; neuer `AuditTracker`-Header-Button ruft eine reine `auditToCsv`-Utility + einen kleinen Blob-Download-Wrapper auf; `slugify` wird aus `notesMarkdown.ts` in eine gemeinsame `src/utils/slug.ts` gezogen und von beiden Consumer geteilt.

**Tech Stack:** React 18 + TypeScript strict, Vite, SCSS Modules. Keine neuen npm-Deps. Kein Test-Framework aktiv — Verifikation via `npm run build` + `npx tsc --noEmit` + manueller Klick durch Dev-Server.

## Global Constraints

- Kein neues npm-Package.
- Firestore-Migration ist **runtime**, kein Batch-Script. Alte Docs mit `critical: boolean` müssen sauber in `severity: Severity | null` überführt werden.
- CSV: `;`-Trenner, UTF-8 mit BOM, `\r\n`-Zeilenenden, RFC-4180-Escape (Zellen mit `;`/`"`/`\r`/`\n` gequotet, `"` in Zellen verdoppelt).
- Dateiname: `<slugify(project.name)>-wcag-audit-<YYYY-MM-DD>.csv`, mit derselben `slugify`-Regel wie Notes-Markdown (Umlaute, Kleinbuchstaben, Sonderzeichen → `-`, Fallback `"projekt"`).
- Sortierung im CSV: Reihenfolge des Kriteriums im `WCAG_TEMPLATE`, nicht alphabetisch nach `code`.
- Styling ausschließlich mit `var(--c-*)` Theme-Variablen.
- Code-Kommentare nur wenn das *Warum* nicht offensichtlich ist.
- Kein `dangerouslySetInnerHTML`.

---

## Task 1: Datenmodell erweitern + Migration verdrahten

**Files:**
- Modify: `src/types.ts`
- Modify: `src/constants/wcag.ts`
- Modify: `src/utils/audit.ts`
- Modify: `src/AccessOrg.tsx` (nur der `loadAll<AuditItem>`-Aufruf)

**Interfaces:**
- Consumes: bestehende `Principle`, `AuditStatus`.
- Produces:
  - Neuer Typ `Severity = "kritisch" | "schwerwiegend" | "moderat" | "gering"`.
  - `AuditItem.severity: Severity | null`, `AuditItem.recommendation: string`. `critical` ist entfernt.
  - `AUDIT_STATUSES` hat 5 Werte in der Reihenfolge: `"wird geprüft"`, `"erfüllt"`, `"teilweise erfüllt"`, `"nicht erfüllt"`, `"nicht anwendbar"`.
  - `SEVERITIES: Severity[]` (in fallender Schwere).
  - `SEVERITY_LABEL: Record<Severity, string>` — `{ kritisch: "Kritisch", schwerwiegend: "Schwerwiegend", moderat: "Moderat", gering: "Gering" }`.
  - `severityColor(s: Severity | null): string` und `severityLabel(s: Severity | null): string` (letzterer liefert `""` für `null`).
  - `migrateAuditItem(raw: unknown): AuditItem` in `src/utils/audit.ts`.

- [ ] **Step 1: `src/types.ts` erweitern**

Ersetze in `src/types.ts`:

```ts
export type AuditStatus = "wird geprüft" | "nicht anwendbar" | "nicht erfüllt" | "erfüllt";
```

durch:

```ts
export type AuditStatus =
  | "wird geprüft"
  | "nicht anwendbar"
  | "nicht erfüllt"
  | "teilweise erfüllt"
  | "erfüllt";

export type Severity = "kritisch" | "schwerwiegend" | "moderat" | "gering";
```

Und ersetze den `AuditItem`-Block:

```ts
export type AuditItem = {
  id: string;
  project: number;
  code: string;
  name: string;
  level: "A" | "AA";
  principle: Principle;
  guideline: string;
  status: AuditStatus;
  critical: boolean;
  note: string;
  codeExample: string;
};

export type AuditOverride = Partial<Omit<AuditItem, "id" | "project" | "code" | "name" | "level" | "principle" | "guideline">>;
```

durch:

```ts
export type AuditItem = {
  id: string;
  project: number;
  code: string;
  name: string;
  level: "A" | "AA";
  principle: Principle;
  guideline: string;
  status: AuditStatus;
  severity: Severity | null;
  note: string;
  codeExample: string;
  recommendation: string;
};

export type AuditOverride = Partial<
  Omit<AuditItem, "id" | "project" | "code" | "name" | "level" | "principle" | "guideline">
>;
```

- [ ] **Step 2: `src/constants/wcag.ts` — Konstanten erweitern**

Am Ende der Datei (nach `PRINCIPLES` bzw. dem `AUDIT_STATUSES`-Export) — Zeile 67 anfassen:

```ts
export const AUDIT_STATUSES: AuditStatus[] = ["wird geprüft", "nicht anwendbar", "nicht erfüllt", "erfüllt"];
```

wird zu:

```ts
export const AUDIT_STATUSES: AuditStatus[] = [
  "wird geprüft",
  "erfüllt",
  "teilweise erfüllt",
  "nicht erfüllt",
  "nicht anwendbar",
];

export const SEVERITIES: Severity[] = ["kritisch", "schwerwiegend", "moderat", "gering"];

export const SEVERITY_LABEL: Record<Severity, string> = {
  kritisch: "Kritisch",
  schwerwiegend: "Schwerwiegend",
  moderat: "Moderat",
  gering: "Gering",
};
```

Der `import`-Header muss `Severity` mit importieren:

```ts
import type { AuditStatus, Principle, Severity, WcagCriterion } from "../types";
```

- [ ] **Step 3: `src/utils/audit.ts` — Farbe, Label, Migration, `makeAudit`**

Ersetze den kompletten Inhalt der Datei durch:

```ts
import { WCAG_TEMPLATE, SEVERITY_LABEL } from "../constants/wcag";
import { PASS, FAIL, FOCUS, SLATE, AMBER } from "../constants/colors";
import type { AuditItem, AuditOverride, AuditStatus, Severity } from "../types";

export const auditStatusColor = (s: AuditStatus): string =>
  s === "erfüllt" ? PASS
  : s === "teilweise erfüllt" ? AMBER
  : s === "nicht erfüllt" ? FAIL
  : s === "wird geprüft" ? FOCUS
  : SLATE;

export const severityColor = (s: Severity | null): string => {
  switch (s) {
    case "kritisch": return FAIL;
    case "schwerwiegend": return AMBER;
    case "moderat": return SLATE;
    case "gering": return SLATE;
    default: return SLATE;
  }
};

export const severityLabel = (s: Severity | null): string =>
  s ? SEVERITY_LABEL[s] : "";

const STATUSES: AuditStatus[] = [
  "wird geprüft", "erfüllt", "teilweise erfüllt", "nicht erfüllt", "nicht anwendbar",
];
const SEVERITY_VALUES: Severity[] = ["kritisch", "schwerwiegend", "moderat", "gering"];

// Runtime-Migration alter Firestore-Docs: `critical: boolean` → `severity: Severity | null`,
// `recommendation` als Default "". Whitelist-Prüfung für status/severity.
export const migrateAuditItem = (raw: unknown): AuditItem => {
  const r = raw as Record<string, unknown>;
  const status: AuditStatus = STATUSES.includes(r.status as AuditStatus)
    ? (r.status as AuditStatus)
    : "wird geprüft";
  let severity: Severity | null = null;
  if (SEVERITY_VALUES.includes(r.severity as Severity)) {
    severity = r.severity as Severity;
  } else if (r.critical === true) {
    severity = "kritisch";
  }
  return {
    id: String(r.id ?? ""),
    project: Number(r.project ?? 0),
    code: String(r.code ?? ""),
    name: String(r.name ?? ""),
    level: r.level === "AA" ? "AA" : "A",
    principle: r.principle as AuditItem["principle"],
    guideline: String(r.guideline ?? ""),
    status,
    severity,
    note: String(r.note ?? ""),
    codeExample: String(r.codeExample ?? ""),
    recommendation: String(r.recommendation ?? ""),
  };
};

export const makeAudit = (
  projectId: number,
  overrides: Record<string, AuditOverride> = {},
): AuditItem[] =>
  WCAG_TEMPLATE.map((c) => ({
    id: `${projectId}-${c.code}`,
    project: projectId,
    code: c.code,
    name: c.name,
    level: c.level,
    principle: c.principle,
    guideline: c.guideline,
    status: "wird geprüft",
    severity: null,
    note: "",
    codeExample: "",
    recommendation: "",
    ...(overrides[c.code] || {}),
  }));
```

Falls `AMBER` in `src/constants/colors.ts` noch nicht exportiert wird: prüfen und ergänzen.

- [ ] **Step 4: `AMBER`-Export in `src/constants/colors.ts` sicherstellen**

Run: `grep -n "export" /Users/nathaliemerdan/Documents/accessible-org/src/constants/colors.ts`

Falls `AMBER` nicht dabei ist, ergänze eine Zeile wie:

```ts
export const AMBER = "var(--c-amber)";
```

(Format an die bestehenden Exports anpassen — im Zweifel `PASS`/`FAIL` als Vorbild nehmen.)

- [ ] **Step 5: Migration in `src/AccessOrg.tsx` einbinden**

Öffne `src/AccessOrg.tsx`. Suche die Stelle mit `loadAll<AuditItem>(uid, "audit")` (~Zeile 85). Der Aufruf sieht ungefähr so aus:

```tsx
loadAll<AuditItem>(uid, "audit"),
```

Ersetze durch:

```tsx
loadAll<unknown>(uid, "audit").then((raws) => raws.map(migrateAuditItem)),
```

Und ergänze den Import oben:

```tsx
import { migrateAuditItem } from "./utils/audit";
```

(Falls schon aus `./utils/audit` importiert wird: den bestehenden Import erweitern.)

- [ ] **Step 6: Restliche `.critical`-Zugriffe temporär auf `null-status` umbiegen**

Suche in `src/`:

```bash
grep -rn "\.critical" /Users/nathaliemerdan/Documents/accessible-org/src
```

Erwartete Fundstellen:
- `src/views/AuditTracker.tsx`: `items.filter((i) => i.critical && i.status !== "erfüllt")` und `{a.critical && a.status !== "erfüllt" && <Pill…>}`.
- `src/components/AuditItemModal.tsx`: `item.critical`, `draft.critical`.

Diese werden in Task 2 und 3 sauber ersetzt. Für Task 1 reicht es, sie provisorisch typsicher zu machen, damit der Build läuft:

- In `AuditTracker.tsx`: `i.critical` → `(i.severity === "kritisch")`.
- In `AuditItemModal.tsx`: `item.critical` → `(item.severity === "kritisch")`; die Checkbox in `<Checkbox checked={draft.critical} onChange={() => setDraft((d) => ({ ...d, critical: !d.critical }))}` wird ganz **auskommentiert** — Task 2 baut sie sauber neu. Kommentiere die Checkbox-`<label>`-Zeile aus:

```tsx
{/* Task 2 setzt hier ein Severity-Dropdown ein */}
```

- [ ] **Step 7: Build + Typecheck**

Run:
```bash
npm run build && npx tsc --noEmit
```
Expected: beide clean. Keine `critical`-Referenzen mehr in `src/`.

Zur Kontrolle:
```bash
grep -rn "\.critical\b" /Users/nathaliemerdan/Documents/accessible-org/src
```
sollte nichts finden.

- [ ] **Step 8: Manuelle Rauch-Verifikation**

Run: `npm run dev`, App laden, Audit-Tracker aufmachen. Bestehende Audit-Daten sollten laden ohne Konsolen-Fehler; Items mit alter `critical: true`-Flag sollten in der Liste weiterhin ein „Kritisch"-artiges Marker anzeigen (weil `severity === "kritisch"` durch die Migration gesetzt wurde und der provisorische Fallback in Step 6 danach filtert).

Wenn nach Reload alles unauffällig ist: Task 1 fertig.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Extend audit model with severity + recommendation, migrate Firestore data on load"
```

---

## Task 2: `AuditItemModal` UI-Umbau

**Files:**
- Modify: `src/components/AuditItemModal.tsx`
- Modify: `src/components/AuditItemModal.module.scss`

**Interfaces:**
- Consumes: `severityColor`, `severityLabel` aus `src/utils/audit.ts`; `SEVERITIES`, `SEVERITY_LABEL` aus `src/constants/wcag.ts`.
- Produces: nichts extern.

- [ ] **Step 1: `AuditItemModal.tsx` — Imports erweitern**

Ersetze die drei Import-Zeilen am Kopf:

```tsx
import { Pill } from "./Pill";
import { Checkbox } from "./Checkbox";
import { SLATE, FAIL, FOCUS } from "../constants/colors";
import { AUDIT_STATUSES } from "../constants/wcag";
import { auditStatusColor } from "../utils/audit";
```

durch:

```tsx
import { Pill } from "./Pill";
import { SLATE, FOCUS } from "../constants/colors";
import { AUDIT_STATUSES, SEVERITIES, SEVERITY_LABEL } from "../constants/wcag";
import { auditStatusColor, severityColor, severityLabel } from "../utils/audit";
```

Und erweitere den Type-Import:

```tsx
import type { AuditItem, AuditStatus, Severity } from "../types";
```

`Checkbox` wird nicht mehr gebraucht — Import entfernen.

- [ ] **Step 2: `AuditItemModal.tsx` — Read-Mode: Severity-Pill statt `critical`-Pill**

Suche im `!editing`-Block diese Zeile:

```tsx
{(item.severity === "kritisch") && <Pill color={FAIL}>kritisch</Pill>}
```

(die von Task 1 Step 6 kam) und ersetze durch:

```tsx
{item.severity && (
  <Pill color={severityColor(item.severity)}>{severityLabel(item.severity)}</Pill>
)}
```

- [ ] **Step 3: `AuditItemModal.tsx` — Read-Mode: „Empfehlung"-Abschnitt hinzufügen**

Unmittelbar VOR `<button onClick={startEdit} className={styles.btnEdit}>` einfügen:

```tsx
{item.recommendation && (
  <>
    <div className={styles.label}>Empfehlung</div>
    <p className={styles.recommendationText}>{item.recommendation}</p>
  </>
)}
```

- [ ] **Step 4: `AuditItemModal.tsx` — Edit-Mode: Checkbox durch Severity-Dropdown ersetzen**

Suche den `editRow`-Block:

```tsx
<div className={styles.editRow}>
  <select
    value={draft.status}
    onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as AuditStatus }))}
    className={styles.select}
  >
    {AUDIT_STATUSES.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
  {/* Task 2 setzt hier ein Severity-Dropdown ein */}
</div>
```

Ersetze den Kommentar-Placeholder durch:

```tsx
<select
  value={draft.severity ?? ""}
  onChange={(e) =>
    setDraft((d) => ({
      ...d,
      severity: (e.target.value || null) as Severity | null,
    }))
  }
  className={styles.select}
  aria-label="Schweregrad"
>
  <option value="">— Schweregrad —</option>
  {SEVERITIES.map((s) => (
    <option key={s} value={s}>{SEVERITY_LABEL[s]}</option>
  ))}
</select>
```

- [ ] **Step 5: `AuditItemModal.tsx` — Edit-Mode: „Empfehlung"-Textarea ergänzen**

Direkt nach dem Beispielcode-Textarea:

```tsx
<div className={styles.label}>Beispielcode</div>
<textarea
  value={draft.codeExample}
  onChange={(e) => setDraft((d) => ({ ...d, codeExample: e.target.value }))}
  placeholder="z. B. Vorher/Nachher-Snippet"
  className={styles.textareaCode}
/>
```

füge unmittelbar danach ein:

```tsx
<div className={styles.label}>Empfehlung</div>
<textarea
  value={draft.recommendation}
  onChange={(e) => setDraft((d) => ({ ...d, recommendation: e.target.value }))}
  placeholder="Was der Kunde konkret tun sollte, um das Kriterium zu erfüllen"
  className={styles.textareaRecommendation}
/>
```

- [ ] **Step 6: `AuditItemModal.module.scss` — Neue Styles**

Am Ende der Datei anhängen:

```scss
.recommendationText {
  font-size: 0.84rem;
  color: var(--c-ink);
  margin: 4px 0 12px;
  white-space: pre-wrap;
}

.textareaRecommendation {
  @include textarea-base;
  width: 100%;
  min-height: 80px;
  padding: 8px 10px;
  border-radius: 7px;
  font-family: "Atkinson Hyperlegible", sans-serif;
  font-size: 0.84rem;
  margin-bottom: 14px;
}
```

(Falls `textarea-base` nicht direkt so heißt: gleich die vorhandenen Textarea-Klassen `.textareaNote` oder `.textareaCode` als Vorbild nehmen — die Basis-Regeln kopieren, sodass die Empfehlungs-Textarea zu den anderen passt.)

Wenn die alte `.criticalLabel`-Klasse in der SCSS-Datei existiert und nicht mehr benutzt wird — entfernen.

- [ ] **Step 7: Build + Typecheck**

```bash
npm run build && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 8: Manuell verifizieren**

Run `npm run dev`. Audit-Tracker öffnen, ein Item anklicken.
1. Read-Mode: falls Severity gesetzt, zeigt die richtige Pill. Empfehlung erscheint nur wenn befüllt.
2. Bearbeiten klicken → Severity-Dropdown zeigt aktuellen Wert oder „— Schweregrad —". Umschalten und speichern.
3. Neue Textarea „Empfehlung" ist da, wird gespeichert.
4. Status-Dropdown zeigt jetzt 5 Werte inkl. „teilweise erfüllt". Auswählen, speichern, Read-Mode zeigt Pill.

- [ ] **Step 9: Commit**

```bash
git add src/components/AuditItemModal.tsx src/components/AuditItemModal.module.scss
git commit -m "Rework audit item modal: severity dropdown + recommendation field"
```

---

## Task 3: `AuditTracker` — Severity in Item-Zeile & Zähl-Meta

**Files:**
- Modify: `src/views/AuditTracker.tsx`

**Interfaces:**
- Consumes: `severityColor`, `severityLabel` aus `src/utils/audit.ts`.
- Produces: nichts extern.

- [ ] **Step 1: Imports erweitern**

Ersetze:

```tsx
import { FAIL, FOCUS } from "../constants/colors";
import { PRINCIPLES } from "../constants/wcag";
import { auditStatusColor } from "../utils/audit";
```

durch:

```tsx
import { FOCUS } from "../constants/colors";
import { PRINCIPLES } from "../constants/wcag";
import { auditStatusColor, severityColor, severityLabel } from "../utils/audit";
```

`FAIL` bleibt raus (nicht mehr direkt genutzt).

- [ ] **Step 2: Zähl-Meta anpassen**

Suche:

```tsx
const criticalOpen = items.filter((i) => (i.severity === "kritisch") && i.status !== "erfüllt").length;
```

(die von Task 1 Step 6 kam) und ersetze durch:

```tsx
const severeOpen = items.filter(
  (i) => (i.severity === "kritisch" || i.severity === "schwerwiegend") && i.status !== "erfüllt",
).length;
```

Und die Anzeigezeile:

```tsx
({doneCount}/{items.length} erfüllt{criticalOpen > 0 ? ` · ${criticalOpen} kritisch offen` : ""})
```

zu:

```tsx
({doneCount}/{items.length} erfüllt{severeOpen > 0 ? ` · ${severeOpen} schwer offen` : ""})
```

- [ ] **Step 3: Item-Zeile — Severity-Pill statt `critical`-Pill**

Suche:

```tsx
{(a.severity === "kritisch") && a.status !== "erfüllt" && <Pill color={FAIL}>kritisch</Pill>}
```

Ersetze durch:

```tsx
{a.severity && a.status !== "erfüllt" && (
  <Pill color={severityColor(a.severity)}>{severityLabel(a.severity)}</Pill>
)}
```

- [ ] **Step 4: Build + Typecheck**

```bash
npm run build && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 5: Manuell verifizieren**

`npm run dev` — Audit-Tracker.
1. Projekt mit Audit aufklappen. Items mit Severity zeigen die entsprechende Pill nur solange `status !== "erfüllt"`.
2. Ein Item auf `erfüllt` setzen → Pill verschwindet.
3. Projekt-Meta zeigt „X schwer offen" für Items mit `kritisch`/`schwerwiegend` + nicht erfüllt.

- [ ] **Step 6: Commit**

```bash
git add src/views/AuditTracker.tsx
git commit -m "Show severity pill in audit item row and severe-open counter"
```

---

## Task 4: CSV-Export + Slug-Extract + Export-Button

**Files:**
- Create: `src/utils/slug.ts`
- Modify: `src/utils/notesMarkdown.ts` (extrahiert `slugify` in die neue Datei und importiert es zurück)
- Create: `src/utils/auditCsv.ts`
- Modify: `src/views/AuditTracker.tsx` (Button + Handler)
- Modify: `src/views/AuditTracker.module.scss` (Button-Style, Header-Layout)

**Interfaces:**
- Consumes: `AuditItem`, `Project`, `WCAG_TEMPLATE`, `severityLabel`.
- Produces:
  - `slugify(input: string, fallback?: string): string` in `src/utils/slug.ts`.
  - `AUDIT_CSV_COLUMNS`, `auditToCsvRow`, `auditToCsv`, `csvFilename`, `downloadAuditCsv` aus `src/utils/auditCsv.ts`.

- [ ] **Step 1: `src/utils/slug.ts` anlegen**

Neue Datei mit dieser Logik:

```ts
const UMLAUT_MAP: Record<string, string> = {
  ä: "ae", ö: "oe", ü: "ue", ß: "ss",
  Ä: "ae", Ö: "oe", Ü: "ue",
};

export const slugify = (input: string, fallback = "notiz"): string => {
  const replaced = input.replace(/[äöüßÄÖÜ]/g, (c) => UMLAUT_MAP[c] ?? c);
  const slug = replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
};
```

- [ ] **Step 2: `notesMarkdown.ts` refactorn**

Öffne `src/utils/notesMarkdown.ts`. Ersetze am Anfang den lokalen `UMLAUT_MAP` + `slugify`-Block durch einen Import:

```ts
import { slugify } from "./slug";
```

Und lösche den lokalen `UMLAUT_MAP` und die lokale `slugify`-Funktion. Der `noteFilename`-Aufruf `slugify(note.title)` funktioniert weiter (Fallback ist per default `"notiz"`).

- [ ] **Step 3: `src/utils/auditCsv.ts` anlegen**

Neue Datei mit vollem Inhalt:

```ts
import { WCAG_TEMPLATE } from "../constants/wcag";
import { slugify } from "./slug";
import { severityLabel } from "./audit";
import type { AuditItem, Project } from "../types";

export const AUDIT_CSV_COLUMNS = [
  "Nr.",
  "Kriterium",
  "Prinzip",
  "Konformitätsstufe",
  "Richtlinie",
  "Bewertung",
  "Schweregrad",
  "Anmerkung",
  "Beispiel/Nachweis",
  "Empfehlung",
] as const;

const CSV_BOM = "﻿";
const DELIM = ";";
const NEWLINE = "\r\n";

const escapeCell = (val: string): string => {
  if (val === "") return "";
  if (/[";\r\n]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
};

export const auditToCsvRow = (item: AuditItem): string[] => [
  item.code,
  item.name,
  item.principle,
  item.level,
  item.guideline,
  item.status,
  severityLabel(item.severity),
  item.note,
  item.codeExample,
  item.recommendation,
];

const templateIndex = (code: string): number => {
  const i = WCAG_TEMPLATE.findIndex((c) => c.code === code);
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
};

const sortByTemplate = (items: AuditItem[]): AuditItem[] =>
  [...items].sort((a, b) => templateIndex(a.code) - templateIndex(b.code));

export const auditToCsv = (items: AuditItem[]): string => {
  const rows = [
    AUDIT_CSV_COLUMNS.map(escapeCell).join(DELIM),
    ...sortByTemplate(items).map((it) =>
      auditToCsvRow(it).map(escapeCell).join(DELIM),
    ),
  ];
  return CSV_BOM + rows.join(NEWLINE) + NEWLINE;
};

const todayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const csvFilename = (project: Project): string =>
  `${slugify(project.name, "projekt")}-wcag-audit-${todayIso()}.csv`;

export const downloadAuditCsv = (items: AuditItem[], project: Project): void => {
  const csv = auditToCsv(items);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = csvFilename(project);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 4: `AuditTracker.tsx` — Imports + Button**

Ergänze am Kopf:

```tsx
import { Plus, ChevronDown, ChevronRight, Download } from "lucide-react";
```

und weiter unten:

```tsx
import { downloadAuditCsv } from "../utils/auditCsv";
```

Suche im JSX:

```tsx
{items.length > 0 ? (
  <span className={styles.projectMeta}>
    ({doneCount}/{items.length} erfüllt{severeOpen > 0 ? ` · ${severeOpen} schwer offen` : ""})
  </span>
) : (
  <span className={styles.projectMeta}>(kein Audit gestartet)</span>
)}
```

Ersetze durch:

```tsx
{items.length > 0 ? (
  <>
    <span className={styles.projectMeta}>
      ({doneCount}/{items.length} erfüllt{severeOpen > 0 ? ` · ${severeOpen} schwer offen` : ""})
    </span>
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); downloadAuditCsv(items, p); }}
      className={styles.btnCsv}
      title="Diesen Audit als CSV exportieren"
    >
      <Download size={13} /> CSV-Export
    </button>
  </>
) : (
  <span className={styles.projectMeta}>(kein Audit gestartet)</span>
)}
```

- [ ] **Step 5: `AuditTracker.module.scss` — Button-Style**

Am Ende der Datei anhängen:

```scss
.btnCsv {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 6px;
  padding: 4px 9px;
  font-size: 0.78rem;
  font-family: inherit;
  color: var(--c-ink);
  cursor: pointer;
}
.btnCsv:hover { background: var(--c-selected-bg); }
```

Der Projekt-Header ist ein `<button>` mit `display: flex` (im bestehenden CSS zu prüfen). `margin-left: auto` schiebt den CSV-Button ans rechte Ende der Header-Zeile. Falls das Layout kaputt aussieht, `.projectHeader` mit `justify-content: flex-start` sicherstellen — sonst nichts anfassen.

- [ ] **Step 6: Build + Typecheck**

```bash
npm run build && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 7: Manuell verifizieren**

`npm run dev`.
1. Audit-Tracker aufmachen. Bei einem Projekt mit gestartetem Audit erscheint rechts der `⤓ CSV-Export`-Button.
2. Klick auf den Button → Download der Datei. Klick darf den Projekt-Header **nicht** auf-/zuklappen.
3. Bei Projekten ohne Audit ist der Button nicht sichtbar.
4. Öffne die heruntergeladene `.csv` in Excel:
   - Umlaute lesbar (`Prüfung`, `Anmerkung`, …).
   - Trenner `;` — Excel legt Spalten korrekt an.
   - Header: `Nr.`, `Kriterium`, `Prinzip`, `Konformitätsstufe`, `Richtlinie`, `Bewertung`, `Schweregrad`, `Anmerkung`, `Beispiel/Nachweis`, `Empfehlung`.
   - Zeilen nach WCAG-Nummer sortiert (1.1.1, 1.2.1, 1.2.2, … 1.4.13, 2.1.1, …).
   - Ein Item mit Kommas + Semikolons + Zeilenumbrüchen + Anführungszeichen in Notiz → wird korrekt gequotet.
5. Öffnen mit `cat` im Terminal: erste 3 Bytes = `EF BB BF` (UTF-8-BOM), Zeilen enden mit `\r\n`.
6. Notes-Feature testen: eine Notiz mit `slugify`-relevantem Titel exportieren → funktioniert weiterhin.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Add WCAG audit CSV export (Excel-DACH format) and share slugify utility"
```

---

## Abschluss-Check gegen Spec

- [x] Datenmodell erweitert: `severity` + `recommendation`, 5 Status-Werte — Task 1.
- [x] Migration bestehender Firestore-Docs — Task 1.
- [x] Modal-UI: Severity-Dropdown + Recommendation-Textarea — Task 2.
- [x] Tracker-UI: Severity-Pill + Zähl-Meta — Task 3.
- [x] CSV mit den 10 Spalten in richtiger Reihenfolge — Task 4.
- [x] Excel-DACH-Format (`;`, UTF-8 BOM, `\r\n`, RFC-4180-Escape) — Task 4.
- [x] Dateiname mit shared `slugify` — Task 4.
- [x] Sortierung nach `WCAG_TEMPLATE`-Reihenfolge — Task 4.
- [x] Button nicht sichtbar bei leerem Audit; stopPropagation — Task 4.
