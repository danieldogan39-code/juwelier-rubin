// Die Modelle: Ringschiene mit Besatz, Solitär mit Krappenfassung, Ohrstecker, loser Brillant –
// und die Lage der Stücke zueinander. Nichts durchdringt sich: Wo Ringe aufeinander liegen oder
// ineinander stehen, wird die Lage aus der Berührung berechnet; einzelne Stücke liegen in einer
// stabilen Ruhelage (Schwerpunkt über der Auflagefläche).
import * as THREE from "three";
import { ConvexHull } from "three/examples/jsm/math/ConvexHull.js";
import { METALS, TAU, clamp, rng } from "./data.js";
import { bandProfile, bandVolume, lathe, metalMaterial, metalColor, applyEngraving } from "./band.js";
import { brilliant, crownHeightAt, diamondMaterial } from "./brilliant.js";

const V3 = THREE.Vector3;
const Z = new V3(0, 0, 1);

// ---------- Krappe: konischer Draht mit runder Kuppe ----------
function prong(points, r0, r1, mat) {
  const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
  const TS = 32, RS = 16;
  const g = new THREE.TubeGeometry(curve, TS, 1, RS, false);
  const p = g.attributes.position;
  for (let i = 0; i <= TS; i++) {
    const t = i / TS, c = curve.getPointAt(t), r = r0 + (r1 - r0) * Math.pow(t, 1.4);
    for (let j = 0; j <= RS; j++) {
      const k = i * (RS + 1) + j;
      p.setXYZ(k, c.x + (p.getX(k) - c.x) * r, c.y + (p.getY(k) - c.y) * r, c.z + (p.getZ(k) - c.z) * r);
    }
  }
  g.computeVertexNormals();
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, mat));
  const tip = new THREE.Mesh(new THREE.SphereGeometry(r1 * 1.04, 24, 16), mat);
  tip.position.copy(curve.getPointAt(1));
  grp.add(tip);
  return grp;
}

// ---------- Krappenfassung mit Stein; Ursprung am Fassungsboden, Stein zeigt nach +Z ----------
function head({ Rs, prongs = 6, mat, stoneMat, lift = 0.9 }) {
  const b = brilliant();
  const grp = new THREE.Group();
  const zg = Rs * (b.depth - b.crownHeight - b.girdle) + lift; // Höhe der Rundistebene
  const stone = new THREE.Mesh(b.geometry, stoneMat);
  stone.scale.setScalar(Rs);
  stone.position.z = zg;
  grp.add(stone);
  const wire = Math.max(0.17, Rs * 0.085);
  for (let i = 0; i < prongs; i++) {
    const a = (i / prongs) * TAU + (prongs === 4 ? Math.PI / 4 : Math.PI / 6);
    const P = (r, z) => new V3(Math.cos(a) * Rs * r, Math.sin(a) * Rs * r, z);
    // vom Boden nach außen zum Rundist, dann als Kralle auf die Krone gelegt
    const rTip = 0.9;
    grp.add(
      prong(
        [P(0.3, 0.05), P(0.72, zg - Rs * 0.6), P(1.0 + wire / Rs * 0.55, zg - Rs * 0.08), P(1.0 + wire / Rs * 0.4, zg + Rs * 0.06), P(rTip, zg + Rs * crownHeightAt(rTip) + wire * 0.62)],
        wire * 1.05,
        wire * 0.8,
        mat,
      ),
    );
  }
  const gallery = new THREE.Mesh(new THREE.TorusGeometry(Rs * 0.86, wire * 0.55, 16, 96), mat);
  gallery.position.z = zg - Rs * 0.42;
  grp.add(gallery);
  const base = new THREE.Mesh(new THREE.TorusGeometry(Rs * 0.36, wire * 0.6, 16, 64), mat);
  base.position.z = 0.12;
  grp.add(base);
  grp.userData.zGirdle = zg;
  return grp;
}

const DEFAULTS = { size: 54, width: 4, thickness: 1.8, profile: "bombiert", metal: "gelbgold", metal2: "weissgold", bicolor: false, finish: "poliert", stones: "ohne", stoneSize: 1, upright: true };

