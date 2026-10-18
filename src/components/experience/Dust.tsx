"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { dustFragment, dustVertex } from "./shaders";

/** Faint star-like dust that fills the whole journey and gives the camera moves parallax. */
export function Dust({ count = 1800, fit }: { count?: number; fit: { current: number } }) {
  const { size, viewport } = useThree();
  const points = useRef<THREE.Points>(null);
  const { geometry, material } = useMemo(() => {
    let s = 4;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos.set([(rand() * 2 - 1) * 18, rand() * 22 - 13, rand() * -26 + 5], i * 3);
      rnd.set([rand(), rand(), rand(), rand()], i * 4);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
    const m = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uSize: { value: 0.022 }, uScale: { value: 800 }, uAlpha: { value: 0.55 } },
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((three) => {
    if (!points.current) return;
    const u = (points.current.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = three.clock.elapsedTime;
    u.uScale.value = size.height * viewport.dpr * Math.pow(fit.current, 0.75);
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />;
}
