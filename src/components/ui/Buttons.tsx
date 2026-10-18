import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";

type Props = { href: string; children: ReactNode; className?: string };

export function PrimaryButton({ href, children, className = "" }: Props) {
  return (
    <a href={href} className={`btn btn-primary ${className}`}>
      <span>{children}</span>
      <span className="btn-arrow">
        <ArrowRight className="h-[45%] w-[45%]" />
      </span>
    </a>
  );
}

export function GhostButton({ href, children, className = "" }: Props) {
  return (
    <a href={href} className={`btn btn-ghost ${className}`}>
      {children}
    </a>
  );
}
