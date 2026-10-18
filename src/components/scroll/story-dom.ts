import { scrollCues } from "@/lib/content";
import { TL, clamp01, easeOut, seg, stepAt } from "@/lib/timeline";

/**
 * Scrubs the copy of the pinned story (Story.tsx) from the scroll position, using the
 * same timeline keys as the particles. Called once per frame from the scroll loop;
 * styles are only written when the position changed.
 */

type Els = {
  intent: HTMLElement | null;
  intentLines: HTMLElement[];
  core: HTMLElement | null;
  coreLines: HTMLElement[];
  steps: HTMLElement | null;
  stepsShade: HTMLElement | null;
  labels: HTMLElement[];
  bodies: HTMLElement[];
  rail: HTMLElement | null;
};

let els: Els | null = null;
let lastS = Number.NaN;
let lastVh = 0;

const q = (sel: string) => document.querySelector<HTMLElement>(sel);
const qa = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel));

export function bindStory() {
  els = {
    intent: q('[data-story="intent"]'),
    intentLines: [0, 1, 2, 3].map((i) => q(`[data-s="intent-${i}"]`)).filter(Boolean) as HTMLElement[],
    core: q('[data-story="core"]'),
    coreLines: [0, 1, 2].map((i) => q(`[data-s="core-${i}"]`)).filter(Boolean) as HTMLElement[],
    steps: q('[data-s="steps"]'),
    stepsShade: q('[data-s="steps-shade"]'),
    labels: qa("[data-step-label]"),
    bodies: qa("[data-step-body]"),
    rail: q("[data-step-rail]"),
  };
  lastS = Number.NaN;
}

export function unbindStory() {
  els = null;
  cues = null;
}

// ---------------------------------------------------------------- scroll cues

type Cues = {
  rail: HTMLElement | null;
  fill: HTMLElement | null;
  label: HTMLElement | null;
  count: HTMLElement | null;
  dots: HTMLElement[];
  idle: HTMLElement | null;
  idleText: HTMLElement | null;
  process: HTMLElement | null;
};
let cues: Cues | null = null;
let cueChapter = -1;
let cueS = Number.NaN;
let lastMove = 0;
let hintShown = "";

/** where each chapter of the rail becomes the current one */
const CHAPTER_FROM = [0, TL.intentIn[0] - 0.1, TL.dissolve[0] + 0.35, TL.stepSwitch[0], TL.stepSwitch[1]];
/** pause this long on a pinned scene before the hint fades in */
const IDLE_MS = 1300;

export function bindCues() {
  cues = {
    rail: q('[data-cue="rail"]'),
    fill: q('[data-cue="fill"]'),
    label: q('[data-cue="label"]'),
    count: q('[data-cue="count"]'),
    dots: qa("[data-cue-dot]"),
    idle: q('[data-cue="idle"]'),
    idleText: q('[data-cue="idle-text"]'),
    process: q("#how-it-works"),
  };
  cueChapter = -1;
  cueS = Number.NaN;
  hintShown = "";
}

