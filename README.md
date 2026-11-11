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
- Die Fläche unter dem Ring spiegelt wie schwarzes Glas (Fresnel, n = 1,5) – Baukasten und Ring-Studio.

## Ring-Studio und Baukasten

- `ring-studio.html`: zwei Ringe (Ring 1, Ring 2, Paaransicht), Legierung, Profil, Breite, Höhe, Oberfläche, Steine,
  Gravur in drei Schriften, echte Ringgröße, Querschnitt mit Maßen, Link zum Teilen. Die Auswahl liegt im Browser
  unter `rubin-studio-cfg` und geht mit „Termin anfragen“ ins Kontaktformular.
- Startseite: Abschnitt „Fünf Entscheidungen, ein Ring“ nutzt dieselbe Auswahl (Ring 1). Kein an das Scrollen
  gekoppelter Ablauf mehr.
  Der Ring steht dort in Dreiviertelansicht von oben (Drehung 0,6 · Neigung 0,62 · Zoom 1,1), damit Band, Stein und
  Innenseite zugleich zu sehen sind. Dieselbe Ansicht ist „Vorn“ im Ring-Studio und das Standbild `r-solo`.
  Unter dem Ring steht eine Zeile mit den echten Werten der Auswahl (Legierung, Breite, Gewicht, Steine) aus
  `ringSpecs`. Die Auswahlfelder sind ein Raster mit gleich breiten Feldern (vier je Zeile, schmal zwei).
- Matte Oberflächen bekommen bei Gelb-, Rosé- und Rotgold etwas mehr Umgebungslicht (`metalMaterial` in
  `src/ring/band.js`), sonst wirken sie stumpf. Weißgold und Platin bleiben unverändert.
- Schrift: Überschriften und Text in Instrument Sans. Fraunces wird nur noch für die Gravur auf dem Ring geladen.
- Die Standbilder `assets/img/r-*.avif/.webp` sind Aufnahmen aus demselben Modul. Wer am Modul etwas ändert,
  sollte sie neu aufnehmen. Zustand und Ansicht jedes Bildes stehen in `src/ring/standbilder.json`.
- Das Logo-Intro der Startseite ist `assets/brand/rubin-intro.svg` (zeichnet das Logo aus seinen Bauteilen).

## Startseite: erster Bildschirm

- Fünf Szenen im Vollbild (Trauringe, Schmuck, Uhren, Goldankauf, Werkstatt), je ein großes Wort, darunter Termin
  und „Ansehen“. Fünf feine Linien am unteren Bildrand wählen die Szene (Zeiger darüber, Tippen, Pfeiltasten,
  seitliches Wischen); ohne Zutun wechselt sie alle 6,5 s. Pause-Knopf rechts neben den Linien. Bei „Weniger
  Bewegung“ oder Datensparmodus kein selbstständiger Wechsel. Filialen und Öffnungsstatus stehen direkt unter dem Bild.
- Bilder: `assets/img/hero-<szene>-l-<breite>` (quer, 16:9) und `-p-<breite>` (hoch, 9:19,5), je avif und webp.
  Vorlagen liegen in `src/hero/<szene>-l.jpg` (quer, Motiv rechts, links dunkel). `python3 src/hero/heroimg.py`
  erzeugt daraus alle Größen und schneidet die Hochkant-Fassung selbst zu (Ausschnitt je Szene steht im Skript);
  eine eigene Hochkant-Vorlage `<szene>-p.jpg` hat Vorrang.
- Der Wechsel besteht nur aus Verschiebungen (kein 3D, kein Video). Ohne Grafikbeschleunigung: weiche Überblendung.

## Startseite: Karten „Aus unseren Vitrinen“

- Alle fünf Karten zeigen Fotos mit mehreren Modellen in Bewegung. Vorlagen in `src/karten/<name>.png`,
  `python3 src/karten/kartenbild.py` setzt den hellen Grund auf Weiß (Uhren: auf Schwarz) und erzeugt die Größen.
- In der Karte liegt das Foto multipliziert über dem Kartenton (Uhren: aufgehellt über der dunklen Karte), füllt den
  Bildbereich bis an den Rand und läuft zur Schrift hin weich aus. Bildausschnitt je Karte: `--pos` (breit) und
  `--pos-s` (schmal) im `style` der Karte.
- Solange der Abschnitt im Bild steht, schweben die Fotos langsam (nicht bei „Weniger Bewegung“ und nicht ohne
  Grafikbeschleunigung).

## Rechenlast

- Baukasten und Ring-Studio zeichnen nur, wenn sich etwas ändert. Der Baukasten startet seine 3D-Ansicht erst beim
  Bedienen oder wenn er kurz im Bild steht.
- Geräte ohne Grafikbeschleunigung (WebGL nur per Software): Der Baukasten startet 3D erst beim Bedienen, bis dahin
  steht das Standbild. Zum Testen in so einer Umgebung: `?gl=1` an die Adresse.