function profileOf(o, rows) {
  const hw = o.width / 2;
  const grooves = o.bicolor ? [0] : o.finish === "mitte" ? [-hw * 0.32, hw * 0.32] : [];
  return bandProfile({ innerRadius: o.size / TAU, width: o.width, thickness: o.thickness, profile: o.profile, grooves, rows }); // Ringgröße = Innenumfang in mm
}

// Lage und Größe der Steine. Ein Stein darf weder breiter sein als die Schiene noch tiefer als ihre Stärke.
const TOP = 1.5 * Math.PI;
function stoneLayout(o, prof) {
  const b = brilliant();
  const rTop = prof.ri + prof.t;
  const below = b.depth - b.crownHeight; // Tiefe des Steins unter dem Rundist, bezogen auf den Steinradius
  // Der Rundist sitzt knapp unter der tiefsten Stelle der Oberfläche rund um den Stein
  const sinkOf = (Rs) => rTop - prof.outerR(Rs * 0.9) + Rs * 0.1;
  const fits = (Rs) => {
    Rs = Math.min(Rs, (o.width - 0.7) / 2.3);
    for (let i = 0; i < 6 && Rs * below + sinkOf(Rs) > o.thickness - 0.2; i++) Rs *= 0.94;
    return Rs;
  };
  if (o.stones === "solitaer") return { Rs: 2.6 * o.stoneSize, angles: [TOP], rTop, sink: 0 };
  let Rs = 0, angles = [];
  const row = (n, base) => {
    Rs = fits(base * o.stoneSize);
    const d = (Rs * 2.5) / rTop;
    for (let i = 0; i < n; i++) angles.push(TOP + (i - (n - 1) / 2) * d);
  };
  if (o.stones === "eins") row(1, 0.95);
  if (o.stones === "drei") row(3, 0.8);
  if (o.stones === "fuenf") row(5, 0.7);
  const memoire = o.stones === "memoire";
  if (memoire) {
    Rs = fits((clamp(o.width * 0.36, 1.1, 1.8) / 2) * (0.85 + 0.15 * o.stoneSize));
    const d = (Rs * 2.16) / rTop;
    const n = Math.floor((Math.PI * 0.95) / d);
    for (let i = 0; i < n; i++) angles.push(TOP - ((n - 1) / 2) * d + i * d);
  }
  return { Rs, angles, memoire, rTop, sink: sinkOf(Rs) };
}

// Kennwerte eines Rings: Maße, Gewicht (Volumen × Dichte der Legierung) und Steinbesatz.
// Karat: Ein Brillant im Idealschliff wiegt rund 0,0037 ct × Durchmesser³ (mm).
export function ringSpecs(cfg) {
  const o = Object.assign({}, DEFAULTS, cfg);
  const prof = profileOf(o);
  const { Rs, angles } = o.stones === "ohne" ? { Rs: 0, angles: [] } : stoneLayout(o, prof);
  const rho = o.bicolor ? ((METALS[o.metal] || METALS.gelbgold).rho + (METALS[o.metal2] || METALS.weissgold).rho) / 2 : (METALS[o.metal] || METALS.gelbgold).rho;
  const volume = bandVolume(prof);
  const d = Rs * 2;
  return {
    innerDiameter: (o.size / Math.PI),
    outerDiameter: 2 * (prof.ri + prof.t),
    volume,
    weight: (volume / 1000) * rho,
    stones: angles.length,
    stoneDiameter: d,
    carat: angles.length * 0.0037 * d * d * d,
    profile: prof,
  };
}

