// Runder Brillant mit 57 Facetten (Tafel, 8 Stern-, 8 Haupt-, 16 obere Rundist-, 8 Pavillonhaupt- und
// 16 untere Rundistfacetten) und rundem Rundist. Die Form entsteht als Schnitt der Facettenebenen mit
// einem Zylinder vom Radius 1 – genau so wird ein Stein auch geschliffen.
//
// Das Material verfolgt den Lichtweg im Stein: Brechung beim Eintritt (Snellius), Reflexion an jeder
// Facette nach Fresnel einschließlich Totalreflexion, Austritt in die Umgebung – getrennt für Rot, Grün
// und Blau mit dem jeweiligen Brechungsindex. Daraus ergeben sich Brillanz und Feuer von selbst.
import * as THREE from "three";
import { ConvexGeometry } from "three/examples/jsm/geometries/ConvexGeometry.js";
import { BRILLIANT, DIAMOND_IOR, TAU } from "./data.js";

const D2R = Math.PI / 180;
let cache = null;

export function brilliant() {
  if (cache) return cache;
  const P = BRILLIANT;
  const g = P.girdle;
  const tb = Math.tan(P.crown * D2R);
  const tg = Math.tan(P.pavilion * D2R);
  const az = (k, half = 0) => (k * 45 + half * 22.5) * D2R;
  const cyl = (a, r, z) => new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
  const c225 = Math.cos(22.5 * D2R);

  const zTable = g + (1 - P.table) * tb;
  const rStar = P.table * c225 + P.star * (1 - P.table * c225);
  const zStar = g + tb * (1 - rStar * c225);
  const rLow = 1 - P.lower;
  const zLow = -g - tg * (1 - rLow * c225);
  const zCulet = -g - tg;

  const T = [], S = [], L = [], Gu = [], Gh = [], Gl = [], Glh = [];
  for (let k = 0; k < 8; k++) {
    T.push(cyl(az(k), P.table, zTable));
    S.push(cyl(az(k, 1), rStar, zStar));
    L.push(cyl(az(k, 1), rLow, zLow));
    Gu.push(cyl(az(k), 1, g));
    Gh.push(cyl(az(k, 1), 1, g));
    Gl.push(cyl(az(k), 1, -g));
    Glh.push(cyl(az(k, 1), 1, -g));
  }
  const culet = new THREE.Vector3(0, 0, zCulet);
  const inside = new THREE.Vector3(0, 0, -0.2);

  const planes = [];
  const add = (n, w) => planes.push(new THREE.Vector4(n.x, n.y, n.z, w));
  const from3 = (a, b, c) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    let w = n.dot(a);
    if (n.dot(inside) > w) (n.negate(), (w = -w));
    add(n, w);
  };
  add(new THREE.Vector3(0, 0, 1), zTable); // Tafel
  const sb = Math.sin(P.crown * D2R), cb = Math.cos(P.crown * D2R);
  const sg = Math.sin(P.pavilion * D2R), cg = Math.cos(P.pavilion * D2R);
  for (let k = 0; k < 8; k++) {
    const a = az(k), k1 = (k + 1) % 8;
    add(new THREE.Vector3(sb * Math.cos(a), sb * Math.sin(a), cb), sb + g * cb); // Kronenhauptfacette
    from3(T[k], T[k1], S[k]); // Sternfacette
    from3(S[k], Gu[k], Gh[k]); // obere Rundistfacetten
    from3(S[k], Gh[k], Gu[k1]);
    add(new THREE.Vector3(sg * Math.cos(a), sg * Math.sin(a), -cg), sg + g * cg); // Pavillonhauptfacette
    from3(L[k], Gl[k], Glh[k]); // untere Rundistfacetten
    from3(L[k], Glh[k], Gl[k1]);
  }

  // Rundist: Zylinder, oben und unten von den Facetten wellenförmig begrenzt
  const rimTop = (a) => {
    let z = Infinity;
    for (const p of planes) if (p.z > 1e-6) z = Math.min(z, (p.w - p.x * Math.cos(a) - p.y * Math.sin(a)) / p.z);
    return z;
  };
  const rimBottom = (a) => {
    let z = -Infinity;
    for (const p of planes) if (p.z < -1e-6) z = Math.max(z, (p.w - p.x * Math.cos(a) - p.y * Math.sin(a)) / p.z);
    return z;
  };
  const pts = [...T, ...S, ...L, culet];
  const N = 128;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU;
    pts.push(cyl(a, 1, rimTop(a)), cyl(a, 1, rimBottom(a)));
  }
  const geometry = new ConvexGeometry(pts);
  geometry.computeBoundingSphere();
  geometry.userData.shared = true;

  cache = { geometry, planes, zTable, zCulet, girdle: g, crownHeight: zTable - g, depth: zTable - zCulet };
  return cache;
}

// Höhe der Kronenoberfläche über der Rundistebene beim Radius r (für Krappen und Fassungen).
export function crownHeightAt(r) {
  const b = brilliant();
  return Math.min(b.zTable, b.girdle + Math.tan(BRILLIANT.crown * D2R) * (1 - r));
}

