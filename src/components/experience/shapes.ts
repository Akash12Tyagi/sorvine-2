import * as THREE from "three";

export type ShapeSet = {
  count: number;
  /** vec4 attributes (xyz + weight), one per stage in STAGE order */
  stages: THREE.BufferAttribute[];
  random: THREE.BufferAttribute;
};

/**
 * Stages, in timeline order. Hero, intent, palm and brain come from the design reference
 * (scripts/particles/generate.py); rings and the data field are built here.
 */
export const STAGE = { hero: 0, intent: 1, palm: 2, rings: 3, brain: 4, field: 5, heroAgain: 6 } as const;
/** Shader "kind" per stage: 0 static, 1 parted hands, 2 rings (orbit), 3 wave field. */
export const STAGE_KIND = [0, 1, 0, 2, 0, 3, 0];
/** Point size per stage: the intent hands are closer to the camera, so their dots are larger. */
export const STAGE_SIZE = [1, 1.25, 1, 1, 0.95, 1, 1];

/** Geometry measured from the reference frames (world units, camera at z = 10, fov 35°). */
export const CORE = {
  heroSpark: { x: -0.128, y: -1.203 },
  learn: { x: 0.048, y: 1.0, r: 0.695 },
  reason: { x: -0.006, y: -0.086, r: 0.78 },
  /** the rings sit a touch above the core's centre in the reference */
  rings: { x: -0.012, y: 0.006 },
  act: { x: 0, y: 0, r: 0.49 },
  /** where the spark's glow settles behind the intent copy */
  intentHaze: { x: 0, y: 0.47 },
  /** ring radii (in units of the Reason core radius) and the tilt of the ring plane */
  ringRadii: [0.88, 1.12, 1.4, 1.71, 2.11, 2.59],
  ringTilt: 0.232,
};

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussFactory(rand: () => number) {
  return () => {
    let u = 0;
    let v = 0;
    while (u === 0) u = rand();
    while (v === 0) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

function decode(buf: ArrayBuffer, count: number) {
  const view = new DataView(buf);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== "PTS2") throw new Error("Unexpected particle file");
  const total = view.getUint32(4, true);
  const shapes = view.getUint32(8, true);
  const range = view.getFloat32(12, true);
  const n = Math.min(count, total);
  const out: Float32Array[] = [];
  const k = range / 32767;
  for (let s = 0; s < shapes; s++) {
    const base = 16 + s * total * 7;
    const xyz = new Int16Array(buf, base, total * 3);
    const w = new Uint8Array(buf, base + total * 6, total);
    const arr = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      arr[i * 4] = xyz[i * 3] * k;
      arr[i * 4 + 1] = xyz[i * 3 + 1] * k;
      arr[i * 4 + 2] = xyz[i * 3 + 2] * k;
      arr[i * 4 + 3] = w[i] / 255;
    }
    out.push(arr);
  }
  return { n, out };
}

/**
 * Saturn-style rings around the core, in the ring plane (y up, centred on the core):
 * crisp rings, a soft outer disc of dust, a few strays and hidden points on the core.
 */
function buildRings(n: number) {
  const rand = mulberry32(7);
  const gauss = gaussFactory(rand);
  const arr = new Float32Array(n * 4);
  const R = CORE.reason.r;
  const radii = CORE.ringRadii.map((r) => r * R);
  const total = radii.reduce((a, b) => a + b, 0);
  for (let i = 0; i < n; i++) {
    const u = rand();
    const a = rand() * Math.PI * 2;
    let r = 0;
    let y = 0;
    let w = 1;
    if (u < 0.5) {
      // crisp rings, density proportional to circumference
      let pick = rand() * total;
      r = radii[radii.length - 1];
      for (const rr of radii) {
        if (pick < rr) {
          r = rr;
          break;
        }
        pick -= rr;
      }
      r += gauss() * 0.009;
      y = gauss() * 0.007;
      w = 0.85 + rand() * 0.15;
    } else if (u < 0.86) {
      // soft outer disc fading out to ~3 core radii past the last ring
      const t = Math.pow(rand(), 1.15);
      r = (2.35 + t * 2.6) * R;
      y = gauss() * (0.015 + t * 0.06);
      w = (0.78 - t * 0.6) * (0.6 + rand() * 0.5);
    } else if (u < 0.9) {
      r = Math.sqrt(rand()) * 4 * R;
      y = gauss() * 0.22;
      w = 0.12;
    } else {
      // hidden on the core surface: particles fade in and out through the sphere
      const zz = rand() * 2 - 1;
      const s = Math.sqrt(1 - zz * zz);
      arr.set([Math.cos(a) * s * R, zz * R, Math.sin(a) * s * R, 0], i * 4);
      continue;
    }
    arr.set([Math.cos(a) * r, y, Math.sin(a) * r, w], i * 4);
  }
  return shuffle(arr, n, rand);
}

