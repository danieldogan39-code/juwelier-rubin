# Juwelier Rubin – Website-Entwurf

Entwurf von Medialyte, veröffentlicht über GitHub Pages unter **https://rubin.entwurf.medialyte.de**.

- Jede `.html`-Datei im Hauptordner ist eine Seite. Bilder, Schriften, Skripte und Styles liegen in `assets/`.
- **Quellen** liegen in `src/`:
  - `src/site.css` und `src/site.js` – Gestaltung und Verhalten der Seite
  - `src/ring.js` und `src/ring/` – das 3D-Modul (Studio-Licht, Ringschiene, Brillant, Fassungen, Ruhelagen, Betrachter)
- **Bauen:** `npm install` (einmalig), dann `python3 build.py`. Das erzeugt `assets/css/site.css`, `assets/js/site.js`
  und `assets/js/ring.js` und setzt in allen Seiten eine neue Versionsnummer (`?v=…`).
  Dateien in `assets/css` und `assets/js` nicht von Hand ändern (`map.js` ausgenommen, dafür gibt es keine Quelle).
- GitHub Pages liefert den Branch `gh-pages` aus (gleicher Stand wie `main`): Änderungen immer auf beide pushen
  (`git push origin main main:gh-pages`).
- `CNAME` legt die Adresse fest (DNS bei IONOS: CNAME `rubin.entwurf` → `danieldogan39-code.github.io`).
- Der Entwurf ist für Suchmaschinen gesperrt (`robots.txt`, `noindex` in jeder Seite).

## 3D-Modelle

- Alle Maße in Millimetern; die Ringgröße ist der Innenumfang.
- Metalle: Reflexionswerte der Legierungen (`src/ring/data.js`), Weißgold rhodiniert.
- Brillant: 57 Facetten im Idealschliff; das Material verfolgt den Lichtweg im Stein (Brechung, Fresnel,
  Totalreflexion, Farbzerlegung über drei Brechungsindizes).
- Aufliegende Szenen (Ringpaar, Ringreihe, Ohrstecker, loser Stein) werden aus Berührung und Schwerpunkt berechnet,
  nichts durchdringt sich.
- Die Standbilder `assets/img/r-*.avif/.webp` sind Aufnahmen aus demselben Modul. Wer am Modul etwas ändert,
  sollte sie neu aufnehmen. Zustand und Ansicht jedes Bildes stehen in `src/ring/standbilder.json`.
- Das Logo-Intro der Startseite ist `assets/brand/rubin-intro.svg` (zeichnet das Logo aus seinen Bauteilen).