// ---------- Ringschiene mit Besatz ----------
// Lokales System der Schiene: Ringachse = Y. Steine sitzen bei Winkel 270° (zeigt nach dem Aufrichten nach oben).
export function buildRing(cfg, studio, engraving) {
  const o = Object.assign({}, DEFAULTS, cfg);
  const ri = o.size / TAU;
  const set = o.stones !== "ohne" && o.stones !== "solitaer"; // Steine in der Schiene gefasst
  const layout = o.stones === "ohne" ? null : stoneLayout(o, profileOf(o));
  const Rs = layout ? layout.Rs : 0;

  // Steinsitz: Für eingeriebene Steine wird ein runder Sitz gebohrt, für die Memoire-Reihe ein Kanal gefräst.
  // Der Boden liegt knapp unter dem Rundist; Querschnitt und Winkelteilung bekommen dort zusätzliche Stützstellen.
  let rows = [], angles = null, seat = null, floor = 0;
  if (set) {
    const rTop = layout.rTop, A = layout.angles;
    floor = rTop - layout.sink - Rs * 0.05;
    const base = Array.from({ length: 385 }, (_, i) => (i / 384) * TAU);
    if (layout.memoire) {
      const yw = Rs * 1.04, e = 0.012;
      const a0 = A[0] - (Rs * 1.22) / rTop, a1 = A[A.length - 1] + (Rs * 1.22) / rTop;
      rows = [-yw - e, -yw, yw, yw + e];
      angles = base.concat([a0 - e / rTop, a0, a1, a1 + e / rTop]);
      seat = (a, y, r) => (Math.abs(y) <= yw + 1e-6 && a >= a0 - 1e-9 && a <= a1 + 1e-9 ? Math.min(r, floor) : r);
    } else {
      const hole = Rs * 1.1, pad = Rs * 1.3;
      for (let y = -pad; y <= pad; y += 0.03) rows.push(y);
      angles = base.slice();
      for (const c of A) for (let x = -pad; x <= pad; x += 0.03) angles.push(c + x / rTop);
      seat = (a, y, r) => {
        for (const c of A) {
          const x = (a - c) * rTop;
          if (x * x + y * y < hole * hole) return Math.min(r, floor);
        }
        return r;
      };
    }
    angles.sort((x, y) => x - y);
    angles = angles.filter((a, i) => i === 0 || a - angles[i - 1] > 1e-5);
  }

  const prof = profileOf(o, rows);
  const { pts, outerR, hw } = prof;
  const band = new THREE.Group();
  const mats = [];
  const circ = TAU * (ri + o.thickness);
  const M = (metal, part) => {
    const m = metalMaterial(metal, o.finish, studio.env, { part, circumference: circ });
    m.color.copy(metalColor(metal, part));
    mats.push(m);
    return m;
  };
  const firstOuter = pts.findIndex((p) => p.part !== "inner");
  const innerPts = pts.slice(0, firstOuter);
  const shell = [pts[firstOuter - 1], ...pts.slice(firstOuter), pts[0]];
  const split = (arr, key) => {
    const out = [];
    let cur = { k: key(arr[0]), pts: [arr[0]] };
    for (let i = 1; i < arr.length; i++) {
      const k = key(arr[i]);
      cur.pts.push(arr[i]);
      if (k !== cur.k) (out.push(cur), (cur = { k, pts: [arr[i]] }));
    }
    out.push(cur);
    return out.filter((s) => s.pts.length > 1);
  };
  let parts;
  if (o.bicolor) parts = split(shell, (p) => (p.y >= 0 ? "a" : "b"));
  else if (o.finish === "mitte") parts = split(shell, (p) => (p.part === "outer" && Math.abs(p.y) < hw * 0.32 ? "s" : "o"));
  else parts = [{ k: "a", pts: shell }];
  for (const p of parts) band.add(new THREE.Mesh(lathe(p.pts, { angles, seat }), M(o.bicolor && p.k === "b" ? o.metal2 : o.metal, p.k === "s" ? "stripe" : "outer")));

  const innerMat = M(o.metal, "inner");
  if (engraving) applyEngraving(innerMat, engraving);
  band.add(new THREE.Mesh(lathe(innerPts), innerMat));

  const rTop = prof.ri + prof.t;
  const seatColor = (METALS[o.metal] || METALS.gelbgold).f0;
  const b = brilliant();

  if (o.stones === "solitaer") {
    const dir = new V3(Math.cos(TOP), 0, Math.sin(TOP));
    const sm = diamondMaterial(studio.cube, { set: true, seat: (METALS[o.metal2] || METALS[o.metal]).f0 });
    mats.push(sm);
    const h = head({ Rs, prongs: 6, mat: M(o.metal2 || o.metal, "setting"), stoneMat: sm });
    h.quaternion.setFromUnitVectors(Z, dir);
    h.position.copy(dir).multiplyScalar(rTop - 0.18);
    band.add(h);
  } else if (set) {
    const A = layout.angles, memoire = layout.memoire;
    const sm = diamondMaterial(studio.cube, { set: true, seat: seatColor, bounces: 6 });
    mats.push(sm);
    const stones = new THREE.InstancedMesh(b.geometry, sm, A.length);
    const settingMat = M(o.metal, "setting");
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), qs = new THREE.Quaternion(), spin = new THREE.Quaternion(), sc = new V3(), p = new V3();
    const rGirdle = rTop - layout.sink;
    const turn = rng(A.length * 31 + 7);
    A.forEach((a, i) => {
      const dir = new V3(Math.cos(a), 0, Math.sin(a));
      q.setFromUnitVectors(Z, dir);
      // jeder Stein sitzt um seine eigene Achse etwas anders gedreht – wie von Hand gefasst
      qs.copy(q).multiply(spin.setFromAxisAngle(Z, turn() * TAU));
      stones.setMatrixAt(i, m4.compose(p.copy(dir).multiplyScalar(rGirdle), qs, sc.setScalar(Rs)));
    });
    band.add(stones);

    if (memoire) {
      // Körner: kleine Metallkugeln in den Zwickeln zwischen den Steinen, sie halten die Steine am Rundist
      const beads = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), settingMat, (A.length + 1) * 2);
      const d = A[1] - A[0];
      const rb = Rs * 0.33, yb = Rs * 0.76;
      let k = 0;
      for (let i = 0; i <= A.length; i++) {
        const a = A[0] - d / 2 + i * d;
        for (const sy of [-1, 1]) {
          const r = rGirdle + rb * 0.12;
          beads.setMatrixAt(k++, m4.compose(p.set(Math.cos(a) * r, sy * yb, Math.sin(a) * r), q.identity(), sc.setScalar(rb)));
        }
      }
      band.add(beads);
    } else {
      // Fassungsrand: polierte Fase vom Rundist hinauf zur Oberfläche; ihr oberer Rand folgt der Form der Schiene
      const N = 96, rIn = Rs * 0.985, rOut = Rs * 1.2;
      const pos = [], idx = [];
      A.forEach((c, si) => {
        for (let j = 0; j <= N; j++) {
          const f = (j / N) * TAU, cx = Math.cos(f), cy = Math.sin(f);
          for (const [d, top] of [[rIn, false], [rOut, true]]) {
            const a = c + (d * cx) / rTop, y = d * cy;
            const r = top ? outerR(y) + 0.004 : rGirdle + Rs * 0.02;
            pos.push(Math.cos(a) * r, y, Math.sin(a) * r);
          }
        }
        const o0 = si * (N + 1) * 2;
        for (let j = 0; j < N; j++) {
          const v = o0 + j * 2;
          idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx);
      g.computeVertexNormals();
      const bezel = new THREE.Mesh(g, settingMat);
      settingMat.side = THREE.DoubleSide;
      band.add(bezel);
    }
  }

  const ring = new THREE.Group();
  if (o.upright) band.rotation.x = Math.PI / 2; // Ringachse zur Kamera, Steine oben
  ring.add(band);
  ring.userData = { mats, prof, R: ri, width: o.width, thickness: o.thickness, band };
  return ring;
}

