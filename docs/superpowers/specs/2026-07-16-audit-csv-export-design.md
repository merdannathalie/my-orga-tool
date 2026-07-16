# Audit-Tracker: VPAT-konformes Datenmodell & CSV-Export

## Ziel

Der WCAG-2.2-Audit-Tracker soll professionelle Audit-Reports als CSV
exportieren, in einer Struktur die zu VPAT/ACR (dem De-facto-Standard für
B2B-Accessibility-Reporting) und WCAG-EM (W3C-Methodik) kompatibel ist.
Dafür wird das interne Datenmodell moderat erweitert (fünfte
Konformitäts-Stufe, echter Severity-Grad statt boolean, Empfehlungs-Feld)
und ein Export-Button im Tracker liefert ein Excel-freundliches CSV pro
Projekt.

## Recherche-Grundlage (Kurzfassung)

- **VPAT/ACR** (ITI) verwendet die fünf Verdicts *Supports · Partially
  Supports · Does Not Support · Not Applicable · Not Evaluated* und die
  Kernspalten *Criteria · Conformance · Remarks*.
- **WCAG-EM** ergänzt Outcome-Kategorien und Notes; Severity/Priority ist
  in keinem der beiden Standards festgelegt.
- **Deque axe** hat die Skala *Critical · Serious · Moderate · Minor*
  etabliert; das ist der pragmatische De-facto-Severity-Standard.
- **DACH-Kontext** — Reports werden typischerweise Deutsch geschrieben;
  die App bleibt bei ihrer bestehenden deutschen Terminologie im UI und
  im CSV.

Diese Spec ist die Grundlage für eine spätere PDF/Word-Ausgabe
(z. B. VPAT-Template) — die Feldstruktur ist bereits darauf zugeschnitten,
ohne dass VPAT-Report im Scope dieser Iteration ist.

## Scope

**In:**
- Datenmodell-Erweiterung (`AuditStatus`, neuer `Severity`-Typ, `AuditItem`
  bekommt `severity` und `recommendation`, `critical` verschwindet).
- Migration alter Firestore-Daten beim Laden (keine explizite Migration-
  Batch; runtime-Migration).
- UI-Anpassung `AuditItemModal` (Read + Edit-Modus).
- UI-Anpassung `AuditTracker` (Zähl-Meta, Item-Zeile, Export-Button).
- Utility `src/utils/auditCsv.ts` + Download-Wrapper.
- `constants/wcag.ts` — `AUDIT_STATUSES` erweitert, neuer `SEVERITIES`-
  Katalog inkl. Labels.

**Nicht im Scope (YAGNI):**
- VPAT/ACR-PDF-Export.
- Mehrsprachigkeit (Deutsch bleibt fix, englische Label-Aliase liegen
  außerhalb).
- Neue Filter im Tracker (z. B. nach Severity). Wenn nötig, in Follow-up.
- Bulk-Export mehrerer Projekte.
- Historisierung / Zeitstempel pro Audit-Item.

## Datenmodell

### `src/types.ts`

```ts
export type AuditStatus =
  | "wird geprüft"
  | "nicht anwendbar"
  | "nicht erfüllt"
  | "teilweise erfüllt"   // NEU (Partially Supports)
  | "erfüllt";

export type Severity = "kritisch" | "schwerwiegend" | "moderat" | "gering";

export type AuditItem = {
  id: string;
  project: number;
  code: string;
  name: string;
  level: "A" | "AA";
  principle: Principle;
  guideline: string;
  status: AuditStatus;
  severity: Severity | null;    // ERSETZT critical: boolean
  note: string;
  codeExample: string;
  recommendation: string;       // NEU
};

export type AuditOverride = Partial<
  Omit<AuditItem, "id" | "project" | "code" | "name" | "level" | "principle" | "guideline">
>;
```

### Migration bestehender Firestore-Daten

Beim initialen `loadAll<AuditItem>(uid, "audit")` in `AccessOrg.tsx`
wird jedes geladene Item durch eine reine Funktion
`migrateAuditItem(raw: unknown): AuditItem` gerouted:

- Ist `severity` bereits gesetzt → durchreichen.
- Ist `severity` nicht gesetzt, aber `critical === true` →
  `severity = "kritisch"`.
- Ist `severity` nicht gesetzt, `critical` fehlt oder `=== false` →
  `severity = null`.
