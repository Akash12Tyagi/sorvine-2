"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { env, progress } from "@/lib/scene-store";
import { bindCues, bindStory, unbindStory, updateCues, updateStory } from "./story-dom";

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;
export const getLenis = () => lenisInstance;

/** Blur-in reveal driven by scroll progress (p = 0 hidden, 1 shown). */
function applyReveal(el: HTMLElement, p: number) {
  const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, p)), 3);
  el.style.opacity = e.toFixed(3);
  // no filter at rest, so glass children keep their backdrop blur
  el.style.filter = e > 0.995 || e < 0.005 ? "none" : `blur(${((1 - e) * 12).toFixed(2)}px)`;
  el.style.transform = e > 0.995 ? "none" : `translate3d(0, ${((1 - e) * 28).toFixed(2)}px, 0)`;
}

/**
 * Smooth scrolling (Lenis) and the scroll → scene bridge. Everything that animates on
 * this page is tied to the scroll position: the particles and the story copy read the
 * position every frame, and every element marked data-reveal is scrubbed in as it
 * enters the screen (and back out when you scroll up).
 */
export function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    env.reducedMotion = reduced;
    document.documentElement.classList.toggle("reduced-motion", reduced);

    const lenis = new Lenis({
      lerp: reduced ? 1 : 0.085,
      smoothWheel: !reduced,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.4,
    });
    lenisInstance = lenis;
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    bindStory();
    bindCues();
    // one "screen" of the story = the height of its 100vh stage (on iOS that can differ from
    // innerHeight while the toolbars slide in and out)
    const stage = document.querySelector<HTMLElement>("[data-story-stage]");
    let vh = stage?.offsetHeight || window.innerHeight;
    const ro = new ResizeObserver(() => {
      vh = stage?.offsetHeight || window.innerHeight;
    });
    if (stage) ro.observe(stage);
    const frame = (time: number) => {
      lenis.raf(time * 1000);
      progress.s = window.scrollY / vh;
      updateStory(progress.s, vh, reduced);
      updateCues(progress.s, vh, time * 1000);
    };
    gsap.ticker.add(frame);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // ---- section progress for the scene ----
      const bind = (key: "rest" | "cta", trigger: string) =>
        ScrollTrigger.create({
          trigger,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            progress[key] = self.progress;
          },
          onRefresh: (self) => {
            progress[key] = self.progress;
          },
        });
      bind("rest", "#rest");
      bind("cta", "#cta");

      // ---- scrubbed reveals ----
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        const delay = Number(el.dataset.revealDelay ?? 0);
        const trigger = el.dataset.revealTrigger ? document.querySelector(el.dataset.revealTrigger) : el;
        // a later element in a group starts a little further down the scroll
        const start = Number(el.dataset.revealStart ?? 94) - delay * 22;
        const length = Number(el.dataset.revealLength ?? 30);
        if (reduced) {
          applyReveal(el, 1);
          return;
        }
        ScrollTrigger.create({
          trigger: trigger ?? el,
          // clamp(): content near the very bottom still finishes revealing at max scroll
          start: `clamp(top ${start}%)`,
          end: `clamp(top ${start - length}%)`,
          onUpdate: (self) => applyReveal(el, self.progress),
          onRefresh: (self) => applyReveal(el, self.progress),
        });
      });
    });

    // ---- in-page anchors go through Lenis ----
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const hash = a.getAttribute("href") ?? "";
      if (hash.length < 2) return;
      const target = document.querySelector<HTMLElement>(hash);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    };
    document.addEventListener("click", onClick);

    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);

    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("load", refresh);
      ctx.revert();
      gsap.ticker.remove(frame);
      ro.disconnect();
      unbindStory();
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return null;
}
