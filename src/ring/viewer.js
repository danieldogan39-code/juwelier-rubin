// Betrachter: Renderer, Szene, Bedienung. Gerendert wird nur, wenn sich etwas ändert.
import * as THREE from "three";
import { METALS, TAU, clamp } from "./data.js";
import { createStudio } from "./studio.js";
import { createGround } from "./ground.js";
import { engravingCanvas, metalColor } from "./band.js";
import { buildRing, buildStud, buildStone, posePair, poseCascade, poseDuo, standOnGround, restOnGround } from "./models.js";

const V3 = THREE.Vector3;
const FIT = { single: 30, solitaire: 34 };
const GROUNDED = { pair: 1, lineup: 1, studs: 1, stone: 1, duo: 1 };
const TEXT_KEYS = { engraving: 1, engravingItalic: 1, engravingScript: 1 };

// Exakter Schritt einer kritisch gedämpften Feder – unabhängig von der Bildrate.
function spring(s, target, w, dt) {
  const e = Math.exp(-w * dt), d = s.x - target, tmp = (s.v + w * d) * dt;
  s.x = target + (d + tmp) * e;
  s.v = (s.v - w * tmp) * e;
}

export function createRingViewer(canvas, opts = {}) {
  const o = Object.assign({ mode: "single", autoRotate: true, interactive: true, fontFamily: "serif", restPitch: 0, quality: 1 }, opts);
  const coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: !!o.preserve });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0, 0);
  const maxTex = renderer.capabilities.maxTextureSize;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // Schärfe: mindestens zweifach abgetastet, auf hochauflösenden Displays bis dreifach –
  // begrenzt durch ein Pixelbudget und zur Laufzeit an die Leistung des Geräts angepasst.
  const dpr = window.devicePixelRatio || 1;
  const wanted = o.pixelRatio || clamp(Math.max(dpr, 2), 2, 3);
  const budget = (o.pixelBudget || (coarse ? 4.2e6 : 7.5e6)) * o.quality;
  let scale = 1; // dynamische Auflösung (1 = volle Schärfe)
  let ratio = wanted;

  const scene = new THREE.Scene();
  // Umgebung: 512er Würfel am Rechner, 256 auf Mobilgeräten (Speicher); für Standbilder per Option höher
  const studio = createStudio(renderer, o.envSize || (coarse || maxTex < 8192 ? 256 : 512));
  scene.environment = studio.env;
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 600);
  const root = new THREE.Group();
  scene.add(root);
  const stage = new THREE.Group(); // Inhalt, bei aufliegenden Szenen um den Mittelpunkt verschoben
  root.add(stage);
  let ground = null;

  let state = {};
  let items = [];
  const engraved = []; // je Ring: Zeichenfläche und Textur der Innengravur
  let fit = 30;
  let extent = null; // Ausdehnung aufliegender Szenen (Breite beim Drehen, Höhe)
  let rebuildQueued = 0;
  let alive = true;

  function engraving(i = 0, c = state) {
    const e = engraved[i] || (engraved[i] = { canvas: null, tex: null });
    const pair = state.mode === "pair", soli = state.mode === "solitaire";
    e.canvas = engravingCanvas(c.engraving, o.fontFamily, c.engravingItalic, {
      metal: c.metal,
      size: pair ? 64 : soli ? 53 : +c.size || 54,
      width: pair ? 5 : soli ? 2.2 : c.width || 4.5,
      script: c.engravingScript,
      canvas: e.canvas,
    });
    if (!e.tex) {
      e.tex = new THREE.CanvasTexture(e.canvas);
      e.tex.wrapS = THREE.RepeatWrapping;
      e.tex.anisotropy = maxAniso;
      e.tex.colorSpace = THREE.NoColorSpace;
    }
    e.tex.needsUpdate = true;
    return e.tex;
  }

  function clear() {
    for (const it of items) {
      stage.remove(it);
      it.traverse((c) => {
        if (c.geometry && !c.geometry.userData.shared) c.geometry.dispose();
      });
      (it.userData.mats || []).forEach((m) => m.dispose());
    }
    items = [];
  }

  function build() {
    clear();
    const mode = state.mode;
    // Lage und Maße werden in der Grundstellung bestimmt, unabhängig vom aktuellen Blickwinkel
    stage.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);
    if (mode === "pair") {
      const tex = engraving();
      const standing = buildRing({ size: 64, width: 5, thickness: 1.9, profile: "bombiert", metal: state.metal, finish: "poliert", upright: false }, studio, tex);
      const lying = buildRing({ size: 53, width: 3.6, thickness: 1.7, profile: "bombiert", metal: state.metal, finish: "poliert", stones: "memoire", upright: false }, studio, null);
      posePair(standing, lying);
      lying.rotation.y = Math.PI * 0.82; // Steinbesatz zur Kamera
      items = [standing, lying];
    } else if (mode === "lineup") {
      const metals = state.metals || ["platin", "weissgold", "rosegold", "rotgold", "gelbgold"];
      const profile = ["flach", "bombiert", "kante", "bombiert", "bombiert"], width = [4, 4.5, 5, 4, 5], stones = ["ohne", "memoire", "ohne", "eins", "ohne"];
      items = metals.map((m, i) => {
        const r = buildRing({ size: 54, width: width[i], thickness: 1.8, profile: profile[i], metal: m, finish: i === 2 ? "laengsmatt" : "poliert", stones: stones[i], upright: false }, studio, null);
        r.userData.roll = Math.PI * (i % 2 ? 0.9 : 1.15);
        return r;
      });
      poseCascade(items);
    } else if (mode === "studs") {
      const a = buildStud({ metal: state.metal || "weissgold", Rs: 2.6 }, studio);
      const b = buildStud({ metal: state.metal || "weissgold", Rs: 2.6 }, studio);
      restOnGround(a, a.userData.com, new V3(0.75, 0, -0.5));
      restOnGround(b, b.userData.com, new V3(0.75, 0, -0.5));
      a.rotateOnWorldAxis(new V3(0, 1, 0), 0.5);
      b.rotateOnWorldAxis(new V3(0, 1, 0), -2.1);
      a.position.x = -5.2;
      b.position.set(5.4, b.position.y, -2.4);
      items = [a, b];
    } else if (mode === "stone") {
      const s = buildStone({ Rs: state.Rs || 8 }, studio);
      // liegt auf einer Pavillonfacette, die Tafel ist der Kamera zugeneigt
      restOnGround(s, s.userData.com, new V3(0, 0.66, -0.75));
      items = [s];
    } else if (mode === "solitaire") {
      const r = buildRing(
        { size: 53, width: 2.2, thickness: 1.7, profile: "bombiert", metal: state.metal || "gelbgold", metal2: state.metal2 || state.metal || "gelbgold", finish: "poliert", stones: "solitaer", stoneSize: state.stoneSize || 1 },
        studio,
        engraving(),
      );
      r.rotation.set(state.tilt ?? 0.32, 0, 0);
      items = [r];
    } else if (mode === "duo") {
      // zwei frei gestaltete Ringe nebeneinander, in ihren wahren Größen
      const rings = (state.rings || []).slice(0, 2).map((c, i) => buildRing(c, studio, engraving(i, c)));
      if (rings.length === 2) poseDuo(rings[0], rings[1]);
      else rings.forEach(standOnGround);
      items = rings;
    } else {
      const r = buildRing(state, studio, engraving());
      if (state.stand) standOnGround(r); // steht auf der Fläche
      else r.rotation.set(state.tilt ?? 0.42, 0, 0); // schwebt frei (Standbilder)
      items = [r];
    }
    items.forEach((it) => stage.add(it));
    const grounded = !!GROUNDED[mode] || (mode === "single" && !!state.stand);

    if (grounded) {
      const box = new THREE.Box3().setFromObject(stage, true);
      const c = box.getCenter(new V3()), sz = box.getSize(new V3());
      // mit Spiegelung rückt das Stück etwas nach oben, damit darunter Platz für das Spiegelbild bleibt
      const lift = o.reflect ? sz.y * 0.09 : 0;
      stage.position.set(-c.x, -c.y + lift, -c.z);
      extent = { w: Math.hypot(sz.x, sz.z), h: sz.y };
      fit = state.fit || 0;
      if (!ground) ((ground = createGround(renderer, { res: coarse ? 512 : 1024, reflect: !!o.reflect })), root.add(ground.group));
      ground.group.position.set(0, -c.y + lift, 0);
      ground.group.visible = true;
      root.rotation.set(0, 0, 0);
      root.updateMatrixWorld(true);
      ground.update(scene, Math.max(sz.x, sz.z) * 1.9 + 12, Math.min(9, sz.y * 0.6));
      pitchMin = 0.07;
      pitchMax = 1.25;
    } else {
      if (ground) ground.group.visible = false;
      extent = null;
      fit = state.fit || FIT[mode] || 30;
      pitchMin = -0.9;
      pitchMax = 0.9;
    }
    resize();
    dirty = true;
  }

  // ---------- Ansicht und Bewegung ----------
  const yaw = { x: 0.55, v: 0 }, pitch = { x: o.restPitch || 0, v: 0 }, zoom = { x: 1, v: 0 };
  let yawT = null, pitchT = null, zoomT = 1;
  let restPitch = o.restPitch || 0;
  let pitchMin = -0.9, pitchMax = 0.9;
  let auto = o.autoRotate, autoSpeed = 0;
  let dragging = false, lastX = 0, lastY = 0, lastMove = 0;
  let history = [];
  let idleSince = performance.now();
  let dirty = true;
  let dist = 74;
  const fades = [];

  // Gummiband: über die Grenze hinaus folgt die Ansicht immer weniger
  const band = (v) => {
    if (v > pitchMax) return pitchMax + (v - pitchMax) / (1 + (v - pitchMax) * 5);
    if (v < pitchMin) return pitchMin - (pitchMin - v) / (1 + (pitchMin - v) * 5);
    return v;
  };
  let rawPitch = pitch.x;

  if (o.interactive) {
    canvas.style.touchAction = "pan-y";
    canvas.addEventListener("pointerdown", (e) => {
      if (dragging) return;
      wake();
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      history = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
      yaw.v = pitch.v = autoSpeed = 0;
      yawT = pitchT = null;
      rawPitch = pitch.x;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("is-grabbing");
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const now = performance.now();
      yaw.x += (e.clientX - lastX) * 0.009;
      rawPitch += (e.clientY - lastY) * 0.006;
      pitch.x = band(rawPitch);
      lastX = e.clientX;
      lastY = e.clientY;
      history.push({ t: now, x: e.clientX, y: e.clientY });
      while (history.length > 2 && now - history[0].t > 90) history.shift();
      dirty = true;
      idleSince = now;
      wake();
    });
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      const now = performance.now();
      idleSince = now;
      canvas.classList.remove("is-grabbing");
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
      // Schwung übernehmen: Geschwindigkeit des Zeigers in den letzten 90 ms
      const a = history[0], b = history[history.length - 1];
      const dt = (b.t - a.t) / 1000;
      if (dt > 0.012 && now - b.t < 70) {
        yaw.v = clamp(((b.x - a.x) * 0.009) / dt, -14, 14);
        pitch.v = clamp(((b.y - a.y) * 0.006) / dt, -6, 6);
      }
      wake();
    };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("keydown", (e) => {
      const k = e.key;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) return;
      e.preventDefault();
      // Tastatur: ohne Animation, direkt
      if (k === "ArrowLeft") yaw.x -= 0.18;
      if (k === "ArrowRight") yaw.x += 0.18;
      if (k === "ArrowUp") pitch.x = clamp(pitch.x - 0.12, pitchMin, pitchMax);
      if (k === "ArrowDown") pitch.x = clamp(pitch.x + 0.12, pitchMin, pitchMax);
      yaw.v = pitch.v = autoSpeed = 0;
      yawT = pitchT = null;
      dirty = true;
      idleSince = performance.now();
      wake();
    });
  }

  function place() {
    const t = state.target || [0, 0, 0];
    camera.position.set(t[0], t[1], t[2] + dist / zoom.x);
    camera.lookAt(t[0], t[1], t[2]);
    camera.updateProjectionMatrix();
  }
  function resize() {
    const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
    if (!w || !h) return;
    ratio = Math.max(1, Math.min(wanted, Math.sqrt(budget / (w * h)))) * scale;
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    if (ground) ground.resize(w * ratio * (coarse ? 0.5 : 0.75), h * ratio * (coarse ? 0.5 : 0.75));
    camera.aspect = w / h;
    // Bildausschnitt: frei schwebende Stücke nach festem Maß, aufliegende Szenen nach ihrer Ausdehnung
    const need = extent && !fit ? Math.max((extent.h + extent.w * 0.3) * 1.08, (extent.w * 1.08) / camera.aspect) : fit / Math.min(1, camera.aspect);
    dist = need / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    place();
    dirty = true;
  }
  const ro = new ResizeObserver(() => (resize(), wake()));
  ro.observe(canvas);
  let visible = true;
  const io = new IntersectionObserver((e) => ((visible = e[0].isIntersecting), visible && wake()), { threshold: 0.01 });
  io.observe(canvas);
  const onVis = () => document.hidden || wake();
  document.addEventListener("visibilitychange", onVis);

  function draw() {
    root.rotation.set(pitch.x, yaw.x, 0);
    renderer.render(scene, camera);
    dirty = false;
  }

  let raf = 0, last = performance.now(), idleTimer = 0;
  let slow = 0, fast = 0;
  function tick(now) {
    raf = 0;
    if (!alive || !visible || document.hidden) return;
    const ms = now - last;
    const dt = Math.min(0.05, ms / 1000);
    last = now;
    let moving = false;
    const idle = now - idleSince > 2200;

    if (!dragging) {
      // Drehung um die Hochachse: Ziel anfahren, sonst Schwung ausrollen lassen, sonst ruhig weiterdrehen
      if (yawT !== null) {
        spring(yaw, yawT, 6.5, dt);
        if (Math.abs(yawT - yaw.x) < 0.0015 && Math.abs(yaw.v) < 0.01) ((yaw.x = yawT), (yaw.v = 0), (yawT = null));
        moving = true;
      } else if (Math.abs(yaw.v) > 0.004) {
        yaw.x += yaw.v * dt;
        yaw.v *= Math.exp(-dt / 0.42); // Reibung
        moving = true;
      } else if (auto && !reduced && idle) {
        autoSpeed += (0.22 - autoSpeed) * (1 - Math.exp(-dt / 0.9)); // sanft anlaufen
        yaw.x += autoSpeed * dt;
        moving = true;
      }
      // Neigung: Ziel, Schwung, und an den Grenzen federt die Ansicht zurück
      const out = pitch.x > pitchMax || pitch.x < pitchMin;
      if (pitchT !== null) {
        spring(pitch, pitchT, 6.5, dt);
        if (Math.abs(pitchT - pitch.x) < 0.0015 && Math.abs(pitch.v) < 0.01) ((pitch.x = pitchT), (pitch.v = 0), (pitchT = null));
        moving = true;
      } else if (out) {
        spring(pitch, clamp(pitch.x, pitchMin, pitchMax), 9, dt);
        moving = true;
      } else if (Math.abs(pitch.v) > 0.004) {
        pitch.x += pitch.v * dt;
        pitch.v *= Math.exp(-dt / 0.3);
        moving = true;
      } else if (auto && !reduced && idle && Math.abs(restPitch - pitch.x) > 0.002) {
        spring(pitch, restPitch, 1.6, dt);
        moving = true;
      }
      if (Math.abs(zoomT - zoom.x) > 0.0006 || Math.abs(zoom.v) > 0.002) {
        spring(zoom, zoomT, 6, dt);
        place();
        moving = true;
      }
    }
    for (let i = fades.length - 1; i >= 0; i--) {
      const f = fades[i], t = reduced ? 1 : clamp((now - f.t0) / f.d, 0, 1), k = 1 - Math.pow(1 - t, 3);
      f.mat.color.copy(f.from).lerp(f.to, k);
      moving = true;
      if (t >= 1) fades.splice(i, 1);
    }
    if (dirty || moving) draw();

    // Auflösung an die Leistung anpassen, damit die Bewegung flüssig bleibt
    if (moving && ms < 120) {
      if (ms > 24) ((slow += 1), (fast = 0));
      else if (ms < 13) ((fast += 1), (slow = Math.max(0, slow - 1)));
      if (slow > 24 && scale > 0.6) ((scale = Math.max(0.6, scale * 0.85)), (slow = 0), resize());
      if (fast > 240 && scale < 1) ((scale = Math.min(1, scale / 0.9)), (fast = 0), resize());
    }
    if (moving || dragging) raf = requestAnimationFrame(tick);
    else if (auto && !reduced) (clearTimeout(idleTimer), (idleTimer = setTimeout(wake, Math.max(60, 2250 - (now - idleSince)))));
  }
  function wake() {
    if (raf || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function fadeMetal(metal) {
    for (const it of items)
      for (const m of it.userData.mats || [])
        if (m.isMeshPhysicalMaterial) {
          fades.push({ mat: m, from: m.color.clone(), to: metalColor(metal, m.userData.part), t0: performance.now(), d: 650 });
          m.userData.metal = metal;
        } else if (m.uniforms && m.uniforms.uSeat) m.uniforms.uSeat.value.set(...(METALS[metal] || METALS.gelbgold).f0);
  }
  const nearest = (a) => Math.round(yaw.x / TAU) * TAU + a;

  const api = {
    set(patch) {
      const prev = state;
      state = Object.assign({}, state, patch);
      const changed = Object.keys(patch).filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(state[k]));
      if (!changed.length) return;
      if (state.mode !== "pair" && state.mode !== "duo" && changed.every((k) => TEXT_KEYS[k])) {
        engraving();
        dirty = true;
        wake();
        return;
      }
      if (changed.length === 1 && changed[0] === "metal" && !state.bicolor && items.length && !rebuildQueued && (state.mode === "single" || state.mode === "pair")) {
        fadeMetal(state.metal);
        if (engraved[0]) engraving(); // Stempel passt sich der Legierung an
        wake();
        return;
      }
      if (!rebuildQueued)
        rebuildQueued = requestAnimationFrame(() => {
          rebuildQueued = 0;
          build();
          wake();
        });
    },
    frame({ yaw: y, pitch: p, zoom: z, auto: a } = {}) {
      if (typeof y === "number") reduced ? (yaw.x = nearest(y)) : (yawT = nearest(y));
      if (typeof p === "number") {
        const pp = clamp(p, pitchMin, pitchMax);
        reduced ? (pitch.x = pp) : (pitchT = pp);
        restPitch = pp;
      }
      if (typeof z === "number") ((zoomT = z), reduced && ((zoom.x = z), place()));
      if (typeof a === "boolean") ((auto = a && o.autoRotate), a && (idleSince = performance.now() - 2200));
      dirty = true;
      wake();
    },
    showInside() {
      api.view("inside");
    },
    // feste Blickwinkel: vorn, Profil (Blick auf die Kante), innen (Gravur), oben (Steinbesatz)
    view(name) {
      const g = pitchMin > 0; // steht auf der Fläche
      const v = { front: [0.35, g ? 0.2 : 0.18, 1], side: [Math.PI / 2, g ? 0.12 : 0.05, 1.08], inside: [0, g ? 1.02 : 0.62, g ? 1.06 : 1], top: [0.42, g ? 1.2 : 0.85, 1.12] }[name];
      if (!v) return;
      const [y, p, z] = v;
      if (reduced) ((yaw.x = nearest(y)), (pitch.x = clamp(p, pitchMin, pitchMax)), (zoom.x = zoomT = z), place());
      else ((yawT = nearest(y)), (pitchT = clamp(p, pitchMin, pitchMax)), (zoomT = z));
      yaw.v = pitch.v = 0;
      restPitch = clamp(p, pitchMin, pitchMax);
      idleSince = performance.now() + (name === "front" ? 0 : 6000); // bei einem gewählten Blickwinkel erst später weiterdrehen
      dirty = true;
      wake();
    },
    reset() {
      api.view("front");
      restPitch = clamp(o.restPitch || restPitch, pitchMin, pitchMax);
    },
    renderNow() {
      draw();
    },
    setView(y, p, z) {
      yaw.x = y;
      pitch.x = clamp(p, pitchMin, pitchMax);
      yaw.v = pitch.v = 0;
      if (typeof z === "number") ((zoom.x = zoomT = z), (zoom.v = 0), place());
      dirty = true;
      wake();
    },
    setTime() {},
    glints() {},
    info: () => ({ ratio, scale, fit, extent, width: renderer.domElement.width, height: renderer.domElement.height }),
    dispose() {
      alive = false;
      clearTimeout(idleTimer);
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      clear();
      engraved.forEach((e) => e && e.tex && e.tex.dispose());
      ground && ground.dispose();
      studio.dispose();
      renderer.dispose();
    },
    renderer,
  };

  state = Object.assign(
    { mode: o.mode, size: 54, width: 4.5, thickness: 1.8, profile: "bombiert", metal: "gelbgold", metal2: "weissgold", bicolor: false, finish: "poliert", stones: "eins", stoneSize: 1, engraving: "", engravingItalic: true },
    o.state || {},
  );
  if (GROUNDED[state.mode] || state.stand) ((pitch.x = Math.max(o.restPitch || 0.3, 0.07)), (restPitch = pitch.x));
  build();
  wake();
  (async () => {
    try {
      renderer.compileAsync ? await renderer.compileAsync(scene, camera) : renderer.compile(scene, camera);
    } catch {}
    if (!alive) return;
    draw();
    typeof o.onReady === "function" && o.onReady();
  })();
  return api;
}
