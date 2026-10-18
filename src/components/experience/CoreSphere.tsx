"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneState } from "./choreography";
import { glowFragment, glowVertex, shellFragment, shellVertex, sphereFragment, sphereVertex } from "./shaders";

const SHELL_COUNT = 4200;

function makeGlow(color: string, power: number) {
  return new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 1 },
      uPower: { value: power },
    },
  });
}

/** The glowing "AI core": a solid sphere, a shell of particles, an inner glow and a soft halo. */
export function CoreSphere({ state, fit }: { state: SceneState; fit: { current: number } }) {
  const { camera, size, viewport } = useThree();
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const shellPoints = useRef<THREE.Points>(null);
  const rot = useMemo(() => new THREE.Matrix3(), []);
  const euler = useMemo(() => new THREE.Euler(), []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);

  const sphereMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: sphereVertex,
        fragmentShader: sphereFragment,
        transparent: true,
        // particles behind the core are dimmed in their own shader instead of depth-culled
        depthWrite: false,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 }, uRim: { value: 0.6 }, uGlow: { value: 1 } },
      }),
    [],
  );
  const glowMat = useMemo(() => makeGlow("#aebbd8", 2.6), []);
  // colours are linearised by three.js, so the hex values look brighter than the result
  const haloMat = useMemo(() => makeGlow("#6679a8", 1.9), []);

  const shell = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(SHELL_COUNT * 3);
    const rnd = new Float32Array(SHELL_COUNT * 4);
    let s = 9;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
    for (let i = 0; i < SHELL_COUNT; i++) {
      const z = rand() * 2 - 1;
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      pos.set([Math.cos(a) * r, z, Math.sin(a) * r], i * 3);
      rnd.set([rand(), rand(), rand(), rand()], i * 4);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    const mat = new THREE.ShaderMaterial({
      vertexShader: shellVertex,
      fragmentShader: shellFragment,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uRadius: { value: 0.7 },
        uFuzz: { value: 0 },
        uSize: { value: 0.026 },
        uScale: { value: 800 },
        uAlpha: { value: 0 },
        uRot: { value: new THREE.Matrix3() },
      },
    });
    return { g, mat };
  }, []);

  useEffect(
    () => () => {
      sphereMat.dispose();
      glowMat.dispose();
      haloMat.dispose();
      shell.g.dispose();
      shell.mat.dispose();
    },
    [sphereMat, glowMat, haloMat, shell],
  );

  useFrame((three) => {
    const t = three.clock.elapsedTime;
    const sp = state.sphere;
    const r = Math.max(0.0001, sp.radius);
    const visible = sp.radius > 0.004;
    if (group.current) {
      group.current.visible = visible || sp.glow > 0.01 || sp.halo > 0.01;
      group.current.position.set(sp.x, sp.y, 0);
    }

    if (body.current) {
      body.current.scale.setScalar(r);
      body.current.visible = visible && sp.body > 0.01;
      const bu = (body.current.material as THREE.ShaderMaterial).uniforms;
      bu.uTime.value = t;
      bu.uOpacity.value = sp.body;
      bu.uRim.value = sp.rim;
      bu.uGlow.value = 0.78 + sp.glow * 0.3;
    }

    euler.set(t * 0.05, t * 0.11, 0);
    m4.makeRotationFromEuler(euler);
    rot.setFromMatrix4(m4);
    if (shellPoints.current) {
      const su = (shellPoints.current.material as THREE.ShaderMaterial).uniforms;
      su.uTime.value = t;
      su.uRadius.value = r * 1.012;
      su.uFuzz.value = sp.fuzz;
      su.uAlpha.value = sp.shell;
      su.uRot.value.copy(rot);
      su.uScale.value = size.height * viewport.dpr * Math.pow(fit.current, 0.75);
      shellPoints.current.visible = sp.shell > 0.005;
    }

    // billboards
    for (const [mesh, intensity, scale] of [
      [glow.current, sp.glow, sp.glowSize],
      [halo.current, sp.halo, sp.haloSize],
    ] as const) {
      if (!mesh) continue;
      mesh.quaternion.copy(camera.quaternion);
      mesh.scale.setScalar(scale * 2);
      (mesh.material as THREE.ShaderMaterial).uniforms.uIntensity.value = intensity;
      mesh.visible = intensity > 0.005;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={halo} material={haloMat} renderOrder={0} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <mesh ref={body} material={sphereMat} renderOrder={1}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <points ref={shellPoints} geometry={shell.g} material={shell.mat} renderOrder={3} frustumCulled={false} />
      <mesh ref={glow} material={glowMat} renderOrder={4} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </group>
  );
}
