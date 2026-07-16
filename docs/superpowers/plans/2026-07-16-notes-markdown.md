# Notizen Markdown-Formatierung & Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Notizen im `NotesView` mit Markdown formatieren (Preview-Toggle) und einzelne Notiz als `.md`-Datei exportieren können.

**Architecture:** Neue Pure-Utility `src/utils/notesMarkdown.ts` liefert `noteToMarkdown`, `slugify`, `noteFilename` und den Blob-Download-Wrapper. `NotesView.tsx` bekommt einen Edit/Preview-Toggle (State pro Notiz), rendert im Preview-Modus die drei Freitext-Felder via `react-markdown` + `remark-gfm`, und einen Export-Button im Editor-Footer.

**Tech Stack:** React 18, TypeScript strict, Vite, SCSS Modules. Neue npm-Deps: `react-markdown`, `remark-gfm`. Kein Test-Framework in diesem Projekt aktiv (weder Vitest noch Jest), daher wird pro Task via `npm run build` + manueller Verifikation im laufenden `npm run dev`-Server geprüft.

## Global Constraints

- Kein Schema-Change am `Note`-Typ (`src/types.ts`) — Markdown-Quelltext bleibt in denselben String-Feldern (`protocol`, `openPoints`, `nextSteps`).
- Kein `dangerouslySetInnerHTML` — Rendering ausschließlich über `react-markdown`.
- Externe Links im Preview: `target="_blank"` + `rel="noopener noreferrer"`.
- Preview-Modus ist reiner UI-State und wird **nicht** in Firestore persistiert.
- Betroffene Felder: nur `protocol`, `openPoints`, `nextSteps`. `title` und `participants` bleiben Plain-Text.
- Nur `.md`-Export für die aktive Notiz — kein Bulk, keine Toolbar, kein Split-View (YAGNI, siehe Spec).
- Styling nutzt bestehende Theme-CSS-Variablen (`var(--c-*)`) — keine neuen Farbwerte hardcoden.
- Code-Kommentare nur wenn das *Warum* nicht offensichtlich ist.

---

## Task 1: Dependencies installieren

**Files:**
- Modify: `package.json` (dependencies-Block)
- Generiert: `package-lock.json`, `node_modules/`

**Interfaces:**
- Consumes: nichts.
- Produces: die Module `react-markdown` und `remark-gfm` sind im Projekt importierbar.

- [ ] **Step 1: Aktuelle Dependencies prüfen**

Run: `cat package.json`
Expected: `dependencies` enthält `firebase`, `lucide-react`, `react`, `react-dom` — aber **kein** `react-markdown` und **kein** `remark-gfm`.

- [ ] **Step 2: Beide Deps installieren**

Run: `npm install react-markdown remark-gfm`

Expected: Beide Pakete werden hinzugefügt, keine Peer-Warnings die Build-blockend sind. `package.json` `dependencies` enthält jetzt `"react-markdown": "^…"` und `"remark-gfm": "^…"`.

- [ ] **Step 3: Build durchlaufen lassen**

Run: `npm run build`
Expected: `vite build` läuft ohne TypeScript- oder Bundling-Fehler durch, `dist/` wird geschrieben.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add react-markdown + remark-gfm dependencies"
```

---

## Task 2: Markdown-Utility `notesMarkdown.ts`

**Files:**
- Create: `src/utils/notesMarkdown.ts`

**Interfaces:**
- Consumes: `Note` und `Project` aus `src/types.ts` (bereits vorhanden).
- Produces:
  - `slugify(input: string): string`
  - `noteFilename(note: Note): string` — Format: `<slug>-<YYYY-MM-DD>.md`
  - `noteToMarkdown(note: Note, project: Project | undefined): string`
  - `downloadMarkdown(note: Note, project: Project | undefined): void` — der einzige unreine Wrapper (Blob + `<a>`-Click).

- [ ] **Step 1: Datei anlegen mit vollständiger Implementierung**

Create `src/utils/notesMarkdown.ts`:

```ts
import type { Note, Project } from "../types";

const UMLAUT_MAP: Record<string, string> = {
  ä: "ae", ö: "oe", ü: "ue", ß: "ss",
  Ä: "ae", Ö: "oe", Ü: "ue",
};

export const slugify = (input: string): string => {
  const replaced = input.replace(/[äöüßÄÖÜ]/g, (c) => UMLAUT_MAP[c] ?? c);
  const slug = replaced
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "notiz";
};

const toIsoDate = (deDate: string): string => {
  const parts = deDate.split(".");
  if (parts.length !== 3) return todayIso();
  const [d, m, y] = parts;
  if (!d || !m || !y) return todayIso();
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
};

