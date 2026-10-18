import { capabilities } from "@/lib/content";
import { IconAgents, IconModels, IconShield, IconStack } from "@/components/ui/Icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SpotlightCard } from "@/components/ui/SpotlightCard";

const icons = { models: IconModels, agents: IconAgents, stack: IconStack, shield: IconShield } as const;

export function Capabilities() {
  return (
    <section id="product" className="relative pb-[max(80px,12vh)] pt-[max(120px,24vh)]" aria-labelledby="product-title">
      <div className="shell">
        <div className="grid items-end gap-8 md:grid-cols-[1.4fr_1fr] md:gap-[calc(var(--u)*6)]">
          <SectionHeading eyebrow={capabilities.eyebrow} light={capabilities.titleLight} bold={capabilities.titleBold} />
          <p className="t-lead max-w-[30em] md:justify-self-end" data-reveal data-reveal-delay="0.16">
            {capabilities.body}
          </p>
        </div>

        <div className="mt-[max(40px,calc(var(--u)*5))] grid gap-[max(12px,calc(var(--u)*1.1))] sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.items.map((item, i) => {
            const Icon = icons[item.icon];
            return (
              <SpotlightCard
                key={item.title}
                data-reveal=""
                data-reveal-delay={(0.08 * i).toFixed(2)}
                className="group rounded-[max(18px,calc(var(--u)*1.35))] p-[max(22px,calc(var(--u)*1.7))]"
              >
                <div className="grid h-[max(42px,calc(var(--u)*2.9))] w-[max(42px,calc(var(--u)*2.9))] place-items-center rounded-[max(12px,calc(var(--u)*0.85))] border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.01] text-[max(20px,calc(var(--u)*1.35))] text-accent shadow-[0_0_24px_rgba(120,145,230,0.15)]">
                  <Icon />
                </div>
                <h3 className="t-h3 mt-[max(36px,calc(var(--u)*3.6))] font-medium text-white">{item.title}</h3>
                <p className="t-body mt-[max(10px,calc(var(--u)*0.7))]">{item.body}</p>
                <span
                  className="pointer-events-none absolute right-[max(22px,calc(var(--u)*1.7))] top-[max(22px,calc(var(--u)*1.7))] font-mono text-[max(11px,calc(var(--u)*0.7))] text-white/25"
                  aria-hidden="true"
                >
                  0{i + 1}
                </span>
              </SpotlightCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