- `recommendation` fehlt → `""`.
- Ein evtl. verbliebenes `critical`-Feld wird bei der Rückgabe entfernt
  (das Objekt wird per Destructuring neu zusammengesetzt).

Der nächste Save überschreibt die Firestore-Docs mit dem neuen Shape.
Kein Firestore-Migrationsscript nötig.

### `src/utils/audit.ts`

- `makeAudit` erzeugt neue Items mit `severity: null`, `recommendation: ""`
  und ohne `critical`.
- Neue Utility `severityColor(s: Severity | null): string` liefert die
  Pill-Farbe (Fail für kritisch, Amber für schwerwiegend, Slate für
  moderat, Slate-abgedimmt für gering, transparent/leer für `null`).
- Neue Utility `severityLabel(s: Severity | null): string` liefert das
  Anzeigelabel (`"Kritisch"`, `"Schwerwiegend"`, `"Moderat"`,
  `"Gering"`, `""`).

## UI-Änderungen

### `src/constants/wcag.ts`

- `AUDIT_STATUSES` → 5 Werte, Reihenfolge: `"wird geprüft"`,
  `"erfüllt"`, `"teilweise erfüllt"`, `"nicht erfüllt"`, `"nicht anwendbar"`.
- Neu: `SEVERITIES: Severity[] = ["kritisch", "schwerwiegend", "moderat", "gering"]`.
- `SEVERITY_LABEL: Record<Severity, string>` mit deutschen Anzeigenamen.

### `src/components/AuditItemModal.tsx`

**Read-Modus** (`!editing`):
- Statt `{item.critical && <Pill color={FAIL}>kritisch</Pill>}` →
  `{item.severity && <Pill color={severityColor(item.severity)}>{severityLabel(item.severity)}</Pill>}`.
- Nach dem Beispielcode-Block: wenn `item.recommendation`, ein Feld
  „Empfehlung" mit dem Text (`<p>`, kein `<pre>`, weil das Text ist, nicht
  Code).

**Edit-Modus:**
- `editRow`: statt `<Checkbox … kritisch>` ein `<select>` mit den vier
  Severity-Optionen plus einer Leer-Option (`value=""` → `severity: null`).
- Nach dem Beispielcode-Textarea ein neues `<textarea>` „Empfehlung"
  gebunden an `draft.recommendation`.

### `src/views/AuditTracker.tsx`

- Zähl-Meta (`criticalOpen`) → `severityOpen`, zählt Items mit
  `(severity === "kritisch" || severity === "schwerwiegend") && status !== "erfüllt"`.
  Anzeige: `… · N schwer offen`.
- Item-Zeile: statt `{a.critical && a.status !== "erfüllt" && <Pill … />}`
  → wenn `a.severity` gesetzt und Status nicht erfüllt: Severity-Pill mit
  Farbe und Label. Falls Status erfüllt: keine Pill (das Kriterium ist
  gelöst — Severity irrelevant fürs Board).
- **Neuer Export-Button:** oben im Projekt-Header, rechts neben
  `{projectMeta}`, sichtbar nur wenn `items.length > 0`. Icon
  `Download` (lucide), Label „CSV-Export". Klick ruft `downloadAuditCsv`
  mit den gefilterten Projekt-Items und dem Projekt-Objekt auf.
- Der Button darf nicht das Aufklappen des Projekt-Headers triggern
  (`e.stopPropagation()`).

## CSV-Export

### `src/utils/auditCsv.ts`

Vier Exports:

```ts
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

export const auditToCsvRow = (item: AuditItem): string[] => [...]
export const auditToCsv = (items: AuditItem[]): string
export const csvFilename = (project: Project): string
export const downloadAuditCsv = (items: AuditItem[], project: Project): void
```

**Sortierung.** Items werden vor der Ausgabe nach ihrer Reihenfolge im
`WCAG_TEMPLATE` sortiert (`WCAG_TEMPLATE.findIndex(c => c.code === item.code)`).
Damit steht 1.2.10 nach 1.2.9 statt vor 1.2.2 — natürliche WCAG-Reihenfolge.

**Zeilen-Mapping** (in Spalten-Reihenfolge):

