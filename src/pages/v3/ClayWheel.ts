import * as THREE from 'three';

// A thrown cup on a wheel. The profile is rebuilt every frame from:
//   stage (0..3 across four shapes, 3..4 = firing) and pointer "presses" that groove the clay.

type Shape = {h: number; open: number; wall: number; floor: number; r: (t: number) => number};

const N = 60; // samples up the wall
const SEGMENTS = 120;
const POINTS = 2 * (N + 1) + 2;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const SHAPES: Shape[] = [
  // centred lump
  {h: 0.92, open: 0, wall: 0.12, floor: 0.2, r: (t) => 1.12 * Math.pow(Math.max(0, 1 - t * t), 0.5) + 0.03},
  // coned up
  {
    h: 2.1,
    open: 0,
    wall: 0.12,
    floor: 0.2,
    r: (t) => 0.82 - 0.56 * Math.pow(t, 1.1) + 0.14 * Math.pow(Math.max(0, 1 - t * 7), 2),
  },
  // opened and pulled
  {
    h: 1.6,
    open: 1,
    wall: 0.13,
    floor: 0.22,
    r: (t) => 0.74 + 0.06 * t + 0.12 * Math.pow(Math.max(0, 1 - t * 6), 2),
  },
  // espresso cup: narrow foot, full belly, lip turned slightly in
  {
    h: 1.24,
    open: 1,
    wall: 0.07,
    floor: 0.2,
    r: (t) =>
      0.4 +
      0.34 * smooth(0.02, 0.32, t) +
      0.08 * Math.sin(Math.PI * clamp((t - 0.12) / 0.88, 0, 1)) -
      0.07 * smooth(0.72, 1, t),
  },
];

const WET = new THREE.Color('#8c5a42');
const FIRED = new THREE.Color('#ebe3d4');
const INK = new THREE.Color('#1d1d1a');
const KILN = new THREE.Color('#d8743c');
const BAND_T = 0.3;

function clayTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#808080';
  g.fillRect(0, 0, c.width, c.height);
  // throwing rings: horizontal ridges of uneven pitch (v runs up the wall)
  let y = 0;
  while (y < c.height) {
    const pitch = 5 + Math.random() * 9;
    const tone = 110 + Math.random() * 60;
    g.fillStyle = `rgb(${tone},${tone},${tone})`;
    g.fillRect(0, y, c.width, pitch * 0.45);
    y += pitch;
  }
  // grog and speckle so the spin reads
  for (let i = 0; i < 9000; i++) {
    const v = Math.random() < 0.5 ? 60 : 200;
    g.fillStyle = `rgba(${v},${v},${v},${0.25 + Math.random() * 0.4})`;
    const s = Math.random() * 2.2 + 0.6;
    g.fillRect(Math.random() * c.width, Math.random() * c.height, s, s);
  }
  // a few slip streaks dragged by the fingers
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * c.width;
    g.fillStyle = `rgba(230,230,230,${0.08 + Math.random() * 0.12})`;
    g.fillRect(x, 0, 2 + Math.random() * 10, c.height);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

export class ClayWheel {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  private clay: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  private band: THREE.Mesh<THREE.TorusGeometry, THREE.MeshStandardMaterial>;
  private wheel = new THREE.Group();
  private spinner = new THREE.Group();
  private profile = new Float32Array(POINTS * 2);
  private normals2 = new Float32Array(POINTS * 2);
  private dent = new Float32Array(N + 1);
  private press: {t: number; strength: number} | null = null;
  private raf = 0;
  private last = 0;
  private visible = true;
  private stageTarget = 0;
  private stage = 0;
  private reduced: boolean;
  private currentH = 1;
  private currentR = SHAPES[0]!.r;
  private bandArc = -1;
  private narrow = false;
  private observer: IntersectionObserver;
  private resizeObserver: ResizeObserver;

  private host: HTMLElement;