const todayIso = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const noteFilename = (note: Note): string =>
  `${slugify(note.title)}-${toIsoDate(note.date)}.md`;

export const noteToMarkdown = (note: Note, project: Project | undefined): string => {
  const lines: string[] = [];
  lines.push(`# ${note.title || "Notiz"}`);
  lines.push("");

  const metaParts = [note.type];
  if (project?.name) metaParts.push(project.name);
  metaParts.push(note.date);
  lines.push(`_${metaParts.join(" · ")}_`);
  lines.push("");

  if (note.participants.trim()) {
    lines.push(`**Teilnehmer:innen:** ${note.participants.trim()}`);
    lines.push("");
  }

  const section = (heading: string, body: string) => {
    if (!body.trim()) return;
    lines.push(`## ${heading}`);
    lines.push("");
    lines.push(body.trim());
    lines.push("");
  };

  section("Protokoll", note.protocol);
  section("Offene Punkte", note.openPoints);
  section("Next Steps", note.nextSteps);

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
};

export const downloadMarkdown = (note: Note, project: Project | undefined): void => {
  const md = noteToMarkdown(note, project);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = noteFilename(note);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 2: Typecheck / Build laufen lassen**

Run: `npm run build`
Expected: kein TS-Fehler, `dist/` wird gebaut. (Das Modul wird noch nirgends importiert — TypeScript beklagt das nicht, weil es exportiert.)

- [ ] **Step 3: Utility im Browser händisch verifizieren**

Run: `npm run dev` (falls nicht schon offen) und lade die App.

Öffne die DevTools-Konsole und tippe (Beispiel-Notiz von Hand konstruieren geht in der Konsole nicht sauber ohne das Modul zu importieren) — daher lieber:

- Temporär in `src/AccessOrg.tsx` einen `useEffect` einbauen, der beim Mount `noteToMarkdown` und `noteFilename` mit einer Beispiel-Notiz aufruft und `console.log()`t? **Nein.** Wir sparen uns das und testen die Funktionen indirekt in Task 4, wenn der Export-Button live ist. Der Build-Check aus Step 2 reicht als Task-Deliverable.

Expected: keine zusätzliche Aktion — nur bestätigen, dass Step 2 grün war.

- [ ] **Step 4: Commit**

```bash
git add src/utils/notesMarkdown.ts
git commit -m "Add notes markdown export utilities"
```

---

## Task 3: Preview-Toggle + Markdown-Rendering im `NotesView`

**Files:**
- Modify: `src/views/NotesView.tsx` (kompletter Editor-Bereich)
- Modify: `src/views/NotesView.module.scss` (Toggle- und `.markdown`-Styles)

**Interfaces:**
- Consumes: `react-markdown`, `remark-gfm`, existierende `Note`/`Project`/`Task`-Typen.
- Produces: nichts extern — reine UI-Änderung. `NotesView`-Props bleiben unverändert.

- [ ] **Step 1: SCSS erweitern (Toggle + Markdown-Rendering)**

Öffne `src/views/NotesView.module.scss` und **hänge ans Ende** folgende neuen Regeln (die bestehenden `.editorTitle`/`.selectRow` etc. bleiben unverändert):

```scss
.titleRow {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
}

.titleRow .editorTitle { margin-bottom: 0; flex: 1; }

.modeToggle {
  display: inline-flex;
  border: 1px solid var(--c-border);
  border-radius: 7px;
  overflow: hidden;
  background: var(--c-card);
  flex-shrink: 0;
}

.modeToggleBtn {
  border: none;
  background: transparent;
  color: var(--c-slate);
  font-size: 12px;
  font-family: inherit;
  padding: 5px 10px;
  cursor: pointer;
}

.modeToggleBtnActive {
  background: var(--c-selected-bg);
  color: var(--c-ink);
}

.markdown {
  font-size: 13.5px;
  color: var(--c-ink);
  line-height: 1.55;
  padding: 10px 12px;
  border: 1px solid var(--c-border);
  border-radius: 7px;
  background: var(--c-card);
  margin-bottom: 14px;

  h1, h2, h3, h4 {
    margin: 0.8em 0 0.4em;
    color: var(--c-card-title);
    line-height: 1.2;
  }
  h1 { font-size: 1.35em; }
  h2 { font-size: 1.2em; }
  h3 { font-size: 1.08em; }
  p { margin: 0.4em 0; }
  ul, ol { margin: 0.4em 0; padding-left: 1.4em; }
  li { margin: 0.15em 0; }
  a { color: var(--c-focus); text-decoration: underline; }
  code {
    background: var(--c-selected-bg);
    padding: 0.05em 0.35em;
    border-radius: 3px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.92em;
  }
  pre {
    background: var(--c-selected-bg);
    padding: 8px 10px;
    border-radius: 5px;
    overflow-x: auto;
    margin: 0.5em 0;
  }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid var(--c-border);
    margin: 0.4em 0;
    padding: 0.1em 0.8em;
    color: var(--c-slate);
  }
  input[type="checkbox"] { margin-right: 4px; }
  table {
    border-collapse: collapse;
    margin: 0.4em 0;
  }
  th, td {
    border: 1px solid var(--c-border);
    padding: 4px 8px;
    text-align: left;
  }
}

.markdownEmpty {
  font-size: 13px;
  color: var(--c-slate);
  padding: 8px 12px;
  border: 1px dashed var(--c-border);
  border-radius: 7px;
  margin-bottom: 14px;
  font-style: italic;
}
```

- [ ] **Step 2: `NotesView.tsx` — Imports erweitern**

Öffne `src/views/NotesView.tsx` und **ersetze den Import-Block am Kopf** durch:

```tsx
import { useState } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { NoteTypeBadge, CompletedProjectPill } from "../components/Badges";
import { NoteTaskCreator } from "../components/NoteTaskCreator";
import { SLATE } from "../constants/colors";
import { projectLabel } from "../utils/projects";
import { cx } from "../utils/cx";
import type { Note, NoteType, Project, Task } from "../types";
import styles from "./NotesView.module.scss";
```

- [ ] **Step 3: `NotesView.tsx` — `MarkdownField`-Komponente einfügen**

Füge **direkt unterhalb** von `const NOTE_TYPES = …;` (also vor `export const NotesView`) diesen Komponenten-Block ein:

```tsx
const MARKDOWN_COMPONENTS = {
  a: ({ href, children, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>
  ),
};

const MarkdownField = ({ value, empty }: { value: string; empty: string }) => {
  if (!value.trim()) return <div className={styles.markdownEmpty}>{empty}</div>;
  return (
    <div className={styles.markdown}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
        {value}
      </ReactMarkdown>
    </div>
  );
};
```

Falls `React` als Type-only-Import gebraucht wird, ergänze im Import-Block oben `import type { AnchorHTMLAttributes } from "react";` und ersetze `React.AnchorHTMLAttributes<HTMLAnchorElement>` durch `AnchorHTMLAttributes<HTMLAnchorElement>`.

- [ ] **Step 4: `NotesView.tsx` — Modus-State ergänzen**

Ersetze diese Zeile im `NotesView`-Body:

```tsx
const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
```

durch:

```tsx
const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
const [noteModes, setNoteModes] = useState<Map<number, "edit" | "preview">>(new Map());

const currentMode = (id: number): "edit" | "preview" => noteModes.get(id) ?? "edit";
const setMode = (id: number, mode: "edit" | "preview") =>
  setNoteModes((prev) => {
    const next = new Map(prev);
    next.set(id, mode);
    return next;
  });
```

- [ ] **Step 5: `NotesView.tsx` — Editor-Titel-Zeile durch Toggle-Zeile ersetzen**

Suche im JSX diesen Block:

```tsx
<input
  value={current.title}
  onChange={(e) => updateCurrent("title", e.target.value)}
  className={styles.editorTitle}
/>
```

und ersetze ihn durch:

```tsx
<div className={styles.titleRow}>
  <input
    value={current.title}
    onChange={(e) => updateCurrent("title", e.target.value)}
    className={styles.editorTitle}
  />
  <div className={styles.modeToggle} role="tablist" aria-label="Ansichtsmodus">
    <button
      type="button"
      role="tab"
      aria-selected={currentMode(current.id) === "edit"}
      onClick={() => setMode(current.id, "edit")}
      className={cx(
        styles.modeToggleBtn,
        currentMode(current.id) === "edit" && styles.modeToggleBtnActive,
      )}
    >
      Bearbeiten
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={currentMode(current.id) === "preview"}
      onClick={() => setMode(current.id, "preview")}
      className={cx(
        styles.modeToggleBtn,
        currentMode(current.id) === "preview" && styles.modeToggleBtnActive,
      )}
    >
      Vorschau
    </button>
  </div>
</div>
```

- [ ] **Step 6: `NotesView.tsx` — Drei Textareas conditional rendern**

Suche im JSX diese drei Blöcke (Protokoll / Offene Punkte / Next Steps) und ersetze **jeden** Textarea-Aufruf durch eine Conditional-Version.

**Ersetzen:**

```tsx
<div className={styles.label}>Protokoll</div>
<textarea
  value={current.protocol}
  onChange={(e) => updateCurrent("protocol", e.target.value)}
  placeholder="Was wurde besprochen…"
  className={cx(styles.textarea, styles.textareaProtocol)}
/>
```

**durch:**

```tsx
<div className={styles.label}>Protokoll</div>
{currentMode(current.id) === "edit" ? (
  <textarea
    value={current.protocol}
    onChange={(e) => updateCurrent("protocol", e.target.value)}
    placeholder="Was wurde besprochen…"
    className={cx(styles.textarea, styles.textareaProtocol)}
  />
) : (
  <MarkdownField value={current.protocol} empty="Keine Einträge." />
)}
```

**Ersetzen:**

```tsx
<div className={styles.label}>Offene Punkte</div>
<textarea
  value={current.openPoints}
  onChange={(e) => updateCurrent("openPoints", e.target.value)}
  placeholder="Was noch geklärt werden muss…"
  className={cx(styles.textarea, styles.textareaOpen)}
/>
```

**durch:**

```tsx
<div className={styles.label}>Offene Punkte</div>
{currentMode(current.id) === "edit" ? (
  <textarea
    value={current.openPoints}
    onChange={(e) => updateCurrent("openPoints", e.target.value)}
    placeholder="Was noch geklärt werden muss…"
    className={cx(styles.textarea, styles.textareaOpen)}
  />
) : (
  <MarkdownField value={current.openPoints} empty="Keine offenen Punkte." />
)}
```

**Ersetzen:**

```tsx
<div className={styles.label}>Next Steps</div>
<textarea
  value={current.nextSteps}
  onChange={(e) => updateCurrent("nextSteps", e.target.value)}
  placeholder="Was als Nächstes ansteht…"
  className={cx(styles.textarea, styles.textareaNext)}
/>
```

**durch:**

```tsx
<div className={styles.label}>Next Steps</div>
{currentMode(current.id) === "edit" ? (
  <textarea
    value={current.nextSteps}
    onChange={(e) => updateCurrent("nextSteps", e.target.value)}
    placeholder="Was als Nächstes ansteht…"
    className={cx(styles.textarea, styles.textareaNext)}
  />
) : (
  <MarkdownField value={current.nextSteps} empty="Keine Next Steps." />
)}
```

- [ ] **Step 7: Build durchlaufen lassen**

Run: `npm run build`
Expected: keine TS-Fehler.

- [ ] **Step 8: Manuell verifizieren**

Run: `npm run dev` und öffne die Notizen-View.

Prüfen:
1. Neben dem Titel-Input sitzt ein Toggle mit `Bearbeiten` (aktiv) und `Vorschau`.
2. In eines der Textfelder folgendes tippen:
   ```
   ## Ergebnisse
   - Bug im Modal gefixt
   - **TODO:** Doku
   - [ ] Follow-up mit Kunde
   - [x] Screenshot geschickt
   
   Link: <https://sipgate.de>
   ```
3. Auf `Vorschau` klicken → alle drei Freitext-Felder sind gerendert, Task-Listen haben Checkboxen, Link öffnet in neuem Tab.
4. Ein leeres Feld zeigt gestrichelte Placeholder-Box mit „Keine Einträge." / „Keine offenen Punkte." / „Keine Next Steps.".
5. Zurück auf `Bearbeiten` → Text unverändert im Textarea.
6. Notiz A auf `Vorschau`, in der Liste Notiz B auswählen → B ist in `Bearbeiten`. Zurück zu A → A ist wieder in `Vorschau`.
7. Light-Mode und Dark-Mode wechseln → Preview bleibt lesbar, Kontraste ok.

- [ ] **Step 9: Commit**

```bash
git add src/views/NotesView.tsx src/views/NotesView.module.scss
git commit -m "Add markdown preview toggle to notes editor"
```

---

## Task 4: Export-Button

**Files:**
- Modify: `src/views/NotesView.tsx` (Editor-Footer)
- Modify: `src/views/NotesView.module.scss` (Button-Style)

**Interfaces:**
- Consumes: `downloadMarkdown` aus `src/utils/notesMarkdown.ts` (Task 2).
- Produces: nichts extern.

- [ ] **Step 1: SCSS — Export-Button-Style ergänzen**

Öffne `src/views/NotesView.module.scss` und **hänge ans Ende** an:

```scss
.deleteSection {
  justify-content: space-between;
}

.btnExport {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 12.5px;
  color: var(--c-ink);
  cursor: pointer;
  font-family: inherit;
}

.btnExport:hover {
  background: var(--c-selected-bg);
}
```

(Der erste Regel-Block **überschreibt** absichtlich das `justify-content: flex-end` der bestehenden `.deleteSection`, damit Export-Button links und Delete-Bereich rechts stehen.)

- [ ] **Step 2: `NotesView.tsx` — Imports ergänzen**

Erweitere den `lucide-react`-Import:

```tsx
import { Search, Plus, Trash2, Download } from "lucide-react";
```

und füge einen Import für die Utility hinzu (nach dem `projectLabel`-Import):

```tsx
import { downloadMarkdown } from "../utils/notesMarkdown";
```

- [ ] **Step 3: `NotesView.tsx` — Export-Handler + Button einbauen**

Suche im JSX den Delete-Section-Block:

```tsx
<div className={styles.deleteSection}>
  {confirmDeleteId === current.id ? (
    …
  ) : (
    <button
      onClick={() => setConfirmDeleteId(current.id)}
      className={styles.btnDelete}
    >
      <Trash2 size={13} /> Notiz löschen
    </button>
  )}
</div>
```

und ersetze ihn durch:

```tsx
<div className={styles.deleteSection}>
  <button
    onClick={() => downloadMarkdown(current, projects.find((p) => p.id === current.project))}
    className={styles.btnExport}
    title="Diese Notiz als Markdown-Datei herunterladen"
  >
    <Download size={13} /> Als Markdown exportieren
  </button>
  {confirmDeleteId === current.id ? (
    <div className={styles.confirmRow}>
      <span className={styles.confirmText}>Notiz wirklich löschen?</span>
      <button onClick={() => deleteNote(current.id)} className={styles.btnConfirmDelete}>
        Ja, löschen
      </button>
      <button onClick={() => setConfirmDeleteId(null)} className={styles.btnCancel}>
        Abbrechen
      </button>
    </div>
  ) : (
    <button
      onClick={() => setConfirmDeleteId(current.id)}
      className={styles.btnDelete}
    >
      <Trash2 size={13} /> Notiz löschen
    </button>
  )}
</div>
```

- [ ] **Step 4: Build durchlaufen lassen**

Run: `npm run build`
Expected: keine TS-Fehler.

- [ ] **Step 5: Manuell verifizieren**

Run: `npm run dev` und öffne die Notizen-View.

Prüfen:
1. Im Editor-Footer steht links der Button `⤓ Als Markdown exportieren`, rechts der bekannte Delete-Bereich.
2. Notiz mit gefülltem Titel, Protokoll, Offenen Punkten und Next Steps öffnen → Klick auf Export → Datei `<slug>-YYYY-MM-DD.md` wird heruntergeladen. Inhalt enthält `# Titel`, Meta-Zeile, `**Teilnehmer:innen:**`, `## Protokoll`, `## Offene Punkte`, `## Next Steps`.
3. Notiz mit leerem `openPoints` exportieren → `## Offene Punkte` fehlt komplett in der Datei, aber `## Protokoll` und `## Next Steps` sind da.
4. Notiz mit Umlauten im Titel („Klärungs-Termin ÜÖÄß") exportieren → Dateiname beginnt mit `klaerungs-termin-ueoeaess-`.
5. Notiz mit leerem `participants` → in Datei fehlt die `**Teilnehmer:innen:**`-Zeile.
6. Notiz mit gelöschtem Projekt (falls testbar): Meta-Zeile enthält nur `Typ · Datum`.

- [ ] **Step 6: Commit**

```bash
git add src/views/NotesView.tsx src/views/NotesView.module.scss
git commit -m "Add markdown export button to notes editor"
```

---

## Abschluss-Check

Nach Task 4 gegen die Spec-Testliste laufen (Spec § Testing, Punkte 1–8):

1. Markdown eintippen → Preview → korrekt gerendert. **(Task 3, Step 8.2/3)**
2. Zurück → Text unverändert. **(Task 3, Step 8.5)**
3. Mode pro Notiz gemerkt. **(Task 3, Step 8.6)**
4. Export enthält alle gefüllten Sektionen. **(Task 4, Step 5.2)**
5. Leere Sektion fällt weg. **(Task 4, Step 5.3)**
6. Umlaut-Slug korrekt. **(Task 4, Step 5.4)**
7. Externer Link → neuer Tab. **(Task 3, Step 8.3)**
8. Light + Dark: lesbar. **(Task 3, Step 8.7)**

Wenn alle Punkte grün sind, ist das Feature komplett.