| Header | Wert | Bemerkung |
|---|---|---|
| Nr. | `item.code` | z. B. „1.4.3" |
| Kriterium | `item.name` | Englischer WCAG-Originalname (wie im Katalog) |
| Prinzip | `item.principle` | Wahrnehmbar / Bedienbar / … |
| Konformitätsstufe | `item.level` | „A" oder „AA" |
| Richtlinie | `item.guideline` | z. B. „1.4 Unterscheidbar" |
| Bewertung | `item.status` | Einer der 5 deutschen AuditStatus-Werte, unverändert |
| Schweregrad | `severityLabel(item.severity)` oder `""` | „Kritisch" / „Schwerwiegend" / „Moderat" / „Gering" / „" |
| Anmerkung | `item.note` | frei |
| Beispiel/Nachweis | `item.codeExample` | frei |
| Empfehlung | `item.recommendation` | frei |

**Format (RFC 4180 + Excel-DACH-Kompatibilität):**

- Trennzeichen: `;` (Standardvorbelegung von deutschen Excel-Versionen).
- Encoding: **UTF-8 mit BOM** (`﻿` als erstes Zeichen), sonst
  interpretiert Excel Umlaute als Latin-1-Müll.
- Zeilenende: `\r\n`.
- Zell-Escaping: enthält eine Zelle `;`, `"` oder `\r`/`\n`, wird sie in
  doppelte Anführungszeichen gesetzt; enthaltene `"` werden zu `""`
  verdoppelt.
- Erste Zeile: Spalten-Header (siehe oben). Keine Meta-Zeile darüber —
  Meta wandert in den Dateinamen.

**Dateiname.** `<projekt-slug>-wcag-audit-<YYYY-MM-DD>.csv`.
Der Slug wird mit derselben `slugify`-Logik gebaut wie in
`notesMarkdown.ts` — daher soll die Slug-Funktion in eine gemeinsame
Utility gezogen werden (`src/utils/slug.ts`) und beide Consumer
importieren daraus. Kleiner Refactor, aber DRY.

**Download-Mechanismus.** Blob + `<a download>` + `URL.createObjectURL`
+ `URL.revokeObjectURL`, analog zu `downloadMarkdown`. `type` ist
`text/csv;charset=utf-8`.

## Fehlerpfade

- Klick auf CSV-Export mit 0 Items: der Button wird nur gerendert, wenn
  `items.length > 0`. Kein Handling nötig.
- Bestehende Notizen-Migration kollidiert mit dieser hier nicht — die
  Notes-Feature hat ihr eigenes Schema.
- `severity` in einem alten Firestore-Doc als String ungleich der
  erlaubten Werte: fällt bei `migrateAuditItem` durch → `null`. Whitelist-
  Check statt Blindverwendung.

## Testing (manuell — kein Test-Framework aktiv)

1. Bestehendes Projekt mit gestartetem Audit öffnen → keine Fehler in
   Konsole, alle Items sichtbar, alte „kritisch"-Markierungen erscheinen
   jetzt als „Kritisch"-Pill.
2. Ein Item bearbeiten → Severity-Dropdown zeigt korrekt vorbelegten
   Wert. Empfehlung-Feld ist leer. Beides speichern, in Firestore-Konsole
   prüfen: `severity` gesetzt, `recommendation` gespeichert.
3. Neues Projekt mit Audit starten → alle Items haben `severity: null`,
   `recommendation: ""`.
4. Status „teilweise erfüllt" auswählen → speicherbar, in der
   Tracker-Liste als Status angezeigt, in der CSV korrekt.
5. Item mit `severity=kritisch, status=nicht erfüllt` → in der
   Projekt-Meta erscheint „X schwer offen"; in der Item-Zeile das
   „Kritisch"-Pill.
6. Item mit `severity=kritisch, status=erfüllt` → in der Zeile keine
   Severity-Pill (weil gelöst); zählt nicht bei „schwer offen".
7. CSV-Export klicken → Datei wird heruntergeladen. In Excel öffnen:
   Header + Spalten korrekt, Umlaute lesbar, Zeilen nach WCAG-Nummer
   sortiert, `;` als Trenner.
8. Item mit Kommas/Semikolons/Zeilenumbrüchen/Anführungszeichen in Notiz
   → im CSV korrekt gequotet.
9. Klick auf CSV-Button darf den Projekt-Header nicht auf-/zuklappen.

## Offene Punkte

Keine.
