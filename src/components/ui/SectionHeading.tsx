import type { ElementType } from "react";

type Props = {
  eyebrow: string;
  light: string;
  bold: string;
  as?: ElementType;
  align?: "left" | "center";
  size?: "display" | "h2";
  className?: string;
};

/** The two-weight heading used throughout the reference: light first line, bold second line. */
export function SectionHeading({ eyebrow, light, bold, as: Tag = "h2", align = "left", size = "h2", className = "" }: Props) {
  const reveal = { "data-reveal": "" };
  return (
    <div className={`${align === "center" ? "text-center" : ""} ${className}`}>
      <p className="t-eyebrow" {...reveal}>
        {eyebrow}
      </p>
      <Tag className={`${size === "display" ? "t-display" : "t-h2"} mt-[max(14px,calc(var(--u)*1.1))]`} {...reveal} data-reveal-delay="0.08">
        <span className="t-light block">{light}</span>
        <span className="t-bold block">{bold}</span>
      </Tag>
    </div>
  );
}
