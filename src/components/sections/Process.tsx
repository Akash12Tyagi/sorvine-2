"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { process } from "@/lib/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

gsap.registerPlugin(ScrollTrigger);

/** Pinned timeline: the rail fills as you scroll and each step lights up in turn. */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const n = process.steps.length;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = gsap.utils.clamp(0, 1, (self.progress - 0.08) / 0.84);
        rail.current?.style.setProperty("--fill", p.toFixed(4));
        setActive(p <= 0 ? -1 : Math.min(n - 1, Math.floor(p * n + 0.0001)));
      },
    });
    return () => st.kill();
  }, []);

  return (
    <section ref={section} id="how-it-works" className="relative h-[230vh]" aria-labelledby="process-title">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div className="shell">
          <SectionHeading eyebrow={process.eyebrow} light={process.titleLight} bold={process.titleBold} align="center" className="mx-auto" />

          <div ref={rail} className="relative mt-[max(48px,calc(var(--u)*6))]" style={{ ["--fill" as string]: 0 }}>
            {/* rail */}
            <div className="absolute left-[11px] top-0 h-full w-px bg-white/[0.08] md:left-0 md:top-[7px] md:h-px md:w-full" aria-hidden="true">
              <div className="absolute left-0 top-0 h-[calc(var(--fill)*100%)] w-full bg-gradient-to-b from-accent/30 via-accent to-white shadow-[0_0_12px_rgba(163,182,243,0.6)] md:h-full md:w-[calc(var(--fill)*100%)] md:bg-gradient-to-r" />
            </div>

            <ol className="grid gap-9 md:grid-cols-4 md:gap-[calc(var(--u)*2.4)]">
              {process.steps.map((s, i) => {
                const on = i <= active;
                return (
                  <li key={s.title} className="relative pl-10 md:pl-0 md:pt-[max(40px,calc(var(--u)*3.2))]" data-reveal data-reveal-delay={(0.08 * i).toFixed(2)}>
                    <span
                      className={`absolute left-[5px] top-1 h-[13px] w-[13px] rounded-full border transition-all duration-700 ease-[var(--ease-out-expo)] md:left-0 md:top-0 ${
                        on ? "scale-100 border-white bg-white shadow-[0_0_0_5px_rgba(163,182,243,0.15),0_0_18px_rgba(163,182,243,0.9)]" : "scale-75 border-white/25 bg-black"
                      }`}
                      aria-hidden="true"
                    />
                    <p className={`font-mono text-[max(11px,calc(var(--u)*0.72))] tracking-[0.1em] transition-colors duration-700 ${on ? "text-accent" : "text-white/30"}`}>
                      0{i + 1}
                    </p>
                    <h3 className={`t-h3 mt-3 font-medium transition-colors duration-700 ${on ? "text-white" : "text-white/40"}`}>{s.title}</h3>
                    <p className={`t-body mt-2 max-w-[24em] transition-[color,opacity] duration-700 ${on ? "opacity-100" : "opacity-45"}`}>{s.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
