"use client";

import { useState, type FormEvent } from "react";
import { brand, footer } from "@/lib/content";
import { ArrowRight, IconGitHub, IconLinkedIn, IconX } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";

export function Footer() {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Hook this up to your email provider.
    setSent(true);
  };

  return (
    <footer id="contact" className="relative overflow-hidden border-t border-white/[0.08] bg-black/60 backdrop-blur-sm">
      <div className="shell pt-[max(64px,calc(var(--u)*6))]">
        <div className="grid gap-12 md:grid-cols-[1.3fr_2fr]">
          <div data-reveal="">
            <a href="#top" aria-label="Back to top" className="text-[22px]">
              <Logo />
            </a>
            <p className="t-body mt-4 max-w-[22em]">{brand.tagline}</p>

            <form onSubmit={onSubmit} className="mt-8 max-w-[360px]">
              <label htmlFor="newsletter" className="text-[13px] text-white/50">
                {footer.newsletterLabel}
              </label>
              <div className="mt-2 flex h-12 items-center rounded-full border border-white/10 bg-white/[0.03] pl-5 pr-1.5 transition-colors focus-within:border-accent/50">
                <input
                  id="newsletter"
                  type="email"
                  required
                  placeholder="you@company.com"
                  disabled={sent}
                  className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/30"
                />
                <button
                  type="submit"
                  disabled={sent}
                  aria-label="Subscribe"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105 disabled:bg-accent"
                >
                  <ArrowRight />
                </button>
              </div>
              <p className="mt-2 h-5 text-[13px] text-accent" aria-live="polite">
                {sent ? "Thanks, you're on the list." : ""}
              </p>
            </form>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-3" data-reveal="" data-reveal-delay="0.1">
            {footer.columns.map((col) => (
              <div key={col.title}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/35">{col.title}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#top" className="text-[14px] text-white/70 transition-colors hover:text-white">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-col-reverse items-start justify-between gap-6 border-t border-white/[0.08] py-7 text-[13px] text-white/40 sm:flex-row sm:items-center">
          <p>
            © {footer.year} {brand.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {footer.legal.map((l) => (
              <a key={l} href="#top" className="transition-colors hover:text-white">
                {l}
              </a>
            ))}
            <span className="h-4 w-px bg-white/15" aria-hidden="true" />
            <a href="#top" aria-label="X" className="text-[16px] transition-colors hover:text-white">
              <IconX />
            </a>
            <a href="#top" aria-label="LinkedIn" className="text-[16px] transition-colors hover:text-white">
              <IconLinkedIn />
            </a>
            <a href="#top" aria-label="GitHub" className="text-[16px] transition-colors hover:text-white">
              <IconGitHub />
            </a>
          </div>
        </div>
      </div>

      <p
        aria-hidden="true"
        data-reveal=""
        data-reveal-start="100"
        data-reveal-length="45"
        className="pointer-events-none select-none bg-gradient-to-b from-white/[0.14] to-transparent bg-clip-text pb-[2vw] text-center text-[21vw] font-semibold leading-[0.8] tracking-[-0.07em] text-transparent"
      >
        {brand.name}
      </p>
    </footer>
  );
}
