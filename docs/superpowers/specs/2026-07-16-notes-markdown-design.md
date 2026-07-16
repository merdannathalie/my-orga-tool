# Notizen: Markdown-Formatierung & Markdown-Export

## Ziel

Notizen im `NotesView` sollen mit Markdown formatiert werden können und als
`.md`-Datei exportierbar sein. Der Nutzer schreibt Markdown direkt in die
Textfelder, kann per Toggle in eine gerenderte Vorschau wechseln und die
aktuelle Notiz einzeln als `.md`-Datei herunterladen.

## Scope

- Betroffene View: `src/views/NotesView.tsx`.
- Betroffene Felder in `Note`: `protocol`, `openPoints`, `nextSteps` (Freitext,
  mehrzeilig). `title` und `participants` bleiben Plain-Text.
- Kein Schema-Change am `Note`-Typ — Markdown-Quelltext wird in denselben
  String-Feldern wie heute persistiert.

Explizit **nicht** im Scope:
- Bulk-Export (alle Notizen auf einmal).
- Toolbar oder Tastatur-Shortcuts (`Cmd+B` etc.).
- Split-View (Editor links, Preview rechts).
- Markdown-Rendering an anderen Stellen der App (Projekte, Tasks, Audit-Notes).

## Feature 1 — Markdown-Vorschau

**UI.** Neben dem Titel-Input (rechts) sitzt ein Segment-Toggle mit zwei
Zuständen: `Bearbeiten` (Default) und `Vorschau`. Der Toggle-State ist
UI-lokaler State im `NotesView` (`useState<"edit" | "preview">`), pro Notiz
gemerkt via `Map<noteId, mode>` — beim Wechsel der aktiven Notiz bleibt der
zuletzt gewählte Modus dieser Notiz erhalten, neue Notizen starten in
`edit`. Der Modus wird nicht in Firestore persistiert.

**Verhalten im Preview-Modus.**
- `protocol`, `openPoints`, `nextSteps` werden als gerendertes Markdown
  dargestellt (statt `<textarea>`).
