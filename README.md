# Accessible/Org – Firebase-Setup

Dieses Projekt speichert alle deine Daten (Projekte, Aufgaben, Notizen, Audit-Ergebnisse,
Ressourcen, Weiterbildung, Meetings, Home-Panel) in **Firestore** und wird über
**Firebase Hosting** ausgeliefert. Zugriff gibt es nur nach Login mit deiner
E-Mail/Passwort-Kombination (Firebase Authentication) – nicht mehr über ein einfaches
Passwortfeld, weil eine reine Client-Passwortabfrage die Firestore-Daten nicht wirklich
schützen würde (die Firebase-Konfiguration landet ohnehin im öffentlichen JS-Bundle;
der eigentliche Schutz kommt über die Security Rules + echten Login).

## 1. Firebase-Projekt anlegen

1. Auf https://console.firebase.google.com auf **"Projekt hinzufügen"** klicken.
2. Namen vergeben (z. B. `accessible-org`), Google Analytics kannst du deaktivieren.

## 2. Firestore aktivieren

1. Im Projekt links auf **Build → Firestore Database**.
2. **"Datenbank erstellen"**, Modus **"Produktionsmodus"** wählen (die Regeln in
   `firestore.rules` übernehmen die Absicherung).
3. Region wählen (z. B. `eur3 (europe-west)`).

## 3. Authentication aktivieren

1. Links auf **Build → Authentication → "Los geht's"**.
2. Anbieter **"E-Mail/Passwort"** aktivieren.
3. Unter dem Tab **"Nutzer"** einen einzelnen Nutzer für dich selbst anlegen
   (deine E-Mail + ein Passwort deiner Wahl). Das ist der einzige Account, der
   sich einloggen kann.

## 4. Web-App registrieren & Config holen

1. Projektübersicht → Zahnrad-Icon → **Projekteinstellungen**.
2. Unter "Meine Apps" auf das **Web-Icon (`</>`)** klicken, App registrieren
   (Hosting-Häkchen kannst du leer lassen, machen wir gleich per CLI).
3. Die angezeigten `firebaseConfig`-Werte kopieren und in `src/firebase.js`
   einsetzen (die Platzhalter `DEIN_...` ersetzen).

## 5. Firebase CLI installieren & einloggen

```bash
npm install -g firebase-tools
firebase login
```

## 6. Projekt lokal einrichten

```bash
npm install
```

In `.firebaserc` die `DEIN_FIREBASE_PROJEKT_ID` durch deine tatsächliche
Projekt-ID ersetzen (steht in den Projekteinstellungen, z. B. `accessible-org-a1b2c`).

## 7. Firestore-Regeln deployen

```bash
firebase deploy --only firestore:rules
```

## 8. Lokal testen

```bash
npm run dev
```

Öffnet die App unter `http://localhost:5173`. Mit deinem in Schritt 3 angelegten
Account einloggen – die Demo-Daten werden beim ersten Start einmalig geladen und
danach automatisch (mit kurzer Verzögerung) nach Firestore gespeichert. Unten
links in der Sidebar zeigt ein kleiner Text den Speicherstatus
("Speichert …" / "Gespeichert").

## 9. Bauen & deployen

```bash
npm run build
firebase deploy --only hosting
```

Danach zeigt die Konsole die Live-URL (z. B. `https://accessible-org-a1b2c.web.app`).

## Wie die Daten gespeichert werden

Der komplette App-Zustand (Projekte, Aufgaben, Notizen, Audit, Ressourcen,
Weiterbildung, Meetings, Dankbarkeit/Tagesnotizen, Theme) liegt in **einem**
Firestore-Dokument: `users/{deine-uid}/app/state`. Das reicht für eine
Einzelperson locker aus (Firestore-Dokumente dürfen bis 1 MB groß sein) und hält
das Setup einfach. Bei jeder Änderung wird nach 800ms Pause automatisch
gespeichert (debounced), damit nicht bei jedem Tastenanschlag ein Schreibzugriff
ausgelöst wird.

## Wenn du später mehr brauchst

- **Mehrere Geräte gleichzeitig offen**: aktuell "last write wins" – kein Problem
  bei einer Person, die nacheinander an einem Gerät arbeitet.
- **Automatisches Deployment**: `firebase init hosting:github` richtet einen
  GitHub-Actions-Workflow ein, der bei jedem Push automatisch baut & deployed.
- **Eigene Domain**: Hosting → "Benutzerdefinierte Domain hinzufügen" in der
  Firebase Console.
