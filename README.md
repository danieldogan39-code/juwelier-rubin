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
- Steine sitzen in echten Sitzen: runde Bohrung mit polierter Fase (1, 3, 5 Brillanten) oder gefräster Kanal mit
  Körnern (Memoire). Die Steingröße richtet sich nach Breite und Höhe der Schiene, kein Stein ragt innen durch.
- Legierungen 333, 585, 750 und Platin 950 mit eigener Farbe und Dichte; `ringSpecs()` rechnet daraus Gewicht,
  Karat und Maße (Anzeige im Ring-Studio).
- Die Fläche unter dem Ring spiegelt wie schwarzes Glas (Fresnel, n = 1,5) – Startseite, Baukasten und Ring-Studio.

## Ring-Studio und Baukasten

- `ring-studio.html`: zwei Ringe (Ring 1, Ring 2, Paaransicht), Legierung, Profil, Breite, Höhe, Oberfläche, Steine,
  Gravur in drei Schriften, echte Ringgröße, Querschnitt mit Maßen, Link zum Teilen. Die Auswahl liegt im Browser
  unter `rubin-studio-cfg` und geht mit „Termin anfragen“ ins Kontaktformular.
- Startseite: Abschnitt „Fünf Entscheidungen, ein Ring“ nutzt dieselbe Auswahl (Ring 1). Kein an das Scrollen
  gekoppelter Ablauf mehr.
- Schrift: Überschriften und Text in Instrument Sans. Fraunces wird nur noch für die Gravur auf dem Ring geladen.
- Die Standbilder `assets/img/r-*.avif/.webp` sind Aufnahmen aus demselben Modul. Wer am Modul etwas ändert,
  sollte sie neu aufnehmen. Zustand und Ansicht jedes Bildes stehen in `src/ring/standbilder.json`.
- Das Logo-Intro der Startseite ist `assets/brand/rubin-intro.svg` (zeichnet das Logo aus seinen Bauteilen).

## Rechenlast

- **Hero:** Die Drehung des Ringpaars ist vorab aufgenommen (`assets/video/ring-<metall>-960.mp4` und `-640.mp4`,
  20 s je Umdrehung, 30 Bilder/s). Jedes Video enthält oben die Farbe und unten die Deckkraft; ein kleines
  WebGL-Viereck setzt beides zusammen (`alphaVideo` in `src/site.js`). So bleibt der Hintergrund durchsichtig und
  jedes Gerät mit H.264-Decoder spielt es ab.
- Die Echtzeit-Ansicht startet im Hero erst beim Anfassen (Maus über dem Ring, Finger, Pfeiltasten), übernimmt
  genau das Bild des Videos und gibt nach ein paar Sekunden Ruhe wieder an das Video ab.
- Baukasten und Ring-Studio zeichnen nur, wenn sich etwas ändert. Der Baukasten startet seine 3D-Ansicht erst beim
  Bedienen oder wenn er kurz im Bild steht.
- „Weniger Bewegung“ oder Datensparmodus: kein Video, Standbild; 3D beim Anfassen.
- Videos neu aufnehmen (nach Änderungen am Ringpaar): Einzelbilder mit der Testseite `.dev/t.html`
  (`mode: pair`, Spiegelung an, Ansicht `0.6 + 2π·i/600, 0.3, 1`, 960 × 960, transparent) und dann mit ffmpeg
  zusammensetzen: Farbe über Schwarz und Deckkraft übereinander (`vstack`), H.264, `-crf 27` (640er: `-crf 26`),
  `-g 300`, BT.709.
