"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { env, pointer, progress } from "@/lib/scene-store";
import { choreograph, createSceneState } from "./choreography";
import { CoreSphere } from "./CoreSphere";
import { Dust } from "./Dust";
import { Particles } from "./Particles";
import { loadShapes, type ShapeSet } from "./shapes";

const DESIGN_ASPECT = 16 / 9;
/** visible height of the z = 0 plane from the camera at z = 10 (fov 35°) */
const PLANE_HEIGHT = 2 * 10 * Math.tan(THREE.MathUtils.degToRad(17.5));

export function Scene({ particleCount, density }: { particleCount: number; density: number }) {
  const { camera, size } = useThree();
  const state = useMemo(() => createSceneState(), []);
  const [shapes, setShapes] = useState<ShapeSet | null>(null);

  const fit = useRef(1);
  const mouse = useMemo(() => new THREE.Vector3(99, 99, 0), []);
  const mouseTarget = useMemo(() => new THREE.Vector3(99, 99, 0), []);
  const mouseStrength = useRef(0);
  const parallax = useRef({ x: 0, y: 0 });
  const ndc = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let alive = true;
    const file = particleCount > 26000 ? "/particles/shapes.bin" : "/particles/shapes-lite.bin";
    loadShapes(file, particleCount, density)
      .then((s) => alive && setShapes(s))
      .catch((err) => console.error(err));
    return () => {
      alive = false;
    };
  }, [particleCount, density]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20);

    // Fit the 16:9 composition into narrower (portrait) screens by pulling the camera back.
    const aspect = size.width / size.height;
    fit.current = Math.max(1, (DESIGN_ASPECT / aspect) * 0.52);
    const f = fit.current;

    choreograph(state, progress.s, PLANE_HEIGHT * f);

    // subtle pointer parallax on the camera
    const px = pointer.active && !env.reducedMotion ? pointer.x : 0;
    const py = pointer.active && !env.reducedMotion ? pointer.y : 0;
    parallax.current.x += (px * 0.12 - parallax.current.x) * (1 - Math.exp(-dt * 2.5));
    parallax.current.y += (py * 0.07 - parallax.current.y) * (1 - Math.exp(-dt * 2.5));

    const c = state.cam;
    camera.position.set(c.x + parallax.current.x, c.y * f + parallax.current.y, c.z * f);
    camera.lookAt(0, c.ty * f, 0);
    camera.updateMatrixWorld();

    // pointer → world position on the z = 0 plane
    if (pointer.active) {
      ndc.set(pointer.x, pointer.y, 0.5).unproject(camera).sub(camera.position).normalize();
      const dist = -camera.position.z / ndc.z;
      mouseTarget.copy(camera.position).addScaledVector(ndc, dist);
    }
    const idle = performance.now() / 1000 - pointer.lastMove > 2.5;
    const targetStrength = pointer.active && !env.reducedMotion && !idle ? state.mouse : 0;
    mouseStrength.current += (targetStrength - mouseStrength.current) * (1 - Math.exp(-dt * (targetStrength > mouseStrength.current ? 3 : 1.2)));
    if (mouse.x > 90) mouse.copy(mouseTarget);
    mouse.lerp(mouseTarget, 1 - Math.exp(-dt * 6));
  }, -1);

  return (
    <>
      <Dust fit={fit} count={env.isMobile ? 900 : 1800} />
      <CoreSphere state={state} fit={fit} />
      {shapes && <Particles shapes={shapes} state={state} mouse={mouse} mouseStrength={mouseStrength} fit={fit} />}
    </>
  );
}
