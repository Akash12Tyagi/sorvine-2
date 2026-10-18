import { brand } from "@/lib/content";

/** Sorvine mark: a broken ring around a glowing blue core, echoing the 3D scene. */
export function LogoMark({ className = "" }: { className?: string }) {
  // 9 short arcs around the ring; the left side fades like a trail
  const segs = Array.from({ length: 9 }, (_, i) => {
    const a0 = (i / 9) * Math.PI * 2 - Math.PI / 2 + 0.16;
    const a1 = a0 + (Math.PI * 2) / 9 - 0.32;
    const r = 8.6;
    const p = (a: number) => `${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`;
    // brightest on the right, dimmer as it wraps round to the left
    const o = 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((a0 + a1) / 2));
    return { d: `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`, o };
  });
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      {segs.map((s, i) => (
        <path key={i} d={s.d} stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity={s.o.toFixed(2)} />
      ))}
      <circle cx="12" cy="12" r="3.6" fill="#8fa8f0" />
      <circle cx="12" cy="12" r="1.7" fill="#dfe7ff" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.42em] font-semibold tracking-[-0.035em] text-white ${className}`}>
      <LogoMark className="h-[1.05em] w-[1.05em]" />
      <span>{brand.name}</span>
    </span>
  );
}
