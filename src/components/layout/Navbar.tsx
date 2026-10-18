"use client";

import { useEffect, useState } from "react";
import { nav } from "@/lib/content";
import { TL } from "@/lib/timeline";
import { getLenis } from "@/components/scroll/SmoothScroll";
import { Close, Globe, Menu } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";

export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#top");

  // Stays while the hero scrolls out, blurs away once the story takes over the screen,
  // and comes back whenever you scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 0.62) setHidden(false);
      else if (y > last + 4) setHidden(true);
      else if (y < last - 6) setHidden(false);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the link of the part of the page on screen: the pinned story by scroll
  // position, the other sections by what sits under the reading line (45% down).
  useEffect(() => {
    const ids = nav.links.map((l) => l.href).filter((h) => h.length > 1 && h !== "#intent" && h !== "#core");
    let raf = 0;
    const update = () => {
      raf = 0;
      const s = window.scrollY / window.innerHeight;
      let current = "";
      if (s < 0.6) current = "#top";
      else if (s < 2.9) current = "#intent";
      else if (s < TL.end) current = "#core";
      const line = window.innerHeight * 0.45;
      for (const id of ids) {
        const r = document.querySelector(id)?.getBoundingClientRect();
        if (r && r.top <= line && r.bottom > line) current = id;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  const group = (delay: number) => ({
    className:
      "transition-[opacity,filter,transform] duration-700 ease-[var(--ease-out-expo)] data-[hidden=true]:pointer-events-none data-[hidden=true]:-translate-y-2 data-[hidden=true]:opacity-0 data-[hidden=true]:blur-[8px]",
    style: { transitionDelay: `${hidden ? delay : 0.18 - delay}s` },
    "data-hidden": hidden && !open,
  });

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50">
        <div className="shell relative flex h-[max(64px,calc(var(--u)*4.27))] items-center justify-between">
          <div {...group(0)} className={`${group(0).className} relative z-10`}>
            <a href="#top" aria-label="Home" className="block translate-y-[calc(var(--u)*0.12)] text-[max(17px,calc(var(--u)*1.3))]">
              <Logo />
            </a>
          </div>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <nav aria-label="Main" {...group(0.06)}>
            <ul className="flex h-[max(38px,calc(var(--u)*2.6))] items-center rounded-full border border-white/[0.07] bg-[#171717]/90 px-[max(3px,calc(var(--u)*0.2))] backdrop-blur-md">
              {nav.links.map((l) => {
                const isActive = active === l.href;
                return (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block rounded-full px-[max(10px,calc(var(--u)*0.87))] py-[0.45em] text-[max(11px,calc(var(--u)*0.72))] font-medium transition-colors duration-300 ${
                        isActive ? "text-white" : "text-[#8f8f8f] hover:text-white"
                      }`}
                    >
                      {l.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
          </div>

          <div {...group(0.12)} className={`${group(0.12).className} relative z-10 hidden items-center gap-[max(6px,calc(var(--u)*0.62))] md:flex`}>
            <button
              type="button"
              className="flex h-[max(30px,calc(var(--u)*2.24))] items-center gap-[0.5em] rounded-full border border-white/[0.1] px-[max(11px,calc(var(--u)*0.95))] text-[max(11px,calc(var(--u)*0.72))] font-medium text-white/75 transition-colors hover:border-white/30 hover:text-white"
              aria-label="Language: English"
            >
              <Globe className="h-[1.05em] w-[1.05em] opacity-70" />
              {nav.language}
            </button>
            <a
              href={nav.login.href}
              className="flex h-[max(30px,calc(var(--u)*2.24))] items-center rounded-full border border-white/[0.16] px-[max(14px,calc(var(--u)*1.3))] text-[max(11px,calc(var(--u)*0.76))] font-medium text-white transition-colors hover:border-white/50 hover:bg-white/[0.04]"
            >
              {nav.login.label}
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/40 text-xl backdrop-blur md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <Close /> : <Menu />}
          </button>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 bg-black/80 backdrop-blur-xl transition-[opacity,visibility] duration-500 md:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <nav className="shell flex h-full flex-col justify-center gap-2 pb-10 pt-24" aria-label="Mobile">
          {nav.links.map((l, i) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`text-[38px] font-light tracking-[-0.04em] text-white transition-[opacity,transform,filter] duration-700 ease-[var(--ease-out-expo)] ${
                open ? "translate-y-0 opacity-100 blur-0" : "translate-y-4 opacity-0 blur-sm"
              }`}
              style={{ transitionDelay: open ? `${0.05 + i * 0.04}s` : "0s" }}
            >
              {l.label}
            </a>
          ))}
          <div className="mt-8 flex gap-3">
            <a href={nav.login.href} onClick={() => setOpen(false)} className="btn btn-ghost">
              {nav.login.label}
            </a>
            <button type="button" className="btn btn-ghost gap-2" aria-label="Language: English">
              <Globe /> {nav.language}
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
