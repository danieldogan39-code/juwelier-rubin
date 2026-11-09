// Ringschiene: Querschnitt in Millimetern, daraus ein Rotationskörper. Dazu die Metallmaterialien,
// die Mikrostruktur der Mattierungen und die Gravur mit Feingehaltsstempel auf der Innenseite.
import * as THREE from "three";
import { METALS, FINISHES, TAU, clamp, rng } from "./data.js";

// Querschnitt als geschlossene Punktfolge (r = Abstand zur Ringachse, y = Lage entlang der Achse).
export function bandProfile({ innerRadius: ri, width, thickness: t, profile }) {
  const hw = width / 2;
  const comfort = Math.min(0.22, t * 0.14); // leichte Wölbung innen (Komfortinnenform)
  const edgeT = profile === "bombiert" ? t * 0.58 : profile === "kante" ? t * 0.74 : t;
  const fillet = Math.min(0.34, edgeT * 0.32, hw * 0.3);
  const flat = hw - fillet;
  const outerR = (y) => {
    const e = clamp(Math.abs(y) / flat, 0, 1);
    return profile === "bombiert" ? ri + edgeT + (t - edgeT) * Math.sqrt(Math.max(0, 1 - e * e)) : profile === "kante" ? ri + t - (t - edgeT) * e : ri + t;
  };
  const innerR = (y) => {
    const e = clamp(y / flat, -1, 1);
    return ri - comfort * (1 - e * e);
  };
  const pts = [];
  const NI = 48, NO = 96, NF = 10, NS = 5;
  for (let i = 0; i <= NI; i++) {
    const y = -flat + 2 * flat * (i / NI);
    pts.push({ r: innerR(y), y, part: "inner" });
  }
  const side = (s) => {
    const out = [];
    for (let i = 1; i <= NF; i++) {
      const a = Math.PI - (Math.PI / 2) * (i / NF);
      out.push({ r: ri + fillet + fillet * Math.cos(a), y: s * (flat + fillet * Math.sin(a)), part: "edge" });
    }
    for (let i = 1; i < NS; i++) out.push({ r: ri + fillet + (edgeT - 2 * fillet) * (i / NS), y: s * hw, part: "edge" });
    for (let i = 0; i < NF; i++) {
      const a = Math.PI / 2 - (Math.PI / 2) * (i / NF);
      out.push({ r: ri + edgeT - fillet + fillet * Math.cos(a), y: s * (flat + fillet * Math.sin(a)), part: "edge" });
    }
    return out;
  };
  pts.push(...side(1));
  for (let i = 0; i <= NO; i++) {
    const y = flat - 2 * flat * (i / NO);
    pts.push({ r: outerR(y), y, part: "outer" });
  }
  pts.push(...side(-1).reverse());
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    let dr = b.r - a.r, dy = b.y - a.y;
    const l = Math.hypot(dr, dy) || 1;
    pts[i].nr = -dy / l;
    pts[i].ny = dr / l;
  }
  return { pts, outerR, innerR, hw, edgeT, ri, t, width };
}

// Rotationskörper aus einem (Teil-)Querschnitt. u läuft um den Ring, v über den Querschnitt.
export function lathe(pts, segments = 384) {
  const c = pts.length;
  const len = [0];
  for (let i = 1; i < c; i++) len.push(len[i - 1] + Math.hypot(pts[i].r - pts[i - 1].r, pts[i].y - pts[i - 1].y));
  const total = len[c - 1] || 1;
  const count = (segments + 1) * c;
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), uv = new Float32Array(count * 2), tan = new Float32Array(count * 4);
  let o = 0;
  for (let s = 0; s <= segments; s++) {
    const u = s / segments, a = u * TAU, ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 0; i < c; i++, o++) {
      const p = pts[i];
      pos.set([p.r * ca, p.y, p.r * sa], o * 3);
      nor.set([p.nr * ca, p.ny, p.nr * sa], o * 3);
      uv.set([u, len[i] / total], o * 2);
      tan.set([-sa, 0, ca, 1], o * 4);
    }
  }
  const idx = new Uint32Array(segments * (c - 1) * 6);
  let k = 0;
  for (let s = 0; s < segments; s++)
    for (let i = 0; i < c - 1; i++) {
      const a = s * c + i, b = (s + 1) * c + i;
      idx.set([a, b, a + 1, b, b + 1, a + 1], k);
      k += 6;
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setAttribute("tangent", new THREE.BufferAttribute(tan, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---- Mikrostruktur der Mattierungen (Normalenkarten aus einem Höhenfeld) ----
const grainCache = {};
function grainTexture(kind) {
  if (grainCache[kind]) return grainCache[kind];
  const W = 1024, H = 256;
  const h = new Float32Array(W * H);
  const r = rng(kind === "brushed" ? 7 : 19);
  if (kind === "brushed") {
    // feine Striche in Umfangsrichtung, unterschiedlich lang und tief
    for (let i = 0; i < 2600; i++) {
      const y = Math.floor(r() * H), x0 = Math.floor(r() * W), l = 60 + Math.floor(r() * 520), d = (r() - 0.5) * 2;
      for (let x = 0; x < l; x++) h[y * W + ((x0 + x) % W)] += d * Math.sin((x / l) * Math.PI);
    }
  } else {
    // Eismatt: ungerichtete, körnige Struktur
    for (let i = 0; i < W * H; i++) h[i] = r() - 0.5;
    const b = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let s = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += h[((y + dy + H) % H) * W + ((x + dx + W) % W)];
        b[y * W + x] = s / 9 + h[y * W + x] * 0.6;
      }
    h.set(b);
  }
  const data = new Uint8Array(W * H * 4);
  const k = kind === "brushed" ? 1.6 : 2.4;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const dx = (h[y * W + ((x + 1) % W)] - h[y * W + ((x - 1 + W) % W)]) * k;
      const dy = (h[((y + 1) % H) * W + x] - h[((y - 1 + H) % H) * W + x]) * k;
      const l = Math.hypot(dx, dy, 1);
      data.set([(-dx / l) * 127 + 128, (-dy / l) * 127 + 128, (1 / l) * 127 + 128, 255], (y * W + x) * 4);
    }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return (grainCache[kind] = t);
}

export function metalMaterial(metal, finishKey, env, { part = "outer", circumference = 60 } = {}) {
  const m = METALS[metal] || METALS.gelbgold;
  let f = FINISHES[finishKey] || FINISHES.poliert;
  if (finishKey === "mitte" && part === "stripe") f = FINISHES.poliert;
  if (part === "inner" || part === "setting") f = FINISHES.poliert;
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setRGB(m.f0[0], m.f0[1], m.f0[2], THREE.LinearSRGBColorSpace),
    metalness: 1,
    roughness: part === "inner" ? 0.06 : f.roughness,
    envMap: env,
    envMapIntensity: 1,
  });
  if (f.aniso) {
    mat.anisotropy = f.aniso;
    mat.anisotropyRotation = Math.PI / 2;
  }
  if (f.grain) {
    mat.normalMap = grainTexture(f.grain);
    mat.normalMap.repeat.set(Math.max(2, Math.round(circumference / 9)), 2);
    mat.normalScale = new THREE.Vector2(f.grain === "brushed" ? 0.2 : 0.34, f.grain === "brushed" ? 0.2 : 0.34);
  }
  mat.userData.metal = metal;
  mat.userData.part = part;
  return mat;
}

