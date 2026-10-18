"use client";

import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { env, pointer } from "@/lib/scene-store";
import { Scene } from "./Scene";

/** Fixed full-screen WebGL layer that sits behind the whole page. */
export default function Experience() {
  const [config] = useState(() => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    const lowMemory = typeof navigator !== "undefined" && "deviceMemory" in navigator && (navigator as { deviceMemory?: number }).deviceMemory! <= 4;
    env.isMobile = isMobile;
    // downloaded particles × density = drawn particles (desktop ~104k, phones ~45k)
    return {
      count: isMobile || lowMemory ? 26000 : 52000,
      density: isMobile ? 1.75 : lowMemory ? 1.5 : 2,
      dpr: (isMobile ? [1, 1.5] : [1, 1.75]) as [number, number],
    };
  });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.active = true;
      pointer.lastMove = performance.now() / 1000;
    };
    const leave = () => {
      pointer.active = false;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={config.dpr}
        gl={{ antialias: false, alpha: false, stencil: false, powerPreference: "high-performance" }}
        camera={{ fov: 35, near: 0.1, far: 140, position: [0, 0, 10] }}
        style={{ pointerEvents: "none" }}
      >
        <color attach="background" args={["#000000"]} />
        <Scene particleCount={config.count} density={config.density} />
      </Canvas>
    </div>
  );
}