const VERT = /* glsl */ `
  varying vec3 vLocal;
  flat varying vec3 vCam;
  flat varying vec3 vW0; flat varying vec3 vW1; flat varying vec3 vW2;
  void main() {
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = modelMatrix * instanceMatrix;
    #endif
    vLocal = position;
    vCam = (inverse(m) * vec4(cameraPosition, 1.0)).xyz;
    vW0 = m[0].xyz; vW1 = m[1].xyz; vW2 = m[2].xyz;
    gl_Position = projectionMatrix * viewMatrix * m * vec4(position, 1.0);
  }`;

const FRAG = /* glsl */ `
  #define NP 57
  #define MAXB 9
  uniform vec4 uPlanes[NP];
  uniform samplerCube envCube;
  uniform vec3 uIor;
  uniform float uExposure;
  uniform float uLeak;      // Anteil des Lichts, das durch den Pavillon hinaus- und wieder hereinkommt (gefasst: wenig)
  uniform vec3 uSeat;       // Farbe der Fassung hinter dem Stein
  uniform int uBounces;
  varying vec3 vLocal;
  flat varying vec3 vCam;
  flat varying vec3 vW0; flat varying vec3 vW1; flat varying vec3 vW2;

  vec3 envWorld(vec3 d) {
    vec3 w = normalize(vW0 * d.x + vW1 * d.y + vW2 * d.z);
    return textureLod(envCube, w, 0.0).rgb;
  }
  // Fresnel für unpolarisiertes Licht an einer Grenzfläche n1 -> n2; 1.0 bedeutet Totalreflexion
  float fresnel(float cosi, float n1, float n2) {
    float e = n1 / n2;
    float s2 = e * e * (1.0 - cosi * cosi);
    if (s2 >= 1.0) return 1.0;
    float cost = sqrt(1.0 - s2);
    float rs = (n1 * cosi - n2 * cost) / (n1 * cosi + n2 * cost);
    float rp = (n2 * cosi - n1 * cost) / (n2 * cosi + n1 * cost);
    return 0.5 * (rs * rs + rp * rp);
  }
  vec3 surfaceNormal(vec3 p) {
    float best = -1e9; vec3 n = vec3(0.0, 0.0, 1.0);
    for (int j = 0; j < NP; j++) {
      float s = dot(uPlanes[j].xyz, p) - uPlanes[j].w;
      if (s > best) { best = s; n = uPlanes[j].xyz; }
    }
    float sc = length(p.xy) - 1.0;
    if (sc > best) n = vec3(normalize(p.xy), 0.0);
    return n;
  }
  // nächste Facette, auf die ein Strahl im Stein trifft
  void hit(vec3 o, vec3 d, out float t, out vec3 n) {
    t = 1e9; n = vec3(0.0, 0.0, 1.0);
    for (int j = 0; j < NP; j++) {
      float dn = dot(uPlanes[j].xyz, d);
      if (dn > 1e-5) {
        float tt = (uPlanes[j].w - dot(uPlanes[j].xyz, o)) / dn;
        if (tt < t) { t = tt; n = uPlanes[j].xyz; }
      }
    }
    float a = dot(d.xy, d.xy);
    if (a > 1e-8) {
      float b = dot(o.xy, d.xy);
      float c = dot(o.xy, o.xy) - 1.0;
      float disc = b * b - a * c;
      if (disc > 0.0) {
        float tc = (-b + sqrt(disc)) / a;
        if (tc < t) { t = tc; n = vec3(normalize(o.xy + d.xy * tc), 0.0); }
      }
    }
    t = max(t, 0.0);
  }
  float trace(vec3 o, vec3 d, float ior, int ch) {
    float thr = 1.0, L = 0.0;
    for (int i = 0; i < MAXB; i++) {
      if (i >= uBounces) break;
      float t; vec3 n; hit(o, d, t, n);
      o += d * t;
      float R = fresnel(dot(d, n), ior, 1.0);
      if (R < 1.0) {
        vec3 od = refract(d, -n, ior);
        float e = envWorld(od)[ch];
        if (o.z < -0.02) e = mix(uSeat[ch] * e * 0.5, e, uLeak);
        L += thr * (1.0 - R) * e;
      }
      thr *= R;
      if (thr < 0.004) break;
      d = reflect(d, n);
      o -= n * 1e-4;
    }
    return L + thr * 0.5 * envWorld(d)[ch];
  }
  void main() {
    vec3 rd = normalize(vLocal - vCam);
    vec3 n = surfaceNormal(vLocal);
    float cosi = clamp(dot(-rd, n), 0.0, 1.0);
    vec3 refl = envWorld(reflect(rd, n));
    vec3 o = vLocal - n * 1e-4;
    vec3 c;
    for (int ch = 0; ch < 3; ch++) {
      float ior = uIor[ch];
      float F = fresnel(cosi, 1.0, ior);
      vec3 d = refract(rd, n, 1.0 / ior);
      c[ch] = F * refl[ch] + (1.0 - F) * trace(o, d, ior, ch);
    }
    gl_FragColor = vec4(c * uExposure, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function diamondMaterial(cube, { set = false, seat = [0.6, 0.6, 0.6], bounces = 7, exposure = 1 } = {}) {
  const b = brilliant();
  return new THREE.ShaderMaterial({
    uniforms: {
      uPlanes: { value: b.planes },
      envCube: { value: cube },
      uIor: { value: new THREE.Vector3(...DIAMOND_IOR) },
      uExposure: { value: exposure },
      uLeak: { value: set ? 0.12 : 1 },
      uSeat: { value: new THREE.Vector3(...seat) },
      uBounces: { value: bounces },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
  });
}