/** Called every frame (also while the page is still, to time the pause hint). */
export function updateCues(s: number, vh: number, now: number) {
  const C = cues;
  if (!C) return;
  const moved = s !== cueS;
  if (moved) {
    cueS = s;
    lastMove = now;

    // chapter rail: visible while the story is pinned, fills with it
    if (C.rail) {
      const o = seg(s, 0.45, 0.75) * (1 - seg(s, TL.end - 0.5, TL.end - 0.15));
      C.rail.style.opacity = o.toFixed(3);
      C.rail.style.pointerEvents = o > 0.5 ? "auto" : "none";
    }
    if (C.fill) C.fill.style.transform = `translateX(-50%) scaleY(${clamp01(s / TL.end).toFixed(4)})`;
    let ch = 0;
    for (let i = 0; i < CHAPTER_FROM.length; i++) if (s >= CHAPTER_FROM[i]) ch = i;
    if (ch !== cueChapter) {
      cueChapter = ch;
      const n = scrollCues.chapters.length;
      if (C.label) C.label.textContent = scrollCues.chapters[ch].label;
      if (C.count) C.count.textContent = `${String(ch + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
      C.dots.forEach((d, i) => {
        d.dataset.state = i < ch ? "done" : i === ch ? "current" : "next";
        if (i === ch) d.setAttribute("aria-current", "step");
        else d.removeAttribute("aria-current");
      });
    }
  }

  // pause hint: what the next scroll will show
  let text = "";
  if (now - lastMove > IDLE_MS) {
    const hint = scrollCues.hints.find((h) => s >= h.from && s < h.to);
    if (hint) text = hint.text;
    else if (C.process) {
      const r = C.process.getBoundingClientRect();
      // pinned "How it works", not yet at its last step
      if (r.top <= 1 && r.bottom > vh * 1.25) text = scrollCues.processHint;
    }
  }
  if (text !== hintShown) {
    hintShown = text;
    if (C.idle) C.idle.dataset.show = text ? "true" : "false";
    if (text && C.idleText) C.idleText.textContent = text;
  }
}

/** Blur-in reveal: p = 0 hidden, 1 shown. */
function reveal(el: HTMLElement, p: number, dy = 18, blur = 14) {
  const e = easeOut(clamp01(p));
  el.style.opacity = e.toFixed(3);
  el.style.filter = e > 0.995 || e < 0.005 ? "none" : `blur(${((1 - e) * blur).toFixed(2)}px)`;
  el.style.transform = e > 0.995 ? "none" : `translate3d(0, ${((1 - e) * dy).toFixed(2)}px, 0)`;
}

/** Off-screen story layers stay in the accessibility tree but can't catch clicks. */
function show(el: HTMLElement | null, visible: boolean) {
  if (!el) return;
  el.style.pointerEvents = visible ? "" : "none";
}

export function updateStory(s: number, vh: number, reduced = false) {
  if (!els) return;
  if (s === lastS && vh === lastVh) return;
  lastS = s;
  lastVh = vh;
  const E = els;

  // ---- Human intent ----
  const [i0, i1] = TL.intentIn;
  E.intentLines.forEach((el, k) => {
    const a = i0 + k * 0.035;
    reveal(el, reduced ? (s > i0 ? 1 : 0) : seg(s, a, i1 + k * 0.035));
  });
  if (E.intent) {
    // after the hold the copy scrolls away at page speed, together with the hands
    const out = Math.max(0, s - TL.intentOut[0]) * vh;
    E.intent.style.transform = out > 0 ? `translate3d(0, ${(-out).toFixed(1)}px, 0)` : "none";
    show(E.intent, s > i0 - 0.05 && s < TL.intentOut[1]);
  }

  // ---- Your AI core ----
  const [c0, c1] = TL.coreTitleIn;
  E.coreLines.forEach((el, k) => {
    reveal(el, reduced ? (s > c0 ? 1 : 0) : seg(s, c0 + k * 0.035, c1 + k * 0.035));
  });
  if (E.steps) reveal(E.steps, reduced ? (s > TL.stepsIn[0] ? 1 : 0) : seg(s, TL.stepsIn[0], TL.stepsIn[1]), 14, 10);
  if (E.stepsShade) E.stepsShade.style.opacity = seg(s, TL.stepsIn[0], TL.stepsIn[1]).toFixed(3);
  if (E.core) {
    const out = Math.max(0, s - TL.storyOut[0]) * vh;
    E.core.style.transform = out > 0 ? `translate3d(0, ${(-out).toFixed(1)}px, 0)` : "none";
    show(E.core, s > c0 - 0.05 && s < TL.storyOut[1] + 0.6);
  }

  // ---- Learn · Reason · Act ----
  const step = stepAt(s);
  E.labels.forEach((el, i) => {
    const a = clamp01(1 - Math.abs(step - i));
    el.style.setProperty("--a", a.toFixed(3));
    el.setAttribute("aria-pressed", String(a > 0.5));
  });
  E.bodies.forEach((el, i) => {
    const v = clamp01(1 - 2 * Math.abs(step - i));
    el.style.opacity = v.toFixed(3);
    el.style.filter = v > 0.995 || v < 0.005 ? "none" : `blur(${((1 - v) * 6).toFixed(2)}px)`;
    const dy = Math.max(-1, Math.min(1, i - step)) * 6 * (1 - v);
    el.style.transform = v > 0.995 ? "none" : `translate3d(0, ${dy.toFixed(2)}px, 0)`;
    el.setAttribute("aria-hidden", String(v < 0.5));
  });
  if (E.rail) E.rail.style.transform = `translate3d(0, ${(step * 100).toFixed(2)}%, 0)`;
}