export function buildStud(cfg, studio) {
  const mats = [];
  const metal = metalMaterial(cfg.metal || "weissgold", "poliert", studio.env, { part: "setting" });
  const sm = diamondMaterial(studio.cube, { set: true, seat: (METALS[cfg.metal] || METALS.weissgold).f0 });
  mats.push(metal, sm);
  const Rs = cfg.Rs || 2.6;
  const h = head({ Rs, prongs: 4, mat: metal, stoneMat: sm, lift: 0.5 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 9.4, 28), metal);
  post.rotation.x = Math.PI / 2;
  post.position.z = -4.5;
  h.add(post);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12), metal);
  tip.position.z = -9.2;
  h.add(tip);
  const g = new THREE.Group();
  g.add(h);
  g.userData = { mats, com: new V3(0, 0, 0.6) };
  return g;
}

export function buildStone(cfg, studio) {
  const sm = diamondMaterial(studio.cube, { set: false, bounces: 8 });
  const b = brilliant();
  const Rs = cfg.Rs || 8;
  const m = new THREE.Mesh(b.geometry, sm);
  m.scale.setScalar(Rs);
  const g = new THREE.Group();
  g.add(m);
  g.userData = { mats: [sm], com: new V3(0, 0, -0.08 * Rs) };
  return g;
}

