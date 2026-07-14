# Accessible/Org

Ein persönliches Organisations-Tool für Accessibility-Consulting: Projekte,
WCAG-2.2-Audit-Tracker, Aufgaben, Notizen, Meeting-Protokolle, Ressourcen und
Weiterbildung — alles auf einer Oberfläche, mit Light/Dark-Mode und
Firestore-Sync.

## Features

- **Home-Dashboard** — Begrüßung, Dankbarkeits-/Tagesnotizen, Meeting-Kalender
  (3 Tage) und To-do-Board.
- **Projekte** — pro Mandat mit Beschreibung, Deadline und Abschluss-/
  Löschworkflow.
- **Audit-Tracker** — vollständiger WCAG-2.2-A/AA-Kriterienkatalog pro Projekt,
  gegliedert nach den 4 Prinzipien, mit Status, kritischer Markierung, Notiz
  und Beispielcode je Kriterium.
- **Aufgaben** — Kanban-Board auf der Startseite plus sortierbare Listenansicht
  (nach Priorität oder Deadline).
- **Notizen & Meeting-Protokolle** — pro Notiz-Typ (Kunden-Call, Intern,
  Kick-off, Review), mit direkter „Aufgabe aus dieser Notiz erstellen"-Aktion.
- **Ressourcen** & **Weiterbildung** — kuratierte Linksammlung bzw. Kanban für
  Lernmaterial.
- **Firestore-Sync** — kompletter App-Zustand wird debounced automatisch in
  `users/{uid}/app/state` gespeichert; Sync-Status ist in der Sidebar sichtbar.

## Tech-Stack

- **React 18** + **TypeScript** (strict)
- **Vite** als Build-Tool
- **SCSS Modules** (per-Komponente `.module.scss`) + globale Theme-CSS-Variablen
- **Firebase** — Authentication (E-Mail/Passwort) + Firestore + Hosting
- **Lucide** für Icons, **Atkinson Hyperlegible** als Schrift

## Projektstruktur

```
src/
├── App.tsx              # Auth-Wrapper
├── AccessOrg.tsx        # Shell + Sidebar + Tab-Router
├── main.tsx, firebase.ts, types.ts
├── styles/              # index.scss + Theme-Variablen, Layout, Mixins
├── constants/           # Farb-Tokens, Nav, WCAG-Katalog, Seed-Daten
├── utils/               # Dates, Audit-Helper, Sortierer, cx-Helper
├── components/          # Wiederverwendbare Komponenten (Modals, Panels,
│                        #   Badges) — je .tsx + .module.scss
└── views/               # Tab-Views (Dashboard, Projects, Notes, Audit, …)
                         #   je .tsx + .module.scss
```

## Lokal starten

```bash
npm install
npm run dev
```

Öffnet die App unter http://localhost:5173. Für den ersten Login: einen Nutzer
im Firebase-Auth-Panel anlegen (siehe unten).

## Firebase-Setup (einmalig)

Nötig, wenn du das Projekt für dich klonst — die aktuelle `src/firebase.ts`
zeigt auf das Projekt `my-orga-tool` und wird dich sonst nicht durchlassen.

1. **Firebase-Projekt anlegen** unter <https://console.firebase.google.com>.
2. **Firestore** aktivieren (Build → Firestore Database → Produktionsmodus, Region
   `eur3`). Die Zugriffsregeln liegen in `firestore.rules`.
3. **Authentication** aktivieren (Build → Authentication → E-Mail/Passwort) und
   unter „Nutzer" deinen Account anlegen.
4. **Web-App registrieren** (Projekteinstellungen → Web-Icon `</>`), die
   `firebaseConfig`-Werte in `src/firebase.ts` einsetzen.
5. **Firebase CLI** installieren und einloggen:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
6. In `.firebaserc` deine Projekt-ID eintragen.
7. Regeln deployen:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Bauen & deployen

```bash
npm run build
firebase deploy --only hosting
```

## Daten-Modell

Kompletter App-Zustand (Projekte, Tasks, Notizen, Audit, Ressourcen, Learning,
Meetings, Gratitude/Tagesnotizen, Theme) liegt in **einem** Firestore-Dokument:
`users/{uid}/app/state`. Das reicht für eine Einzelperson locker (Firestore
erlaubt bis 1 MB pro Dokument) und hält das Setup einfach. Änderungen werden
mit 800 ms Debounce gespeichert, damit nicht jeder Tastenanschlag einen Write
auslöst.
