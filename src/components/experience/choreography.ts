import { progress } from "@/lib/scene-store";
import { TL, easeIn, easeInOut, easeOut, lerp, range, seg, stepAt, track } from "@/lib/timeline";
import { CORE } from "./shapes";

/**
 * Maps the scroll position to everything the 3D scene needs. All positions are in world
 * units; the camera sits at z = 10 looking at the origin, where one screen of scroll is
 * `unitsPerScreen` world units on the z = 0 plane. The particle shapes were calibrated
 * against the reference frames from exactly that camera.
 *
 * Morph index (stage → stage):
 *   0 → 1  hero hands → intent hands          (camera "flies in")
 *   1 → 2  intent hands → open hand + core     (dissolve, re-form)
 *   2 → 3  hand → rings                        (Learn → Reason)
 *   3 → 4  rings → brain                       (Reason → Act)
 *   4 → 5  brain → data field                  (content sections)
 *   5 → 6  field → hands                       (closing call to action)
 */
export type Transition = {
  via: [number, number, number];
  viaAmt: number;
  scatter: number;
  delay: number;
  turb: number;
  /** how much particles fade out mid-flight (0 = never, 1 = invisible in the middle) */
  midFade: number;
  /** progress window (per particle) over which they fade back in */
  fadeIn: [number, number];
  /** spin around the core's vertical axis while in flight (radians at mid-flight) */
  swirl: number;
  /** hang in a cloud halfway before settling (see the shader) */
  linger?: boolean;
};

export type SceneState = {
  s: number;
  unitsPerScreen: number;
  cam: { x: number; y: number; z: number; ty: number };
  morph: number;
  tr: Transition;
  /** vertical offsets of stages that scroll with the page */
  heroLift: number;
  intentLift: number;
  ctaLift: number;
  /** portrait screens: the hero hands sit lower (under the taller copy) ... */
  heroDrop: number;
  /** ... and the parted intent hands move in from the edges */
  handSplit: number;
  sphere: {
    x: number;
    y: number;
    radius: number;
    body: number;
    shell: number;
    fuzz: number;
    glow: number;
    glowSize: number;
    halo: number;
    haloSize: number;
    rim: number;
  };
  alpha: number;
  mouse: number;
  mouseRadius: number;
  fieldPhase: number;
  step: number;
};

const TRANSITIONS: Transition[] = [
  // hero → intent: coherent, every particle keeps its place on the hand
  { via: [0, 0, 0], viaAmt: 0, scatter: 0.04, delay: 0, turb: 0.04, midFade: 0, fadeIn: [0.55, 0.92], swirl: 0 },
  // intent → palm: dissolve at the top of the screen, re-form around the core
  { via: [CORE.learn.x, CORE.learn.y - 0.45, 0], viaAmt: 0.75, scatter: 1.75, delay: 0.3, turb: 0.14, midFade: 1, fadeIn: [0.465, 0.5], swirl: 0, linger: true },
  // palm → rings: the hand swirls into a disc around the core
  { via: [CORE.reason.x, CORE.reason.y, 0], viaAmt: 0.45, scatter: 0.9, delay: 0.3, turb: 0.4, midFade: 0.15, fadeIn: [0.55, 0.92], swirl: 1.6 },
  // rings → brain: collapse into a cloud around the core, then grow into the brain
  { via: [CORE.act.x, CORE.act.y, 0], viaAmt: 0.85, scatter: 0.75, delay: 0.3, turb: 0.4, midFade: 0.1, fadeIn: [0.55, 0.92], swirl: -0.9 },
  // brain → field
  { via: [0, -1.6, -3], viaAmt: 0.25, scatter: 2.2, delay: 0.5, turb: 0.85, midFade: 0.2, fadeIn: [0.55, 0.92], swirl: 0 },
  // field → hands
  { via: [0, 0, 0], viaAmt: 0.5, scatter: 1.0, delay: 0.55, turb: 0.5, midFade: 0.2, fadeIn: [0.55, 0.92], swirl: 0 },
];

