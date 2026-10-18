"use client";

import { Fragment } from "react";
import { core } from "@/lib/content";
import { getLenis } from "@/components/scroll/SmoothScroll";

/** Where each step is fully on screen, in screens from the top of the page. */
const STEP_AT = [3.95, 5.55, 7.1];

/**
 * Learn · Reason · Act. Colours, the rail and the crossfade between the three texts are
 * scrubbed by the scroll position (scroll/story-dom.ts), so they move with the particles.
 */
export function CoreSteps() {
  const goTo = (i: number) => {
    const lenis = getLenis();
    const stage = document.querySelector<HTMLElement>("[data-story-stage]");
    const y = STEP_AT[i] * (stage?.offsetHeight || window.innerHeight);
    if (lenis) lenis.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <div className="relative pl-[max(14px,calc(var(--u)*1.38))]">
      {/* progress rail */}
      <div className="absolute bottom-[0.2em] left-0 top-0 w-px bg-white/[0.06]" aria-hidden="true">
        <div className="absolute left-0 top-0 h-1/3 w-full bg-[#7f93c9]" data-step-rail />
      </div>

      <p className="flex flex-wrap items-center text-[max(10px,calc(var(--u)*0.72))] font-bold uppercase tracking-[0.2em]">
        {core.steps.map((s, i) => (
          <Fragment key={s.label}>
            {i > 0 && (
              <span className="px-[0.45em] text-[#2e313a]" aria-hidden="true">
                ·
              </span>
            )}
            <button
              type="button"
              onClick={() => goTo(i)}
              data-step-label={i}
              className="step-label uppercase tracking-[0.2em] hover:brightness-150"
            >
              {s.label}
            </button>
          </Fragment>
        ))}
      </p>

      <div className="mt-[max(8px,calc(var(--u)*0.62))] grid">
        {core.steps.map((s, i) => (
          <p key={s.label} data-step-body={i} className="t-step col-start-1 row-start-1 text-[#b4b4b6]">
            {s.body}
          </p>
        ))}
      </div>
    </div>
  );
}
