"use client";

import { scrollCues } from "@/lib/content";
import { getLenis } from "@/components/scroll/SmoothScroll";
import { TL } from "@/lib/timeline";

const N = scrollCues.chapters.length;

/**
 * Two cues that keep the scroll story readable (driven from scroll/story-dom.ts):
 * - a chapter rail on the right edge that fills as the story plays and jumps to a chapter
 * - a "scroll to …" hint at the bottom that appears when a visitor pauses on a pinned scene
 */
export function ScrollCues() {
  const goTo = (at: number) => {
    const stage = document.querySelector<HTMLElement>("[data-story-stage]");
    const y = at * (stage?.offsetHeight || window.innerHeight);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.8 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <>
      {/* ---- chapter rail (desktop) ---- */}
      <nav
        aria-label="Story chapters"
        data-cue="rail"
        className="cue-rail pointer-events-none fixed right-[max(18px,calc(var(--gutter)*0.42))] top-1/2 z-40 hidden -translate-y-1/2 opacity-0 md:block"
      >
        <div className="relative flex items-center gap-[max(10px,calc(var(--u)*0.8))]">
          <p className="text-right text-[max(10px,calc(var(--u)*0.62))] font-semibold uppercase tracking-[0.22em]" aria-live="polite">
            <span className="block text-accent" data-cue="label">
              {scrollCues.chapters[0].label}
            </span>
            <span className="mt-[0.5em] block tabular-nums text-white/30" data-cue="count">
              01 / {String(N).padStart(2, "0")}
            </span>
          </p>
          <div className="relative h-[max(150px,calc(var(--u)*11))] w-[9px]">
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/[0.1]" aria-hidden="true" />
            <div
              className="absolute left-1/2 top-0 h-full w-px origin-top -translate-x-1/2 bg-gradient-to-b from-accent/40 to-accent"
              style={{ transform: "translateX(-50%) scaleY(0)" }}
              data-cue="fill"
              aria-hidden="true"
            />
            {scrollCues.chapters.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => goTo(c.at)}
                data-cue-dot={i}
                aria-label={`Go to ${c.label}`}
                className="cue-dot absolute left-1/2 grid h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 place-items-center"
                style={{ top: `${(Math.min(c.at, TL.end) / TL.end) * 100}%` }}
              >
                <span className="block h-[5px] w-[5px] rounded-full" />
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ---- pause hint ---- */}
      <div
        data-cue="idle"
        aria-hidden="true"
        className="cue-idle pointer-events-none fixed inset-x-0 bottom-[max(14px,2.4vh)] z-40 flex flex-col items-center gap-[10px] opacity-0"
      >
        <span className="text-[max(10px,calc(var(--u)*0.6))] font-medium uppercase tracking-[0.3em] text-white/55" data-cue="idle-text">
          {scrollCues.hints[0].text}
        </span>
        <span className="cue-line" />
      </div>
    </>
  );
}