export function createSceneState(): SceneState {
  return {
    s: 0,
    unitsPerScreen: 6.306,
    cam: { x: 0, y: 0, z: 10, ty: 0 },
    morph: 0,
    tr: TRANSITIONS[0],
    heroLift: 0,
    intentLift: 0,
    ctaLift: 0,
    heroDrop: 0,
    handSplit: 0,
    sphere: { x: 0, y: 0, radius: 0, body: 0, shell: 0, fuzz: 0, glow: 0, glowSize: 0.3, halo: 0, haloSize: 1, rim: 0.6 },
    alpha: 1,
    mouse: 1,
    mouseRadius: 0.8,
    fieldPhase: 0,
    step: 0,
  };
}

export function choreograph(st: SceneState, s: number, unitsPerScreen: number) {
  st.s = s;
  st.unitsPerScreen = unitsPerScreen;
  const U = unitsPerScreen;
  const cta = progress.cta;
  const rest = progress.rest;

  // ---------------- portrait adjustments ----------------
  const fit = U / 6.306;
  st.heroDrop = -Math.max(0, fit - 1) * 2.3;
  st.handSplit = Math.max(0, fit - 1) * 0.9;

  // ---------------- page-attached offsets ----------------
  const hs = Math.min(s, TL.heroLift[1]);
  st.heroLift = U * (0.5 * hs + 1.26 * hs * hs * hs);
  st.intentLift = U * Math.max(0, s - TL.intentOut[0]);
  // the closing hands rise with the CTA section; they rest in the hero framing when its top hits the top of the screen
  st.ctaLift = U * (cta - 0.5) * 2;

  // ---------------- morph ----------------
  let m = 0;
  if (cta > 0.08) m = 5 + seg(cta, 0.12, 0.47);
  else if (s >= TL.storyOut[0]) m = 4 + seg(s, TL.storyOut[0], TL.storyOut[1] + 0.4);
  else if (s >= TL.reasonToAct[0]) m = 3 + range(s, TL.reasonToAct);
  else if (s >= TL.learnToReason[0]) m = 2 + range(s, TL.learnToReason);
  else if (s >= TL.dissolve[0]) m = 1 + range(s, TL.dissolve);
  else m = range(s, TL.zoom);
  st.morph = m;
  st.tr = TRANSITIONS[Math.min(TRANSITIONS.length - 1, Math.floor(Math.min(m, 5.999)))];

  // ---------------- camera ----------------
  // still for the whole story; tilts down over the data field, back for the closing hands
  const toField = range(s, TL.storyOut);
  const back = seg(cta, 0.1, 0.5);
  st.cam.x = 0;
  st.cam.z = 10;
  st.cam.y = lerp(lerp(0, 0.35, easeInOut(toField)), 0, easeInOut(back));
  st.cam.ty = lerp(lerp(0, -0.25, easeInOut(toField)), 0, easeInOut(back));

  // ---------------- core sphere ----------------
  const sp = st.sphere;
  const sparkTravel = easeInOut(seg(s, TL.zoom[0], 1.05));
  if (s < TL.coreGlow[0]) {
    // the hero spark: rides up with the hands, flies to the middle, fades into a haze
    const sx = CORE.heroSpark.x;
    const sy = CORE.heroSpark.y + st.heroDrop + st.heroLift * 1.08;
    sp.x = lerp(sx, CORE.intentHaze.x, sparkTravel);
    sp.y = lerp(sy, CORE.intentHaze.y, sparkTravel) + st.intentLift;
    sp.radius = 0;
    sp.body = 0;
    sp.shell = 0;
    sp.fuzz = 0;
    sp.glow = track([[0, 0.5], [0.6, 0.5], [0.92, 1.25], [1.08, 0.5], [1.3, 0.1], [2.3, 0.1], [2.75, 0]], s);
    sp.glowSize = track([[0, 0.42], [0.6, 0.42], [0.95, 0.66], [1.3, 1.6]], s);
    sp.halo = track([[0, 0.34], [0.6, 0.34], [0.95, 0.4], [1.3, 0.1], [2.3, 0.1], [2.8, 0]], s);
    sp.haloSize = track([[0, 0.62], [0.6, 0.62], [0.95, 1.4], [1.3, 3.4]], s);
    sp.rim = 0.6;
  } else {
    const l2r = easeInOut(range(s, TL.learnToReason));
    const r2a = easeInOut(range(s, TL.reasonToAct));
    const out = range(s, TL.storyOut);
    // the glow lights up just below the middle of the screen and rises into the palm
    const rise = easeInOut(seg(s, TL.coreGlow[0], TL.coreGrow[1]));
    sp.x = lerp(lerp(CORE.learn.x, CORE.reason.x, l2r), CORE.act.x, r2a);
    sp.y = lerp(lerp(lerp(0.05, CORE.learn.y, rise), CORE.reason.y, l2r), CORE.act.y, r2a);
    const grown = easeOut(range(s, TL.coreGrow));
    const r = lerp(lerp(CORE.learn.r, CORE.reason.r, l2r), CORE.act.r, r2a);
    sp.radius = r * (0.55 + 0.45 * grown) * seg(s, TL.coreGrow[0], TL.coreGrow[0] + 0.06) * (1 - easeIn(seg(out, 0, 0.7)));
    // a solid-looking core while it rests in the palm, glassier once it is on its own
    const midL = Math.sin(Math.PI * range(s, TL.learnToReason));
    const midR = Math.sin(Math.PI * range(s, TL.reasonToAct));
    sp.body = lerp(lerp(0.95, 0.6, l2r), 0.36, r2a) * grown * (1 - 0.45 * Math.max(midL, midR)) * (1 - seg(out, 0.2, 0.8));
    sp.shell = lerp(lerp(0.4, 0.68, l2r), 0.42, r2a) * seg(s, TL.coreGrow[0] + 0.1, TL.coreGrow[1] + 0.05) * (1 - seg(out, 0.1, 0.7));
    sp.fuzz = track([[TL.coreGrow[0], 1.6], [TL.coreGrow[1] + 0.05, 0.22]], s) * (1 - 0.5 * l2r) + 0.7 * Math.max(midL, midR);
    const glowIn = easeOut(range(s, TL.coreGlow));
    sp.glow = (lerp(lerp(0.14, 0.18, l2r), 0.26, r2a) + 1.3 * (1 - grown)) * glowIn * (1 - seg(out, 0.3, 0.9));
    sp.glowSize = Math.max(0.35, sp.radius * 1.7) + 0.75 * (1 - grown) * glowIn;
    sp.halo = lerp(lerp(0.85, 0.55, l2r), 0.4, r2a) * glowIn * (1 - seg(out, 0.2, 0.9));
    sp.haloSize = lerp(lerp(1.9, 1.9, l2r), 1.3, r2a) * Math.max(0.5, grown);
    sp.rim = lerp(lerp(0.18, 0.28, l2r), 0.05, r2a);
  }
  // the spark comes back with the closing hands
  if (cta > 0.08) {
    const k = seg(cta, 0.3, 0.5);
    sp.x = CORE.heroSpark.x;
    sp.y = CORE.heroSpark.y + st.heroDrop + st.ctaLift;
    sp.radius = 0;
    sp.body = 0;
    sp.shell = 0;
    sp.fuzz = 0;
    sp.glow = 0.5 * k;
    sp.glowSize = 0.42;
    sp.halo = 0.34 * k;
    sp.haloSize = 0.62;
  }

  // ---------------- particles ----------------
  st.alpha = track([[TL.storyOut[0], 1], [TL.storyOut[1], 0.8]], s) * (cta > 0.08 ? lerp(0.8, 1, seg(cta, 0.1, 0.45)) : 1);
  st.mouse = track([[0, 1], [1, 0.85], [3, 0.6], [TL.storyOut[1], 0.3]], s);
  if (cta > 0.08) st.mouse = lerp(0.3, 1, seg(cta, 0.1, 0.45));
  st.mouseRadius = track([[0, 0.8], [1.2, 0.95], [3.4, 0.85], [TL.storyOut[1], 1.3]], s);
  st.fieldPhase = rest * 7;
  st.step = stepAt(s);

  return st;
}