export function metalColor(metal, part) {
  const m = METALS[metal] || METALS.gelbgold;
  // Innen spiegelt sich das Metall in sich selbst; das vertieft den Farbton (im Mittel etwa 1,5 Reflexionen).
  const e = part === "inner" ? 1.5 : 1;
  return new THREE.Color().setRGB(Math.pow(m.f0[0], e), Math.pow(m.f0[1], e), Math.pow(m.f0[2], e), THREE.LinearSRGBColorSpace);
}

// ---- Gravur und Stempel: Höhenkarte für die Ringinnenseite ----
// Die Karte läuft einmal um den Ring (u) und über die Breite (v). Weiß = vertieft.
export const ENGRAVE_W = 4096, ENGRAVE_H = 256;
export function engravingCanvas(text, fontFamily, italic, { metal = "gelbgold", size = 54, width = 4.5, canvas } = {}) {
  const c = canvas || document.createElement("canvas");
  c.width = ENGRAVE_W;
  c.height = ENGRAVE_H;
  const g = c.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, c.width, c.height);
  g.save();
  g.translate(c.width, c.height);
  g.scale(-1, -1);
  g.fillStyle = "#fff";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const pxPerMm = c.width / size; // Umfang innen = Ringgröße in mm
  const vScale = c.height / (width * pxPerMm); // die Karte wird über die Breite gestreckt – hier ausgleichen
  g.scale(1, vScale);
  const cy = c.height / 2 / vScale;
  if (text) {
    const hMm = clamp(width * 0.42, 1.1, 1.9); // Schrifthöhe der Gravur
    g.font = `${italic ? "italic " : ""}400 ${Math.round(hMm * pxPerMm * 1.25)}px ${fontFamily}`;
    g.fillText(text, c.width * 0.75, cy);
  }
  // Feingehaltsstempel und Herstellerzeichen, gegenüber der Gravur
  const sh = clamp(width * 0.26, 0.75, 1.05) * pxPerMm;
  const stamp = (METALS[metal] || METALS.gelbgold).stamp;
  g.font = `600 ${Math.round(sh)}px "Instrument Sans", Arial, sans-serif`;
  const w1 = g.measureText(stamp).width + sh * 0.9;
  const x1 = c.width * 0.25 - w1 * 0.62;
  g.lineWidth = Math.max(2, sh * 0.09);
  g.strokeStyle = "#fff";
  g.beginPath();
  g.roundRect(x1 - w1 / 2, cy - sh * 0.78, w1, sh * 1.56, sh * 0.3);
  g.stroke();
  g.fillText(stamp, x1, cy + sh * 0.04);
  g.font = `600 ${Math.round(sh * 0.86)}px "Instrument Sans", Arial, sans-serif`;
  g.fillText("RUBIN", c.width * 0.25 + w1 * 0.62 + sh * 0.4, cy + sh * 0.04);
  g.restore();
  return c;
}

export function applyEngraving(mat, tex) {
  mat.bumpMap = tex;
  mat.bumpScale = -2.6;
  mat.roughnessMap = tex;
  mat.roughness = 1;
  mat.onBeforeCompile = (s) => {
    // In der Vertiefung ist das Metall rauer und etwas dunkler als die polierte Fläche daneben.
    s.fragmentShader = s.fragmentShader
      .replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
 roughnessFactor = mix(0.06, 0.58, texture2D( roughnessMap, vRoughnessMapUv ).g);
#endif`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
#ifdef USE_ROUGHNESSMAP
 diffuseColor.rgb *= mix(1.0, 0.6, texture2D( roughnessMap, vRoughnessMapUv ).g);
#endif`,
      );
  };
}
