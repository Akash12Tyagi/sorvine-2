/**
 * The scroll script of the opening story, in screens (1 = one viewport height of scroll
 * from the top of the page). The DOM copy and the WebGL scene both read these keys, so
 * text and particles always move together. Ranges are [start, end].
 *
 *   0    hero                      the hands reach for the spark
 *   0.6  hands rise, then the camera flies in between them
 *   1.1  "Human intent, machine intelligence."
 *   2.3  copy and hands scroll away, the hands dissolve
 *   2.7  the core lights up, an open hand condenses under it  (Learn)
 *   4.4  the hand swirls into rings around the core             (Reason)
 *   6.0  the rings collapse into a brain                        (Act)
 *   7.6  the story hands over to the content sections
 */
export const TL = {
  /** the hero hands follow the page up (slower than the copy at first) until this point */
  heroLift: [0, 0.62],
  /** hero hands turn into the parted intent hands */
  zoom: [0.62, 1.12],
  /** the spark travels to the middle of the screen and fades into a haze */
  spark: [0.6, 1.25],
  intentIn: [1.1, 1.38],
  /** intent copy and hands scroll away at page speed */
  intentOut: [2.3, 3.2],
  /** intent hands dissolve at the top and re-form as the open hand under the core */
  dissolve: [2.55, 3.72],
  coreGlow: [2.82, 3.02],
  coreGrow: [3.5, 3.75],
  coreTitleIn: [3.08, 3.42],
  stepsIn: [3.52, 3.76],
  learnToReason: [4.4, 5.1],
  reasonToAct: [6.0, 6.65],
  /** the text of the Learn / Reason / Act panel switches in the middle of each transition */
  stepSwitch: [4.75, 6.32],
  storyOut: [7.6, 8.4],
  /** total length of the story (hero screen included) */
  end: 8.4,
} as const;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0 → 1 as x goes from a to b */
export const seg = (x: number, a: number, b: number) => clamp01((x - a) / (b - a));
export const range = (x: number, r: readonly [number, number]) => seg(x, r[0], r[1]);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t: number) => t * t * t;

type Key = readonly [number, number];
/** Piecewise interpolation through [time, value] keys, eased between keys. */
export function track(keys: readonly Key[], x: number, fn = easeInOut) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i];
    if (x <= t1) {
      const [t0, v0] = keys[i - 1];
      return lerp(v0, v1, fn((x - t0) / (t1 - t0)));
    }
  }
  return keys[keys.length - 1][1];
}

/** Which Learn / Reason / Act step is showing (fractional while switching). */
export function stepAt(s: number) {
  const [a, b] = TL.stepSwitch;
  return seg(s, a - 0.1, a + 0.1) + seg(s, b - 0.1, b + 0.1);
}
