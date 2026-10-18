import { core, intent } from "@/lib/content";
import { TL } from "@/lib/timeline";
import { CoreSteps } from "./CoreSteps";

/**
 * The pinned opening story after the hero: "Human intent" and the AI core
 * (Learn → Reason → Act). The section only provides scroll length and a pinned stage;
 * every element here is scrubbed by the scroll position (see scroll/story-dom.ts),
 * in step with the particles behind it.
 */
export function Story() {
  // the story starts one screen down (after the hero) and stays pinned until TL.end
  const screens = TL.end;
  const anchorAt = (s: number) => ({ top: `${(s - 1) * 100}vh` });
  return (
    <section id="story" className="relative" style={{ height: `${screens * 100}vh` }}>
      {/* in-page anchors at the moments the nav links point to */}
      <span id="intent" className="pointer-events-none absolute left-0 h-px w-px" style={anchorAt(1.7)} aria-hidden="true" />
      <span id="core" className="pointer-events-none absolute left-0 h-px w-px" style={anchorAt(3.95)} aria-hidden="true" />

      <div className="sticky top-0 h-screen overflow-hidden" data-story-stage>
        {/* ---- Human intent ---- */}
        <div className="absolute inset-0 flex items-center justify-center" data-story="intent">
          <div className="shell relative -mt-[2.1vh] flex flex-col items-center text-center">
            {/* keeps the copy legible where the hands pass behind it on narrow screens */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 -inset-y-16 -z-10 bg-[radial-gradient(closest-side,rgba(0,0,0,0.72),transparent)] md:hidden" />
            <p className="t-eyebrow" data-s="intent-0">
              {intent.eyebrow}
            </p>
            <h2 id="intent-title" className="t-h2 mt-[max(12px,calc(var(--u)*0.95))]">
              <span className="t-light block" data-s="intent-1">
                {intent.titleLight}
              </span>
              <span className="t-bold block" data-s="intent-2">
                {intent.titleBold}
              </span>
            </h2>
            <p className="t-body mt-[max(12px,calc(var(--u)*0.8))] max-w-[30em] text-[#a7a9ae]" data-s="intent-3">
              {intent.body.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < intent.body.length - 1 && (
                    <>
                      <br className="hidden md:block" />
                      <span className="md:hidden"> </span>
                    </>
                  )}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* ---- Your AI core ---- */}
        <div className="absolute inset-0" data-story="core">
          <div className="shell pt-[max(84px,7.6vh)] md:pt-[7.6vh]">
            <p className="t-eyebrow" data-s="core-0">
              {core.eyebrow}
            </p>
            <h2 id="core-title" className="t-h2 mt-[max(12px,calc(var(--u)*0.95))]">
              <span className="t-light block" data-s="core-1">
                {core.titleLight}
              </span>
              <span className="t-bold block" data-s="core-2">
                {core.titleBold}
              </span>
            </h2>
          </div>

          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[38vh] bg-gradient-to-t from-black via-black/75 to-transparent md:hidden" data-s="steps-shade" />
          <div
            className="absolute inset-x-[var(--gutter)] bottom-[max(72px,9.5vh)] md:inset-x-auto md:bottom-auto md:left-[calc(50%+var(--u)*18.25)] md:top-[82.2vh] md:w-[calc(var(--u)*20.2)]"
            data-s="steps"
          >
            <CoreSteps />
          </div>
        </div>
      </div>
    </section>
  );
}
