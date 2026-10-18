import { cta } from "@/lib/content";
import { GhostButton, PrimaryButton } from "@/components/ui/Buttons";

/** The hands return here; copy sits where it did in the hero so the page ends as it began. */
export function FinalCta() {
  return (
    <section id="cta" className="relative h-screen min-h-[600px]" aria-labelledby="cta-title">
      <div className="shell flex flex-col items-center pt-[max(110px,21vh)] text-center">
        <p className="t-eyebrow" data-reveal>
          {cta.eyebrow}
        </p>
        <h2 id="cta-title" className="t-display mt-[max(16px,calc(var(--u)*1.42))]">
          <span className="t-light block" data-reveal data-reveal-delay="0.06">
            {cta.titleLight}
          </span>
          <span className="t-bold block" data-reveal data-reveal-delay="0.12">
            {cta.titleBold}
          </span>
        </h2>
        <p className="t-lead mt-[max(14px,calc(var(--u)*1.25))] max-w-[32em]" data-reveal data-reveal-delay="0.2">
          {cta.body}
        </p>
        <div className="mt-[max(22px,calc(var(--u)*1.55))] flex items-center gap-[max(8px,calc(var(--u)*0.82))]" data-reveal data-reveal-delay="0.28">
          <GhostButton href={cta.secondary.href}>{cta.secondary.label}</GhostButton>
          <PrimaryButton href={cta.primary.href}>{cta.primary.label}</PrimaryButton>
        </div>
      </div>
    </section>
  );
}