// ---------- Physik der Lage ----------

// Stützpunkte eines Objekts (im Koordinatensystem von obj)
function samplePoints(obj, maxPerMesh = 900) {
  obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  const out = [];
  const v = new V3(), m = new THREE.Matrix4(), im = new THREE.Matrix4();
  obj.traverse((c) => {
    if (!c.isMesh) return;
    const pos = c.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / maxPerMesh));
    const n = c.isInstancedMesh ? c.count : 1;
    for (let k = 0; k < n; k++) {
      m.copy(c.matrixWorld);
      if (c.isInstancedMesh) (c.getMatrixAt(k, im), m.multiply(im));
      m.premultiply(inv);
      for (let i = 0; i < pos.count; i += step) out.push(v.fromBufferAttribute(pos, i).applyMatrix4(m).clone());
    }
  });
  return out;
}

// Stabile Ruhelage eines starren Körpers auf einer Ebene: Der Körper liegt auf einer Fläche seiner
// konvexen Hülle, und der Schwerpunkt liegt senkrecht über dieser Fläche. Unter allen solchen Lagen
// wird die gewählt, die der gewünschten Richtung am nächsten kommt.
export function restOnGround(obj, com, preferDown) {
  const pts = samplePoints(obj);
  const hull = new ConvexHull().setFromPoints(pts);
  const want = preferDown.clone().normalize();
  let best = null;
  const a = new V3(), b = new V3(), c = new V3(), foot = new V3();
  const sameSide = (p, q, r, x, n) => new V3().subVectors(q, p).cross(new V3().subVectors(x, p)).dot(n) >= -1e-6;
  for (const f of hull.faces) {
    const n = f.normal;
    const d = n.dot(com) - f.constant;
    foot.copy(com).addScaledVector(n, -d);
    // liegt der Fußpunkt des Schwerpunkts in einem Dreieck dieser Ebene?
    let stable = false;
    for (const f2 of hull.faces) {
      if (f2.normal.dot(n) < 0.9999 || Math.abs(f2.constant - f.constant) > 1e-3) continue;
      a.copy(f2.edge.head().point);
      b.copy(f2.edge.next.head().point);
      c.copy(f2.edge.next.next.head().point);
      if (sameSide(a, b, c, foot, n) && sameSide(b, c, a, foot, n) && sameSide(c, a, b, foot, n)) {
        stable = true;
        break;
      }
    }
    if (!stable) continue;
    const score = n.dot(want);
    if (!best || score > best.score) best = { score, n: n.clone(), k: f.constant };
  }
  if (!best) return;
  obj.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(best.n, new V3(0, -1, 0)));
  obj.position.set(0, best.k, 0);
}

