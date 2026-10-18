import type { CSSProperties } from "react";
import { hero } from "@/lib/content";
import { GhostButton, PrimaryButton } from "@/components/ui/Buttons";

/** Load-in delay for the hero copy (seconds); the copy then scrolls away with the page. */
const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export function Hero() {
  return (
    <section id="top" className="relative h-[100svh] min-h-[560px] md:h-screen">
      <div className="shell flex flex-col items-center pt-[max(120px,23.4vh)] text-center md:pt-[23.4vh]">
        <p className="t-eyebrow load-in" style={d(0.15)}>
          {hero.eyebrow}
        </p>
        <h1 className="t-display mt-[max(14px,calc(var(--u)*0.9))]">
          <span className="t-light load-in block" style={d(0.22)}>
            {hero.titleLight}
          </span>
          <span className="t-bold load-in block" style={d(0.3)}>
            {hero.titleBold}
          </span>
        </h1>
        <p className="t-lead load-in mt-[max(12px,calc(var(--u)*0.62))] max-w-[36em]" style={d(0.4)}>
          {hero.body.map((line, i) => (
            <span key={i}>
              {line}
              {i < hero.body.length - 1 && (
                <>
                  <br className="hidden md:block" />
                  <span className="md:hidden"> </span>
                </>
              )}
            </span>
          ))}
        </p>
        <div className="load-in mt-[max(18px,calc(var(--u)*1.22))] flex items-center gap-[max(8px,calc(var(--u)*0.82))]" style={d(0.5)}>
          <GhostButton href={hero.secondaryCta.href}>{hero.secondaryCta.label}</GhostButton>
          <PrimaryButton href={hero.primaryCta.href}>{hero.primaryCta.label}</PrimaryButton>
        </div>
      </div>

      <a
        href="#intent"
        className="load-in group absolute bottom-[max(10px,1.7vh)] left-1/2 flex -translate-x-1/2 flex-col items-center gap-[max(8px,calc(var(--u)*0.55))] text-[max(9px,calc(var(--u)*0.62))] font-medium uppercase tracking-[0.32em] text-white/40 transition-colors hover:text-white/80"
        style={d(0.9)}
      >
        <span className="cue-shimmer pl-[0.32em]">{hero.scrollHint}</span>
        <span className="cue-line" aria-hidden="true" />
      </a>
    </section>
  );
}
