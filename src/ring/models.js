// Die Modelle: Ringschiene mit Besatz, Solitär mit Krappenfassung, Ohrstecker, loser Brillant –
// und die Lage der Stücke zueinander. Nichts durchdringt sich: Wo Ringe aufeinander liegen oder
// ineinander stehen, wird die Lage aus der Berührung berechnet; einzelne Stücke liegen in einer
// stabilen Ruhelage (Schwerpunkt über der Auflagefläche).
import * as THREE from "three";
import { ConvexHull } from "three/examples/jsm/math/ConvexHull.js";
import { METALS, TAU, clamp } from "./data.js";
import { bandProfile, lathe, metalMaterial, metalColor, applyEngraving } from "./band.js";
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

// ---------- Ringschiene mit Besatz ----------
// Lokales System der Schiene: Ringachse = Y. Steine sitzen bei Winkel 270° (zeigt nach dem Aufrichten nach oben).
export function buildRing(cfg, studio, engraving) {
  const o = Object.assign(
    { size: 54, width: 4, thickness: 1.8, profile: "bombiert", metal: "gelbgold", metal2: "weissgold", bicolor: false, finish: "poliert", stones: "ohne", stoneSize: 1, upright: true },
    cfg,
  );
  const ri = o.size / TAU; // Ringgröße = Innenumfang in mm
  const prof = bandProfile({ innerRadius: ri, width: o.width, thickness: o.thickness, profile: o.profile });
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
  for (const p of parts) band.add(new THREE.Mesh(lathe(p.pts), M(o.bicolor && p.k === "b" ? o.metal2 : o.metal, p.k === "s" ? "stripe" : "outer")));

  const innerMat = M(o.metal, "inner");
  if (engraving) applyEngraving(innerMat, engraving);
  band.add(new THREE.Mesh(lathe(innerPts), innerMat));

  const top = 1.5 * Math.PI;
  const rTop = outerR(0);
  const seat = (METALS[o.metal] || METALS.gelbgold).f0;
  const b = brilliant();

  if (o.stones === "solitaer") {
    const dir = new V3(Math.cos(top), 0, Math.sin(top));
    const sm = diamondMaterial(studio.cube, { set: true, seat: (METALS[o.metal2] || METALS[o.metal]).f0 });
    mats.push(sm);
    const h = head({ Rs: 2.6 * o.stoneSize, prongs: 6, mat: M(o.metal2 || o.metal, "setting"), stoneMat: sm });
    h.quaternion.setFromUnitVectors(Z, dir);
    h.position.copy(dir).multiplyScalar(rTop - 0.18);
    band.add(h);
  } else if (o.stones !== "ohne") {
    let Rs = 0;
    let angles = [];
    if (o.stones === "eins") ((Rs = 0.95 * o.stoneSize), (angles = [top]));
    if (o.stones === "drei") {
      Rs = 0.8 * o.stoneSize;
      const d = (Rs * 2.5) / rTop;
      angles = [top - d, top, top + d];
    }
    const memoire = o.stones === "memoire";
    if (memoire) {
      Rs = clamp(o.width * 0.36, 1.1, 1.8) / 2;
      const d = (Rs * 2.16) / rTop;
      const n = Math.floor((Math.PI * 0.95) / d);
      for (let i = 0; i < n; i++) angles.push(top - ((n - 1) / 2) * d + i * d);
    }
    const sm = diamondMaterial(studio.cube, { set: true, seat, bounces: 6 });
    mats.push(sm);
    const stones = new THREE.InstancedMesh(b.geometry, sm, angles.length);
    const settingMat = M(o.metal, "setting");
    // eingeriebene Steine bekommen einen polierten Fassungsrand, Memoire-Steine Körner zwischen den Steinen
    const collars = memoire ? null : new THREE.InstancedMesh(new THREE.TorusGeometry(1.07, 0.085, 14, 72), settingMat, angles.length);
    const beads = memoire ? new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), settingMat, (angles.length + 1) * 2) : null;
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new V3(), p = new V3();
    const sink = Rs * 0.1; // Rundist liegt knapp unter der Oberfläche
    angles.forEach((a, i) => {
      const dir = new V3(Math.cos(a), 0, Math.sin(a));
      q.setFromUnitVectors(Z, dir);
      s.setScalar(Rs);
      p.copy(dir).multiplyScalar(rTop - sink);
      stones.setMatrixAt(i, m4.compose(p, q, s));
      if (collars) {
        p.copy(dir).multiplyScalar(rTop - 0.02);
        collars.setMatrixAt(i, m4.compose(p, q, s));
      }
    });
    if (beads) {
      const d = angles[1] - angles[0];
      const rb = Rs * 0.2, yb = Rs * 0.74;
      let k = 0;
      for (let i = 0; i <= angles.length; i++) {
        const a = angles[0] - d / 2 + i * d;
        for (const sy of [-1, 1]) {
          const r = outerR(sy * yb) + rb * 0.25;
          p.set(Math.cos(a) * r, sy * yb, Math.sin(a) * r);
          s.setScalar(rb);
          beads.setMatrixAt(k++, m4.compose(p, q.identity(), s));
        }
      }
      band.add(beads);
    }
    band.add(stones);
    if (collars) band.add(collars);
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
