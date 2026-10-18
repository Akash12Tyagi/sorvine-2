"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneState } from "./choreography";
import { particlesFragment, particlesVertex } from "./shaders";
import { CORE, STAGE, STAGE_KIND, STAGE_SIZE, type ShapeSet } from "./shapes";

type Props = {
  shapes: ShapeSet;
  state: SceneState;
  mouse: THREE.Vector3;
  mouseStrength: { current: number };
  fit: { current: number };
};

/** brightness per particle at the desktop particle count */
const GAIN = 0.53;
const REFERENCE_COUNT = 104000;

const tmpA = new THREE.Matrix4();
const tmpB = new THREE.Matrix4();

/** World placement of each stage's point cloud (stage-specific idle motion included). */
function placement(stage: number, s: SceneState, time: number, out: THREE.Matrix4) {
  switch (stage) {
    case STAGE.hero:
      return out.makeTranslation(0, s.heroLift + s.heroDrop, 0);
    case STAGE.intent:
      return out.makeTranslation(0, s.intentLift + Math.sin(time * 0.6) * 0.012, 0);
    case STAGE.palm:
      return out.makeTranslation(0, Math.sin(time * 0.7) * 0.02, 0);
    case STAGE.rings:
      // ring plane tilted towards the camera, centred on the Reason core
      tmpA.makeRotationX(CORE.ringTilt);
      tmpB.makeRotationZ(-0.02);
      out.multiplyMatrices(tmpB, tmpA);
      out.setPosition(CORE.rings.x, CORE.rings.y, 0);
      return out;
    case STAGE.brain: {
      // a slow sway around the core keeps the flat-sampled brain alive without showing its depth
      tmpA.makeTranslation(-CORE.act.x, -CORE.act.y, 0);
      tmpB.makeRotationY(Math.sin(time * 0.23) * 0.09);
      out.multiplyMatrices(tmpB, tmpA);
      tmpA.makeRotationX(Math.sin(time * 0.17) * 0.04);
      out.premultiply(tmpA);
      tmpA.makeTranslation(CORE.act.x, CORE.act.y + Math.sin(time * 0.5) * 0.02, 0);
      return out.premultiply(tmpA);
    }
    case STAGE.field:
      return out.makeTranslation(0, -2.55, -1.5);
    default:
      return out.makeTranslation(0, s.ctaLift + s.heroDrop, 0);
  }
}

export function Particles({ shapes, state, mouse, mouseStrength, fit }: Props) {
  const { size, viewport } = useThree();
  const segment = useRef(-1);
  const intro = useRef(0);
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // three.js derives the draw count from `position`; the shader never reads it.
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(shapes.count), 1));
    g.setAttribute("aFrom", shapes.stages[0]);
    g.setAttribute("aTo", shapes.stages[1]);
    g.setAttribute("aRand", shapes.random);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1000);
    return g;
  }, [shapes]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particlesVertex,
        fragmentShader: particlesFragment,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uDelay: { value: 0.5 },
          uFromM: { value: new THREE.Matrix4() },
          uToM: { value: new THREE.Matrix4() },
          uFromKind: { value: 0 },
          uToKind: { value: 0 },
          uFromSize: { value: 1 },
          uToSize: { value: 1 },
          uVia: { value: new THREE.Vector3() },
          uViaAmt: { value: 0 },
          uScatter: { value: 0 },
          uTurb: { value: 0 },
          uMidFade: { value: 0 },
          uFadeIn: { value: new THREE.Vector2(0.55, 0.92) },
          uSwirl: { value: 0 },
          uSplit: { value: 0 },
          uLinger: { value: 0 },
          uDrift: { value: 0.012 },
          uFieldPhase: { value: 0 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uMouseStr: { value: 0 },
          uMouseRadius: { value: 1 },
          uCore: { value: new THREE.Vector3() },
          uCoreRadius: { value: 0.1 },
          uCoreBody: { value: 0 },
          uSize: { value: 0.019 },
          uGain: { value: GAIN },
          uScale: { value: 800 },
          uAlpha: { value: 1 },
          uColor: { value: new THREE.Color(0.86, 0.88, 0.92) },
          uCoreColor: { value: new THREE.Color(0.58, 0.68, 0.98) },
          uIntro: { value: 0 },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((three, dt) => {
    const obj = points.current;
    if (!obj) return;
    const geo = obj.geometry;
    const u = (obj.material as THREE.ShaderMaterial).uniforms;
    const time = three.clock.elapsedTime;
    const last = shapes.stages.length - 1;
    const M = Math.min(last, Math.max(0, state.morph));
    let i = Math.floor(M);
    let t = M - i;
    if (i >= last) {
      i = last - 1;
      t = 1;
    }
    if (i !== segment.current) {
      geo.setAttribute("aFrom", shapes.stages[i]);
      geo.setAttribute("aTo", shapes.stages[i + 1]);
      segment.current = i;
    }

    const tr = state.tr;
    u.uTime.value = time;
    u.uMorph.value = t;
    u.uDelay.value = tr.delay;
    u.uFromKind.value = STAGE_KIND[i];
    u.uToKind.value = STAGE_KIND[i + 1];
    u.uFromSize.value = STAGE_SIZE[i];
    u.uToSize.value = STAGE_SIZE[i + 1];
    placement(i, state, time, u.uFromM.value);
    placement(i + 1, state, time, u.uToM.value);
    u.uVia.value.set(...tr.via);
    u.uViaAmt.value = tr.viaAmt;
    u.uScatter.value = tr.scatter;
    u.uTurb.value = tr.turb;
    u.uMidFade.value = tr.midFade;
    u.uFadeIn.value.set(tr.fadeIn[0], tr.fadeIn[1]);
    u.uSwirl.value = tr.swirl;
    u.uSplit.value = state.handSplit;
    u.uLinger.value = tr.linger ? 1 : 0;
    u.uFieldPhase.value = state.fieldPhase;
    u.uMouse.value.copy(mouse);
    u.uMouseStr.value = mouseStrength.current;
    u.uMouseRadius.value = state.mouseRadius;
    u.uCore.value.set(state.sphere.x, state.sphere.y, 0);
    u.uCoreRadius.value = Math.max(0.12, state.sphere.radius);
    u.uCoreBody.value = state.sphere.radius > 0.08 ? state.sphere.body : 0;
    u.uAlpha.value = state.alpha;
    // fewer particles on phones: each one is a little brighter so the shapes keep their weight
    u.uGain.value = GAIN * Math.pow(REFERENCE_COUNT / shapes.count, 0.75);
    u.uScale.value = size.height * viewport.dpr * Math.pow(fit.current, 0.75);
    // first load only: a quick gather, then the scroll is in charge
    intro.current = Math.min(1, intro.current + Math.min(dt, 1 / 30) / 1.4);
    u.uIntro.value = 1 - Math.pow(1 - intro.current, 3);
  });

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />;
}