  constructor(host: HTMLElement) {
    this.host = host;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(this.renderer.domElement);

    // light: warm window key from upper left, cool fill, soft sky
    this.scene.add(new THREE.HemisphereLight('#fff6e8', '#b9a58c', 1.1));
    const key = new THREE.DirectionalLight('#fff1dc', 2.6);
    key.position.set(-4, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 6;
    key.shadow.camera.left = key.shadow.camera.bottom = -3;
    key.shadow.camera.right = key.shadow.camera.top = 3;
    this.scene.add(key);
    const rim = new THREE.DirectionalLight('#dfe7ff', 0.7);
    rim.position.set(5, 3, -4);
    this.scene.add(rim);

    // wheel: splash pan, head, clay
    const pan = new THREE.Mesh(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.001, -0.42),
          new THREE.Vector2(2.35, -0.42),
          new THREE.Vector2(2.55, -0.05),
          new THREE.Vector2(2.6, 0.02),
          new THREE.Vector2(2.48, 0.02),
          new THREE.Vector2(2.42, -0.3),
          new THREE.Vector2(0.001, -0.3),
        ],
        96,
      ),
      new THREE.MeshStandardMaterial({color: '#d9cfbe', roughness: 0.85}),
    );
    pan.receiveShadow = true;
    pan.scale.set(0.84, 1, 0.84);
    this.wheel.add(pan);

    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(1.7, 1.7, 0.1, 96),
      new THREE.MeshStandardMaterial({color: '#6c6257', roughness: 0.55, metalness: 0.25}),
    );
    head.position.y = -0.05;
    head.receiveShadow = true;
    this.spinner.add(head);
    // slip rings on the head make the rotation visible
    for (const [r, o] of [
      [1.52, 0.35],
      [1.18, 0.22],
    ] as const) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(r, r + 0.035, 96, 1, 0, Math.PI * 1.35),
        new THREE.MeshBasicMaterial({color: '#b19a82', transparent: true, opacity: o}),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.002;
      this.spinner.add(ring);
    }

    const tex = clayTexture();
    const geo = new THREE.LatheGeometry(
      Array.from({length: POINTS}, (_, i) => new THREE.Vector2(0.5, i / POINTS)),
      SEGMENTS,
    );
    this.clay = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: WET.clone(),
        map: tex,
        bumpMap: tex,
        bumpScale: 1.4,
        roughness: 0.38,
        metalness: 0,
      }),
    );
    this.clay.castShadow = true;
    this.clay.receiveShadow = true;
    this.spinner.add(this.clay);

    this.band = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.024, 8, 160, 0.0001),
      new THREE.MeshStandardMaterial({color: INK, roughness: 0.4, transparent: true, opacity: 0}),
    );
    this.band.rotation.x = Math.PI / 2;
    this.spinner.add(this.band);

    this.wheel.add(this.spinner);
    this.scene.add(this.wheel);

    this.updateProfile();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = Boolean(entry?.isIntersecting);
    });
    this.observer.observe(host);

    const el = this.renderer.domElement;
    el.addEventListener('pointermove', this.onPointer);
    el.addEventListener('pointerdown', this.onPointer);
    el.addEventListener('pointerleave', this.onLeave);
    el.addEventListener('pointercancel', this.onLeave);

    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  /** 0 lump · 1 cone · 2 opened · 3 cup · 4 fired */
  setStage(stage: number) {
    this.stageTarget = clamp(stage, 0, 4);
    if (this.reduced) this.stage = this.stageTarget;
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.resizeObserver.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointermove', this.onPointer);
    el.removeEventListener('pointerdown', this.onPointer);
    el.removeEventListener('pointerleave', this.onLeave);
    el.removeEventListener('pointercancel', this.onLeave);
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material as THREE.Material & {map?: THREE.Texture | null};
        m.map?.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
    el.remove();
  }

  private onLeave = () => {
    this.press = null;
  };

  private onPointer = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const project = (x: number, y: number) => {
      const v = new THREE.Vector3(x, y, 0).project(this.camera);
      return {x: ((v.x + 1) / 2) * rect.width, y: ((1 - v.y) / 2) * rect.height};
    };
    const base = project(0, 0);
    const top = project(0, this.currentH);
    const t = (base.y - py) / (base.y - top.y);
    if (t < 0 || t > 1.05) {
      this.press = null;
      return;
    }
    const edge = project(this.currentR(clamp(t, 0, 1)), this.currentH * t);
    const halfWidth = Math.abs(edge.x - base.x);
    const d = Math.abs(px - base.x) / Math.max(halfWidth, 1);
    this.press = d < 1.25 ? {t: clamp(t, 0.04, 0.96), strength: clamp(1.35 - d, 0.25, 1)} : null;
  };

  private resize() {
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // frame the pan whatever the aspect
    const narrow = w / h < 0.9;
    this.narrow = narrow;
    this.camera.fov = narrow ? 30 : 24;
    this.camera.position.set(0, narrow ? 4.2 : 4.4, narrow ? 10.2 : 12);
    this.camera.lookAt(0, narrow ? 0.55 : 0.75, 0);
    this.camera.updateProjectionMatrix();
  }

  private tick = (now: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    if (!this.visible) return;

    this.stage += (this.stageTarget - this.stage) * (1 - Math.exp(-dt * 3.2));
    if (Math.abs(this.stageTarget - this.stage) < 0.0005) this.stage = this.stageTarget;

    // grooves: pressing digs in quickly, clay recovers slowly
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const target = this.press
        ? this.press.strength * Math.exp(-Math.pow((t - this.press.t) / 0.06, 2))
        : 0;
      const rate = target > this.dent[i]! ? 9 : 0.55;
      this.dent[i]! += (target - this.dent[i]!) * (1 - Math.exp(-dt * rate));
    }

    const fired = clamp(this.stage - 3, 0, 1);
    const speed = this.reduced ? 0 : THREE.MathUtils.lerp(7.5, 0.35, smooth(0.1, 1, fired));
    this.spinner.rotation.y += dt * speed;

    const mat = this.clay.material;
    mat.color.copy(WET).lerp(FIRED, smooth(0.3, 0.8, fired));
    // kiln: glows hot through the middle of the firing, then cools
    const heat = Math.sin(Math.PI * smooth(0.02, 0.62, fired));
    mat.emissive.copy(KILN);
    mat.emissiveIntensity = 0.55 * heat;
    mat.roughness = THREE.MathUtils.lerp(0.38, 0.62, fired);
    mat.bumpScale = THREE.MathUtils.lerp(1.4, 0.5, fired);

    // ink band draws itself round the cup once it has cooled
    const arc = smooth(0.62, 0.98, fired) * Math.PI * 2;
    if (Math.abs(arc - this.bandArc) > 0.02) {
      this.bandArc = arc;
      this.band.geometry.dispose();
      this.band.geometry = new THREE.TorusGeometry(1, 0.024, 8, 160, Math.max(arc, 0.0001));
    }
    this.band.material.opacity = arc > 0.01 ? 1 : 0;

    // lean in for the finished cup
    const lean = smooth(0.4, 1, fired);
    const baseZ = this.narrow ? 10.2 : 12;
    const baseY = this.narrow ? 4.2 : 4.4;
    this.camera.position.z = baseZ - lean * (this.narrow ? 1.4 : 2.2);
    this.camera.position.y = baseY - lean * 0.7;
    this.camera.lookAt(0, (this.narrow ? 0.55 : 0.75) - lean * 0.12, 0);

    this.updateProfile();
    this.renderer.render(this.scene, this.camera);
  };

  private updateProfile() {
    const s = clamp(this.stage, 0, 3);
    const i0 = Math.min(Math.floor(s), 2);
    const k = ease(clamp(s - i0, 0, 1));
    const a = SHAPES[i0]!;
    const b = SHAPES[Math.min(i0 + 1, 3)]!;
    const lerp = (x: number, y: number) => x + (y - x) * k;
    const h = lerp(a.h, b.h);
    const open = lerp(a.open, b.open);
    const wall = lerp(a.wall, b.wall);
    const floorY = h - open * (h - lerp(a.floor, b.floor));
    const R = (t: number) => lerp(a.r(t), b.r(t));
    this.currentH = h;
    this.currentR = R;

    const p = this.profile;
    let j = 0;
    const push = (x: number, y: number) => {
      p[j++] = Math.max(x, 0.0005);
      p[j++] = y;
    };
    push(0, 0);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      push(R(t) * (1 - 0.2 * this.dent[i]!), t * h);
    }
    for (let i = N; i >= 0; i--) {
      const t = i / N;
      const inner = (R(t) - wall) * (1 - 0.2 * this.dent[i]!);
      push(inner * open, floorY + (h - floorY) * t);
    }
    push(0, floorY);

    // 2D normals from neighbours, then revolve (same scheme as LatheGeometry)
    const n = this.normals2;
    for (let i = 0; i < POINTS; i++) {
      const prev = Math.max(i - 1, 0);
      const next = Math.min(i + 1, POINTS - 1);
      const dx = p[next * 2]! - p[prev * 2]!;
      const dy = p[next * 2 + 1]! - p[prev * 2 + 1]!;
      const len = Math.hypot(dx, dy) || 1;
      n[i * 2] = dy / len;
      n[i * 2 + 1] = -dx / len;
    }

    const pos = this.clay.geometry.attributes.position as THREE.BufferAttribute;
    const nor = this.clay.geometry.attributes.normal as THREE.BufferAttribute;
    let v = 0;
    for (let seg = 0; seg <= SEGMENTS; seg++) {
      const phi = (seg / SEGMENTS) * Math.PI * 2;
      const sin = Math.sin(phi);
      const cos = Math.cos(phi);
      for (let i = 0; i < POINTS; i++) {
        const x = p[i * 2]!;
        pos.setXYZ(v, x * sin, p[i * 2 + 1]!, x * cos);
        nor.setXYZ(v, n[i * 2]! * sin, n[i * 2 + 1]!, n[i * 2]! * cos);
        v++;
      }
    }
    pos.needsUpdate = true;
    nor.needsUpdate = true;
    this.clay.geometry.computeBoundingSphere();

    // ink band sits a third of the way up the finished cup
    const bt = BAND_T;
    this.band.scale.setScalar(R(bt) * (1 - 0.2 * this.dent[Math.round(bt * N)]!) + 0.004);
    this.band.position.y = bt * h;
  }
}
