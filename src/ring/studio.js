// Lichtstudio: eine HDR-Umgebung wie beim Juwelierfotografen – große Softboxen, schwarze
// Abschatter für Kontrast im Metall und kleine Punktstrahler, die Brillanten zum Funkeln bringen.
// Metall und Steine sehen dieselbe Umgebung.
import * as THREE from "three";
import { rng, TAU } from "./data.js";

function softboxTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 128, 128);
  // leichter Helligkeitsabfall zum Rand, wie bei einem echten Diffusor
  const edge = (x0, y0, x1, y1) => {
    const lg = g.createLinearGradient(x0, y0, x1, y1);
    lg.addColorStop(0, "rgba(0,0,0,0.34)");
    lg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = lg;
    g.fillRect(0, 0, 128, 128);
  };
  edge(0, 0, 26, 0);
  edge(128, 0, 102, 0);
  edge(0, 0, 0, 26);
  edge(0, 128, 0, 102);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

function featherTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const rg = g.createRadialGradient(64, 64, 14, 64, 64, 64);
  rg.addColorStop(0, "#fff");
  rg.addColorStop(1, "#000");
  g.fillStyle = rg;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export function createStudio(renderer, size = 1024) {
  const scene = new THREE.Scene();
  const disposables = [];
  const keep = (o) => (disposables.push(o), o);

  // Raum: oben hell, unten dunkel (dunkler Tisch) – das gibt den Ringen eine dunkle Unterseite.
  const room = keep(new THREE.SphereGeometry(100, 64, 32));
  const col = [];
  const pos = room.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 100;
    const v = y > 0 ? 0.52 + 0.62 * y : 0.52 + 0.4 * y;
    col.push(v, v * 0.985, v * 0.965);
  }
  room.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(room, keep(new THREE.MeshBasicMaterial({ side: THREE.BackSide, vertexColors: true }))));

  const soft = keep(softboxTexture());
  const panel = (w, h, x, y, z, power, tint = [1, 1, 1], textured = true, round = false) => {
    const mat = keep(
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * power, tint[1] * power, tint[2] * power), side: THREE.DoubleSide, map: textured ? soft : null }),
    );
    const m = new THREE.Mesh(keep(round ? new THREE.CircleGeometry(w / 2, 32) : new THREE.PlaneGeometry(w, h)), mat);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    scene.add(m);
  };
  // Abschatter: dunkle Flächen mit weichem Rand, die der Politur Tiefe geben
  const feather = keep(featherTexture());
  const flag = (w, h, x, y, z, level) => {
    const mat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(level, level, level), alphaMap: feather, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(w, h)), mat);
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    m.renderOrder = 1;
    scene.add(m);
  };
  // Softboxen
  panel(96, 44, 0, 80, 6, 3.6); // Hauptlicht von oben
  panel(17, 112, -78, 10, 12, 4.4); // Streiflicht links
  panel(16, 108, 75, 6, -28, 3.7); // Streiflicht rechts
  panel(64, 18, 0, 24, -84, 2.5, [1, 0.93, 0.82]); // warmes Gegenlicht
  panel(40, 12, 22, -34, 76, 0.9, [1, 0.96, 0.9]); // Aufheller von vorn unten
  flag(60, 150, -41, 0, -82, 0.05);
  flag(52, 150, 52, 0, 64, 0.06);
  flag(190, 46, 0, -17, 86, 0.06);
  flag(170, 40, 0, -44, -70, 0.05);
  // Punktstrahler wie an der Decke eines Juweliergeschäfts
  const r = rng(42);
  const spot = (power, sz, tint) => {
    const u = r() * 0.9 + 0.08;
    const a = r() * TAU;
    const w = Math.sqrt(1 - u * u);
    panel(sz, sz, w * Math.cos(a) * 84, u * 84, w * Math.sin(a) * 84, power, tint, false, true);
  };
  for (let i = 0; i < 22; i++) {
    const k = r();
    spot(14 + r() * 26, 2.2 + r() * 2.6, k < 0.2 ? [1, 0.92, 0.8] : k < 0.34 ? [0.88, 0.94, 1] : [1, 1, 1]);
  }
  panel(5.5, 5.5, 44, 48, 52, 26, [1, 1, 1], false, true);
  panel(4.5, 4.5, -46, 34, 58, 20, [1, 0.97, 0.92], false, true);
  panel(4, 4, 10, 60, 70, 22, [1, 1, 1], false, true);

  const cubeRT = new THREE.WebGLCubeRenderTarget(size, {
    type: THREE.HalfFloatType,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  });
  const cam = new THREE.CubeCamera(0.1, 300, cubeRT);
  const tm = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;
  cam.update(renderer, scene);
  renderer.toneMapping = tm;

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromCubemap(cubeRT.texture);
  pmrem.dispose();
  disposables.forEach((d) => d.dispose());

  return {
    env: env.texture,
    cube: cubeRT.texture,
    dispose() {
      env.dispose();
      cubeRT.dispose();
    },
  };
}