/** Undulating data terrain used behind the content sections (waves are animated in GLSL). */
function buildField(n: number) {
  const rand = mulberry32(11);
  const arr = new Float32Array(n * 4);
  const cols = Math.round(Math.sqrt(n * 1.25));
  const rows = Math.ceil(n / cols);
  const x0 = -13;
  const x1 = 13;
  const z0 = -22;
  const z1 = 4;
  for (let i = 0; i < n; i++) {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = x0 + ((c + rand() * 0.6) / cols) * (x1 - x0);
    const z = z0 + ((r + rand() * 0.6) / rows) * (z1 - z0);
    const far = THREE.MathUtils.smoothstep(z, z0, z0 + 9);
    const side = 1 - THREE.MathUtils.smoothstep(Math.abs(x), 8, 13);
    const w = (0.55 + rand() * 0.75) * far * side;
    arr.set([x, 0, z, w], i * 4);
  }
  return shuffle(arr, n, rand);
}

function shuffle(arr: Float32Array, n: number, rand: () => number) {
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    for (let k = 0; k < 4; k++) {
      const t = arr[i * 4 + k];
      arr[i * 4 + k] = arr[j * 4 + k];
      arr[j * 4 + k] = t;
    }
  }
  return arr;
}

/**
 * Each downloaded particle gets `density - 1` close neighbours: the same particle in every
 * shape plus a fixed small offset, so the extra points follow it through every morph.
 * That doubles the visible grain without doubling the download.
 */
function densify(shapes: Float32Array[], n: number, density: number) {
  if (density <= 1) return shapes;
  const total = Math.floor(n * density);
  const rand = mulberry32(5);
  const gauss = gaussFactory(rand);
  const off = new Float32Array((total - n) * 3);
  for (let i = 0; i < off.length; i += 3) {
    off[i] = gauss() * 0.014;
    off[i + 1] = gauss() * 0.014;
    off[i + 2] = gauss() * 0.03;
  }
  return shapes.map((src) => {
    const dst = new Float32Array(total * 4);
    dst.set(src.subarray(0, n * 4));
    for (let i = n, k = 0; i < total; i++, k++) {
      const j = (k % n) * 4;
      dst[i * 4] = src[j] + off[k * 3];
      dst[i * 4 + 1] = src[j + 1] + off[k * 3 + 1];
      dst[i * 4 + 2] = src[j + 2] + off[k * 3 + 2];
      dst[i * 4 + 3] = src[j + 3];
    }
    return dst;
  });
}

export async function loadShapes(url: string, count: number, density = 1): Promise<ShapeSet> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${url}`);
  const decoded = decode(await res.arrayBuffer(), count);
  const [hero, intent, palm, brain] = densify(decoded.out, decoded.n, density);
  const n = Math.floor(decoded.n * Math.max(1, density));

  const rand = mulberry32(3);
  const rnd = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) rnd[i] = rand();

  const attr = (a: Float32Array) => new THREE.BufferAttribute(a, 4);
  const heroAttr = attr(hero);
  return {
    count: n,
    stages: [heroAttr, attr(intent), attr(palm), attr(buildRings(n)), attr(brain), attr(buildField(n)), heroAttr],
    random: new THREE.BufferAttribute(rnd, 4),
  };
}