- Die Feld-Labels („Protokoll", „Offene Punkte", „Next Steps") bleiben
  stehen.
- Leere Felder zeigen einen dezenten Placeholder („_Keine Einträge._"),
  keine leeren Boxen.
- Titel, Meta-Zeile, Teilnehmer:innen und die „Aufgabe aus Notiz
  erstellen"-Sektion bleiben unverändert bedienbar.

**Rendering-Lib.** `react-markdown` + `remark-gfm`.
- Grund: React-native (JSX-Output, kein `dangerouslySetInnerHTML`),
  sanitiert per Default, GFM (Task-Listen, Tables, Strikethrough).
- Bundle-Impact: ~40 KB gzipped inkl. `remark-gfm`. Vertretbar, da nur beim
  Öffnen der Notes-View geladen werden muss (kann später per `React.lazy`
  code-split werden, wenn nötig — im ersten Schritt nicht).
- Erlaubte Syntax: alles, was `react-markdown` + `remark-gfm` von Haus aus
  unterstützt. Keine Custom-Renderer außer Sicherheits-Overrides für Links
  (siehe unten).

**Sicherheit.**
- `react-markdown` erlaubt kein rohes HTML per Default → keine
  Sanitize-Lib nötig.
- Links (`<a>`) bekommen `target="_blank"` + `rel="noopener noreferrer"`
  via `components`-Override.
- Bilder werden nicht speziell behandelt (Markdown erlaubt `![alt](url)` —
  Bild lädt normal, `react-markdown` blockt kein `img`). Für dieses
  Single-User-Tool akzeptabel.

**Styling.** Ein neuer `.markdown`-Bereich in `NotesView.module.scss`
setzt Abstände, Listen-Bullets, Code-Blöcke, Blockquotes so, dass sie zur
App-Typografie passen. Farben kommen aus den Theme-CSS-Variablen (bereits
im Projekt vorhanden), damit Light/Dark-Mode automatisch funktioniert.

## Feature 2 — Markdown-Export

**UI.** Im Editor-Footer (bei der Delete-Sektion) ein Sekundär-Button:
`Als Markdown exportieren` mit `Download`-Icon aus `lucide-react`. Klick
startet den Download der aktiven Notiz.

**Dateiformat.**

```md
# {title}

_{type} · {project.name} · {date}_

**Teilnehmer:innen:** {participants}

## Protokoll

{protocol}

## Offene Punkte

{openPoints}

## Next Steps

{nextSteps}
```

- Titel-Zeile immer vorhanden.
- Meta-Zeile immer vorhanden (falls Projekt nicht auffindbar: nur `type ·
  date`).
- Teilnehmer:innen-Zeile nur wenn `participants.trim() !== ""`.
- Jede der drei Text-Sektionen nur wenn das Feld nicht leer ist. Leere
  Sektionen werden komplett (inkl. Überschrift) weggelassen.

**Dateiname.** `<slug(title)>-<date-iso>.md`.
- `slug`: Kleinbuchstaben, `äöüß` → `ae/oe/ue/ss`, alle Nicht-`[a-z0-9]`
  → `-`, Mehrfach-`-` kollabiert, führende/trailing `-` gestrippt.
  Fallback bei leerem Slug: `"notiz"`.
- `date-iso`: `note.date` (`"DD.MM.YYYY"`) → `"YYYY-MM-DD"`. Falls
  parse-fail: heutiges Datum.
- Beispiel: `sipgate-audit-kickoff-2026-07-14.md`.

**Download-Mechanismus.** Klassisch via `Blob` + temporärem
`<a href="blob:…" download="…">`:

```ts
const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = filename;
a.click();
URL.revokeObjectURL(url);
```

Keine externe Lib nötig.

## Architektur & Dateien

Neue Dateien:
- `src/utils/notesMarkdown.ts` — reine Funktionen:
  - `noteToMarkdown(note: Note, project: Project | undefined): string`
  - `slugify(input: string): string`
  - `noteFilename(note: Note): string`
  - `downloadMarkdown(note: Note, project: Project | undefined): void`
    (der einzige unreine Wrapper — trennt Blob-Download vom Rest, damit
    die Formatier-Funktionen testbar bleiben).

Angepasste Dateien:
- `src/views/NotesView.tsx`:
  - Preview-Mode-State + Toggle-UI.
  - Bedingtes Rendern von `<textarea>` vs. `<MarkdownField>` je nach
    Modus.
  - Export-Button in der Editor-Sektion.
- `src/views/NotesView.module.scss`:
  - Styles für Toggle, für `.markdown`-Container (Headings, Listen,
    Code, Blockquotes, Links, Task-Listen).
  - Style für Export-Button (Sekundär-Variante).

Neue Komponente (klein, inline in `NotesView.tsx` möglich oder ausgelagert
je nach Größe):
- `MarkdownField({ value, empty }: { value: string; empty: string })` —
  wrapt `react-markdown` mit den Link-Overrides und rendert den
  Placeholder bei leerem Wert.

Neue Dependencies (`package.json`):
- `react-markdown`
- `remark-gfm`

## Fehlerpfade

- **Leere Notiz exportieren.** Titel-Fallback bleibt `"notiz"`, Datei
  enthält nur Titel + Meta-Zeile. Kein Blocker, kein Fehler.
- **Notiz ohne gültiges Projekt** (`project` verweist auf gelöschte
  Projekt-ID). Meta-Zeile lässt Projekt-Teil weg (`"{type} · {date}"`).
- **Markdown-Rendering-Crash** (theoretisch bei kaputtem Input).
  `react-markdown` fängt das im Regelfall selbst ab und rendert Text —
  keine explizite ErrorBoundary nötig für ein Personal-Tool.

## Testing

Manueller Test-Plan (kein Test-Framework im Projekt aktiv):
1. Neue Notiz anlegen, Markdown eintippen (Heading, Liste, Task-Liste,
   fett, kursiv, Code-Block, Link), auf Preview umschalten → gerendert
   korrekt.
2. Zurück auf Bearbeiten → Text unverändert.
3. Notiz A auf Preview, dann Notiz B öffnen (bleibt in Edit), dann zurück
   auf A → A ist noch in Preview.
4. Notiz exportieren → Datei enthält alle gefüllten Sektionen, keine
   leeren.
5. Notiz mit leerem `openPoints` exportieren → Sektion fehlt komplett.
6. Notiz mit Umlauten im Titel („Klärungs-Termin ÜÖÄß") exportieren →
   Dateiname `klaerungs-termin-ueoeaess-YYYY-MM-DD.md`.
7. Preview enthält einen externen Link → Klick öffnet neuen Tab
   (`target=_blank`).
8. Light + Dark-Mode: Preview lesbar, Kontraste ok.

## Offene Punkte

Keine.
