import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const ArrowRight = (p: P) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" {...base} strokeWidth={1.7} aria-hidden="true" {...p}>
    <path d="M3.5 8h9M8.5 4l4 4-4 4" />
  </svg>
);

export const Globe = (p: P) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" {...base} strokeWidth={1.3} aria-hidden="true" {...p}>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M1.8 8h12.4M8 1.8c1.7 1.8 2.5 3.9 2.5 6.2S9.7 12.4 8 14.2C6.3 12.4 5.5 10.3 5.5 8S6.3 3.6 8 1.8Z" />
  </svg>
);

export const Menu = (p: P) => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <path d="M3 7h14M3 13h14" />
  </svg>
);

export const Close = (p: P) => (
  <svg viewBox="0 0 20 20" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);

export const Check = (p: P) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" {...base} strokeWidth={1.6} aria-hidden="true" {...p}>
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

export const Plus = (p: P) => (
  <svg viewBox="0 0 16 16" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const IconModels = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <path d="M12 3 4 7.5l8 4.5 8-4.5L12 3Z" />
    <path d="m4 12 8 4.5 8-4.5" />
    <path d="m4 16.5 8 4.5 8-4.5" />
  </svg>
);

export const IconAgents = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    <circle cx="12" cy="12" r="3.2" />
  </svg>
);

export const IconStack = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <circle cx="6" cy="6" r="2.2" />
    <circle cx="18" cy="6" r="2.2" />
    <circle cx="6" cy="18" r="2.2" />
    <circle cx="18" cy="18" r="2.2" />
    <path d="M8.2 6h7.6M6 8.2v7.6M18 8.2v7.6M8.2 18h7.6M7.6 7.6l8.8 8.8" />
  </svg>
);

export const IconShield = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" {...base} aria-hidden="true" {...p}>
    <path d="M12 3 5 6v5.5c0 4.3 2.9 7.9 7 9.5 4.1-1.6 7-5.2 7-9.5V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const IconX = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.3l-4.9-6.4L5.2 21H2.1l7.3-8.3L1.8 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.3 4.7H5.5l11.2 14.5Z" />
  </svg>
);

export const IconLinkedIn = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96ZM3 9.75h3.96V21H3V9.75Zm6.5 0h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4 0 4.75 2.64 4.75 6.06V21h-3.96v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.32-1.96 2.69V21H9.5V9.75Z" />
  </svg>
);

export const IconGitHub = (p: P) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
  </svg>
);
