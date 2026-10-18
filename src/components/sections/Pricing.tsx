"use client";

import { useState } from "react";
import { pricing } from "@/lib/content";
import { GhostButton, PrimaryButton } from "@/components/ui/Buttons";
import { Check } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="relative py-[max(96px,16vh)]" aria-labelledby="pricing-title">
      <div className="shell">
        <SectionHeading eyebrow={pricing.eyebrow} light={pricing.titleLight} bold={pricing.titleBold} align="center" />

        <div className="mt-[max(28px,calc(var(--u)*2.4))] flex justify-center" data-reveal data-reveal-delay="0.15">
          <div role="group" aria-label="Billing period" className="relative flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-[max(13px,calc(var(--u)*0.78))] font-medium backdrop-blur">
            <span
              aria-hidden="true"
              className="absolute bottom-1 top-1 w-[calc(50%-4px)] rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.25)] transition-transform duration-500 ease-[var(--ease-out-expo)]"
              style={{ transform: `translateX(${yearly ? "100%" : "0"})` }}
            />
            {[
              { label: "Monthly", on: !yearly, set: false },
              { label: "Yearly", on: yearly, set: true },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                aria-pressed={b.on}
                onClick={() => setYearly(b.set)}
                className={`relative z-10 w-[max(112px,calc(var(--u)*7.6))] rounded-full py-2 transition-colors duration-300 ${b.on ? "text-black" : "text-white/60 hover:text-white"}`}
              >
                {b.label}
                {b.set && <span className={`ml-1.5 text-[0.85em] ${b.on ? "text-[#4a5fa8]" : "text-accent"}`}>−20%</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-[max(36px,calc(var(--u)*3.6))] grid max-w-[calc(var(--u)*78)] gap-[max(14px,calc(var(--u)*1.2))] lg:grid-cols-3">
          {pricing.plans.map((plan, i) => {
            const price = plan.monthly === null ? null : yearly ? Math.round((plan.monthly * 0.8) / 10) * 10 : plan.monthly;
            return (
              <SpotlightCard
                key={plan.name}
                data-reveal=""
                data-reveal-delay={(0.08 * i).toFixed(2)}
                className={`flex flex-col rounded-[max(20px,calc(var(--u)*1.5))] p-[max(24px,calc(var(--u)*2))] ${
                  plan.featured ? "border-accent/35 shadow-[0_0_0_1px_rgba(163,182,243,0.08),0_30px_80px_-30px_rgba(111,138,230,0.45)]" : ""
                }`}
              >
                {plan.featured && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-accent to-transparent"
                  />
                )}
                <div className="flex items-center justify-between">
                  <h3 className="t-h3 font-medium text-white">{plan.name}</h3>
                  {plan.featured && (
                    <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                      Most popular
                    </span>
                  )}
                </div>
                <p className="t-body mt-2">{plan.blurb}</p>
                <div className="mt-[max(24px,calc(var(--u)*2))] flex items-end gap-2">
                  <span className="text-[max(38px,calc(var(--u)*3))] font-semibold leading-none tracking-[-0.05em] text-white tabular-nums">
                    {price === null ? "Custom" : fmt(price)}
                  </span>
                  {price !== null && <span className="pb-1 text-[13px] text-white/45">/ month{yearly ? ", billed yearly" : ""}</span>}
                </div>
                <div className="mt-[max(22px,calc(var(--u)*1.8))]">
                  {plan.featured ? (
                    <PrimaryButton href="#contact" className="w-full justify-between">
                      {plan.cta}
                    </PrimaryButton>
                  ) : (
                    <GhostButton href="#contact" className="w-full">
                      {plan.cta}
                    </GhostButton>
                  )}
                </div>
                <ul className="mt-[max(24px,calc(var(--u)*2))] space-y-3 border-t border-white/[0.07] pt-[max(20px,calc(var(--u)*1.6))]">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-[max(14px,calc(var(--u)*0.86))] text-white/75">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 text-[12px] text-accent">
                        <Check />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
