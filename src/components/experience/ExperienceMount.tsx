"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the scene is never server-rendered.
const Experience = dynamic(() => import("./Experience"), { ssr: false });

export function ExperienceMount() {
  return <Experience />;
}