// Liegt ein Punkt (im lokalen System der Schiene, Achse = Y) im Metall?
function insideBand(prof, p, eps) {
  if (Math.abs(p.y) > prof.hw - eps) return false;
  const r = Math.hypot(p.x, p.z);
  return r < prof.outerR(p.y) - eps && r > prof.innerR(p.y) + eps;
}
function bandSurface(prof, n = 120) {
  const out = [];
  const step = Math.max(1, Math.floor(prof.pts.length / 56));
  for (let i = 0; i < prof.pts.length; i += step)
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU;
      out.push(new V3(prof.pts[i].r * Math.cos(a), prof.pts[i].y, prof.pts[i].r * Math.sin(a)));
    }
  return out;
}
function collide(A, B, eps = 0.012) {
  // A, B: { prof, band (Object3D mit aktueller Weltmatrix), surf }
  A.ring.updateMatrixWorld(true);
  B.ring.updateMatrixWorld(true);
  const ab = new THREE.Matrix4().copy(A.band.matrixWorld).invert().multiply(B.band.matrixWorld);
  const ba = new THREE.Matrix4().copy(ab).invert();
  const v = new V3();
  for (const p of B.surf) if (insideBand(A.prof, v.copy(p).applyMatrix4(ab), eps)) return true;
  for (const p of A.surf) if (insideBand(B.prof, v.copy(p).applyMatrix4(ba), eps)) return true;
  return false;
}
const body = (ring) => ({ ring, prof: ring.userData.prof, band: ring.userData.band, surf: bandSurface(ring.userData.prof) });
function lowestY(b) {
  b.ring.updateMatrixWorld(true);
  let y = Infinity;
  const v = new V3();
  for (const p of b.surf) y = Math.min(y, v.copy(p).applyMatrix4(b.band.matrixWorld).y);
  return y;
}
function bisect(free, hit, test, n = 26) {
  // free: Wert ohne Durchdringung, hit: Wert mit Durchdringung
  for (let i = 0; i < n; i++) {
    const mid = (free + hit) / 2;
    if (test(mid)) hit = mid;
    else free = mid;
  }
  return free;
}

// Ein Ring steht aufrecht auf der Fläche (Ringachse waagerecht).
export function standOnGround(ring) {
  ring.position.y = 0;
  ring.position.y = -lowestY(body(ring));
}

// Zwei Ringe stehen nebeneinander, einander leicht zugewandt, mit etwas Abstand.
export function poseDuo(a, b, gap = 3.2) {
  const ra = a.userData.prof.ri + a.userData.prof.t, rb = b.userData.prof.ri + b.userData.prof.t;
  a.rotation.y = 0.3;
  b.rotation.y = -0.3;
  const span = ra + rb + gap;
  a.position.set(-span / 2 + (ra - rb) / 2, 0, 0);
  b.position.set(span / 2 + (ra - rb) / 2, 0, 1.2);
  standOnGround(a);
  standOnGround(b);
}

// Ringpaar: Der schmale Ring liegt flach. Der breite Ring steht in seiner Öffnung – er ist größer als
// die Öffnung und ruht mit beiden Kanten auf deren Rand (vier Auflagepunkte, Schwerpunkt dazwischen).
export function posePair(standing, lying) {
  const L = body(lying), S = body(standing);
  lying.rotation.set(0, 0, 0);
  lying.position.set(0, L.prof.hw, 0);
  standing.rotation.set(0, 0, Math.PI / 2);
  const rOut = S.prof.outerR(0);
  const test = (cy) => (standing.position.set(0, cy, 0), collide(L, S));
  const cy = test(rOut) ? bisect(rOut + 2 * L.prof.hw + 4, rOut, test) : rOut;
  standing.position.set(0, cy, 0);
}

// Ringreihe: Der erste Ring liegt flach, jeder weitere liegt mit einer Seite auf seinem Vorgänger.
export function poseCascade(rings, step = 12.5) {
  const bodies = rings.map(body);
  rings.forEach((r, i) => {
    const B = bodies[i];
    const x = (i - (rings.length - 1) / 2) * step;
    const place = (phi) => {
      r.rotation.set(0, r.userData.roll || 0, -phi, "ZYX");
      r.position.set(x, 0, i % 2 ? -1.1 : 0.9);
      r.position.y = -lowestY(B);
    };
    if (i === 0) return place(0);
    const test = (phi) => (place(phi), collide(bodies[i - 1], B) || (i > 1 && collide(bodies[i - 2], B)));
    place(test(0) ? bisect(1.25, 0, test) : 0);
  });
}
