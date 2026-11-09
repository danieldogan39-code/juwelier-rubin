// Auflagefläche: Die Stücke liegen auf einer unsichtbaren Fläche. Sichtbar wird sie durch den
// Kontaktschatten – dort, wo ein Stück aufliegt, ist er dunkel und scharf, mit Abstand zur Fläche
// wird er heller und weicher.
import * as THREE from "three";

const BLUR = {
  uniforms: { tDiffuse: { value: null }, dir: { value: new THREE.Vector2(1, 0) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 vUv;
    void main(){
      vec4 s = vec4(0.0);
      s += texture2D(tDiffuse, vUv - 4.0 * dir) * 0.051;
      s += texture2D(tDiffuse, vUv - 3.0 * dir) * 0.0918;
      s += texture2D(tDiffuse, vUv - 2.0 * dir) * 0.12245;
      s += texture2D(tDiffuse, vUv - 1.0 * dir) * 0.1531;
      s += texture2D(tDiffuse, vUv) * 0.1633;
      s += texture2D(tDiffuse, vUv + 1.0 * dir) * 0.1531;
      s += texture2D(tDiffuse, vUv + 2.0 * dir) * 0.12245;
      s += texture2D(tDiffuse, vUv + 3.0 * dir) * 0.0918;
      s += texture2D(tDiffuse, vUv + 4.0 * dir) * 0.051;
      gl_FragColor = s;
    }`,
};

export function createGround(renderer, { res = 1024 } = {}) {
  const group = new THREE.Group();
  const rtA = new THREE.WebGLRenderTarget(res, res, { depthBuffer: true });
  const rtB = new THREE.WebGLRenderTarget(res, res, { depthBuffer: false });
  const rtSoft = new THREE.WebGLRenderTarget(res / 2, res / 2, { depthBuffer: false });
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  cam.rotation.x = Math.PI / 2; // blickt von der Fläche nach oben
  group.add(cam);

  // Höhe über der Fläche -> Deckkraft
  const depthMat = new THREE.ShaderMaterial({
    uniforms: { uHeight: { value: 10 } },
    vertexShader: `varying float vH;
      void main(){
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        vec4 mv = viewMatrix * modelMatrix * p;
        vH = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `uniform float uHeight; varying float vH;
      void main(){ float a = 1.0 - clamp(vH / uHeight, 0.0, 1.0); gl_FragColor = vec4(0.0, 0.0, 0.0, a * a); }`,
    side: THREE.DoubleSide,
  });
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const blurMat = new THREE.ShaderMaterial(BLUR);
  const quad = new THREE.Mesh(quadGeo, blurMat);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quadScene = new THREE.Scene();
  quadScene.add(quad);

  const mk = (tex, opacity) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false, color: 0x000000, side: THREE.DoubleSide }),
    );
    m.rotation.x = -Math.PI / 2;
    m.scale.y = -1; // die Kamera blickt von unten, deshalb gespiegelt
    m.renderOrder = -1;
    group.add(m);
    return m;
  };
  const sharp = mk(rtA.texture, 0.62);
  const soft = mk(rtSoft.texture, 0.5);
  soft.position.y = 0.001;
  sharp.position.y = 0.002;

  const blur = (src, dst, px) => {
    blurMat.uniforms.tDiffuse.value = src.texture;
    blurMat.uniforms.dir.value.set(px / dst.width, 0);
    renderer.setRenderTarget(rtB);
    renderer.render(quadScene, quadCam);
    blurMat.uniforms.tDiffuse.value = rtB.texture;
    blurMat.uniforms.dir.value.set(0, px / dst.height);
    renderer.setRenderTarget(dst);
    renderer.render(quadScene, quadCam);
  };

  return {
    group,
    // scene: die Szene, content: Gruppe der aufliegenden Stücke (Kind von group.parent), size: Kantenlänge der Fläche in mm
    update(scene, size, height = 9) {
      const h = size / 2;
      cam.left = -h; cam.right = h; cam.top = h; cam.bottom = -h;
      cam.near = 0; cam.far = height;
      cam.updateProjectionMatrix();
      sharp.scale.set(size, -size, 1);
      soft.scale.set(size, -size, 1);
      depthMat.uniforms.uHeight.value = height;
      const prevTarget = renderer.getRenderTarget();
      const prevOverride = scene.overrideMaterial, prevBg = scene.background;
      const clear = new THREE.Color();
      renderer.getClearColor(clear);
      const alpha = renderer.getClearAlpha();
      sharp.visible = soft.visible = false;
      scene.overrideMaterial = depthMat;
      scene.background = null;
      renderer.setClearColor(0x000000, 0);
      renderer.setRenderTarget(rtA);
      renderer.clear();
      group.updateMatrixWorld(true);
      renderer.render(scene, cam);
      scene.overrideMaterial = prevOverride;
      scene.background = prevBg;
      // weite, weiche Fassung für den Halbschatten
      blur(rtA, rtSoft, 5.5);
      blur(rtSoft, rtSoft, 4);
      // enge Fassung für den Kernschatten an der Auflage
      blur(rtA, rtA, 1.6);
      renderer.setRenderTarget(prevTarget);
      renderer.setClearColor(clear, alpha);
      sharp.visible = soft.visible = true;
    },
    dispose() {
      rtA.dispose(); rtB.dispose(); rtSoft.dispose();
      depthMat.dispose(); blurMat.dispose(); quadGeo.dispose();
      [sharp, soft].forEach((m) => (m.geometry.dispose(), m.material.dispose()));
    },
  };
}
