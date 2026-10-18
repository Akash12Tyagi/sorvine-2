"use client";

import { useState } from "react";
import { faq } from "@/lib/content";
import { Plus } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative pb-[max(96px,14vh)] pt-[max(40px,6vh)]" aria-labelledby="faq-title">
      <div className="shell grid gap-10 md:grid-cols-[1fr_1.5fr] md:gap-[calc(var(--u)*6)]">
        <div className="md:sticky md:top-[18vh] md:self-start">
          <SectionHeading eyebrow={faq.eyebrow} light={faq.titleLight} bold={faq.titleBold} />
          <p className="t-body mt-5 max-w-[22em]" data-reveal data-reveal-delay="0.15">
            Still curious? <a href="#contact" className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white">Talk to our team</a>.
          </p>
        </div>

        <ul className="border-t border-white/[0.08]">
          {faq.items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.q} className="border-b border-white/[0.08]" data-reveal data-reveal-delay={(0.06 * i).toFixed(2)}>
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="group flex w-full items-center justify-between gap-6 py-[max(20px,calc(var(--u)*1.6))] text-left"
                  >
                    <span className={`text-[max(16px,calc(var(--u)*1.12))] font-medium tracking-[-0.02em] transition-colors ${isOpen ? "text-white" : "text-white/75 group-hover:text-white"}`}>
                      {item.q}
                    </span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[14px] transition-all duration-500 ease-[var(--ease-out-expo)] ${
                        isOpen ? "rotate-45 border-accent/50 text-accent" : "border-white/15 text-white/60 group-hover:border-white/35"
                      }`}
                      aria-hidden="true"
                    >
                      <Plus />
                    </span>
                  </button>
                </h3>
                <div
                  id={`faq-a-${i}`}
                  role="region"
                  aria-labelledby={`faq-q-${i}`}
                  className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="t-body max-w-[38em] pb-[max(22px,calc(var(--u)*1.7))]">{item.a}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
