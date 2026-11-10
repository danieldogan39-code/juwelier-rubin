// Stammdaten für die 3D-Modelle: Legierungen, Oberflächen, Profile, Steinbesatz.
// Alle Längen in Millimetern.

// Reflexionsgrad bei senkrechtem Lichteinfall (F0, linear), abgeleitet aus den optischen
// Konstanten der Legierungsbestandteile. Rot/Grün/Blau stehen für ca. 650 / 550 / 450 nm.
// Weißgold ist wie im Handel üblich rhodiniert, deshalb der Wert von Rhodium.
export const METALS = {
  gelbgold: { label: "Gelbgold 585", f0: [0.89, 0.69, 0.36], stamp: "585", rho: 13.2 },
  weissgold: { label: "Weißgold 585", f0: [0.8, 0.79, 0.775], stamp: "585", rho: 13.9 },
  rosegold: { label: "Roségold 585", f0: [0.89, 0.6, 0.45], stamp: "585", rho: 13.2 },
  rotgold: { label: "Rotgold 585", f0: [0.885, 0.545, 0.395], stamp: "585", rho: 13.1 },
  platin: { label: "Platin 950", f0: [0.68, 0.645, 0.6], stamp: "Pt 950", rho: 20.4 },
};

// Weitere Feingehalte. Mehr Feingold heißt: sattere Farbe und höhere Dichte (rho in g/cm³,
// übliche Werte für Schmucklegierungen). Schlüssel: "gelbgold-750", "rosegold-333" usw.
const FINENESS = {
  gelbgold: { 333: [[0.87, 0.715, 0.455], 11.0], 750: [[0.915, 0.7, 0.315], 15.4] },
  weissgold: { 333: [[0.8, 0.79, 0.775], 11.3], 750: [[0.8, 0.79, 0.775], 15.8] },
  rosegold: { 333: [[0.875, 0.625, 0.49], 11.0], 750: [[0.9, 0.61, 0.43], 15.1] },
  rotgold: { 333: [[0.87, 0.575, 0.445], 10.9], 750: [[0.895, 0.555, 0.385], 15.0] },
};
for (const [metal, grades] of Object.entries(FINENESS)) {
  const name = METALS[metal].label.replace(" 585", "");
  METALS[metal + "-585"] = METALS[metal];
  for (const [grade, [f0, rho]] of Object.entries(grades)) METALS[`${metal}-${grade}`] = { label: `${name} ${grade}`, f0, stamp: grade, rho };
}
METALS["platin-950"] = METALS.platin;

const srgb = (v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
for (const m of Object.values(METALS)) {
  m.color = "#" + m.f0.map((v) => Math.round(srgb(v) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
}

// roughness: Mikrorauheit der Oberfläche. aniso: Richtungsabhängigkeit (Strichmattierung läuft um den Ring).
export const FINISHES = {
  poliert: { label: "Poliert", roughness: 0.045, aniso: 0, grain: null },
  laengsmatt: { label: "Längsmatt", roughness: 0.3, aniso: 0.8, grain: "brushed" },
  eismatt: { label: "Eismatt", roughness: 0.46, aniso: 0, grain: "frost" },
  quermatt: { label: "Quermatt", roughness: 0.3, aniso: 0.8, grain: "brushed", across: true },
  mitte: { label: "Mitte poliert, Seiten matt", roughness: 0.3, aniso: 0.8, grain: "brushed" },
};

export const PROFILES = { flach: "Flach", bombiert: "Bombiert", kante: "Kante" };
export const STONES = { ohne: "Ohne Stein", eins: "1 Brillant", drei: "3 Brillanten", fuenf: "5 Brillanten", memoire: "Halbmemoire" };

// Diamant: Brechungsindex bei 656 / 589 / 486 nm (Fraunhofer-Linien C, d, F).
export const DIAMOND_IOR = [2.4099, 2.4175, 2.4354];

// Proportionen eines runden Brillanten im Idealschliff (Anteile bezogen auf den Radius 1).
export const BRILLIANT = {
  table: 0.57, // Tafeldurchmesser / Durchmesser
  crown: 34.5, // Kronenwinkel in Grad
  pavilion: 40.75, // Pavillonwinkel in Grad
  star: 0.5, // Länge der Sternfacetten
  lower: 0.77, // Länge der unteren Rundistfacetten
  girdle: 0.035, // halbe Rundiststärke an den dicksten Stellen
};

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s ^= s << 13), (s ^= s >>> 17), (s ^= s << 5), ((s >>> 0) % 1e5) / 1e5);
}
