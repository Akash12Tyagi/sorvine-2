// GLSL for the particle scene.

/* 3D simplex noise — Ian McEwan / Stefan Gustavson, webgl-noise (MIT). */
export const noise = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
vec3 snoise3(vec3 p) {
  return vec3(snoise(p), snoise(p + vec3(31.416, -47.853, 12.793)), snoise(p + vec3(-233.145, -113.408, -185.31)));
}
`;

/*
 * Morphing particles. Every particle has a position in the shape it comes from (aFrom)
 * and the shape it is heading to (aTo); xyz + a brightness weight in w.
 * The path between them is a quadratic Bezier through a "via" point (usually the AI core),
 * which is what makes the hands rain into the core and the rings collapse into the brain.
 */
export const particlesVertex = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uDelay;
uniform mat4 uFromM;
uniform mat4 uToM;
uniform float uFromKind;
uniform float uToKind;
uniform float uFromSize;
uniform float uToSize;
uniform vec3 uVia;
uniform float uViaAmt;
uniform float uScatter;
uniform float uTurb;
uniform float uMidFade;
uniform vec2 uFadeIn;
uniform float uSwirl;
uniform float uSplit;
uniform float uLinger;
uniform float uDrift;
uniform float uFieldPhase;
uniform vec3 uMouse;
uniform float uMouseStr;
uniform float uMouseRadius;
uniform vec3 uCore;
uniform float uCoreRadius;
uniform float uCoreBody;
uniform float uSize;
uniform float uScale;
uniform float uAlpha;
uniform float uGain;
uniform vec3 uColor;
uniform vec3 uCoreColor;
uniform float uIntro;

attribute vec4 aFrom;
attribute vec4 aTo;
attribute vec4 aRand;

varying float vAlpha;
varying vec3 vColor;

${noise}

// kind: 0 static, 1 parted hands, 2 rings (orbit around the ring plane normal), 3 wave field
vec3 animateShape(vec3 p, float kind) {
  if (kind > 0.5 && kind < 1.5) {
    // on narrow screens the hands move in from the edges
    p.x += p.x < 0.0 ? uSplit : -uSplit;
  } else if (kind > 1.5 && kind < 2.5) {
    float r = length(p.xz);
    float a = uTime * 0.16 * (1.6 / (r + 0.4));
    float c = cos(a), s = sin(a);
    p.xz = mat2(c, -s, s, c) * p.xz;
  } else if (kind > 2.5) {
    float ph = uTime * 0.35 + uFieldPhase;
    p.y += sin(p.x * 0.42 + ph) * 0.26 + sin(p.z * 0.33 - ph * 0.8) * 0.32;
    p.y += snoise(vec3(p.x * 0.16, p.z * 0.16 - ph * 0.15, ph * 0.08)) * 0.55;
  }
  return p;
}

void main() {
  vec3 f = animateShape(aFrom.xyz, uFromKind);
  vec3 t = animateShape(aTo.xyz, uToKind);
  f = (uFromM * vec4(f, 1.0)).xyz;
  t = (uToM * vec4(t, 1.0)).xyz;

  // staggered progress per particle
  float d = aRand.x * uDelay;
  float k = clamp((uMorph - d) / max(1.0 - uDelay, 0.0001), 0.0, 1.0);
  // default: ease in-out. "linger": rush to the middle of the path, hang there as a cloud,
  // then settle into the new shape
  float e = uLinger > 0.5
    ? (k < 0.5 ? 0.5 * (1.0 - pow(1.0 - 2.0 * k, 3.0)) : 0.5 + 0.5 * pow(2.0 * k - 1.0, 3.0))
    : (k < 0.5 ? 4.0 * k * k * k : 1.0 - pow(-2.0 * k + 2.0, 3.0) * 0.5);

  vec3 rdir = normalize(aRand.yzw - 0.5 + 0.0001);
  vec3 pos;
  if (uLinger > 0.5) {
    // gather into a soft cloud around the via point (leaning towards the new shape),
    // then condense out of it
    vec3 cloud = uVia + (t - uVia) * 0.45 + rdir * uScatter * (0.08 + pow(aRand.w, 1.6) * 1.1);
    pos = e < 0.5 ? mix(f, cloud, smoothstep(0.0, 0.5, e)) : mix(cloud, t, smoothstep(0.5, 1.0, e));
  } else {
    vec3 mid = mix((f + t) * 0.5, uVia, uViaAmt) + rdir * uScatter * (0.35 + aRand.w);
    pos = mix(mix(f, mid, e), mix(mid, t, e), e);
  }

  float midness = sin(e * 3.14159265);

  // spin around the via point while in flight
  if (abs(uSwirl) > 0.001) {
    float a = uSwirl * midness * (0.6 + aRand.y * 0.8);
    vec2 q = pos.xz - uVia.xz;
    float c = cos(a), s = sin(a);
    pos.xz = uVia.xz + mat2(c, -s, s, c) * q;
  }

  // turbulence that peaks in the middle of a transition
  if (uTurb * midness > 0.001) {
    pos += snoise3(pos * 0.55 + vec3(0.0, uTime * 0.2, 0.0)) * uTurb * midness;
  }

  // first load: particles gather from a slightly wider cloud
  float intro = 1.0 - uIntro;
  pos += rdir * intro * intro * (0.6 + aRand.w * 1.4);

  // idle drift so nothing is ever perfectly still
  pos += snoise3(pos * 0.7 + aRand.xyz * 3.0 + uTime * 0.12) * uDrift;

  // cursor: particles flee from the pointer and swirl a little
  vec2 dm = pos.xy - uMouse.xy;
  float dist = length(dm);
  float infl = pow(smoothstep(uMouseRadius, 0.0, dist), 1.5) * uMouseStr;
  if (infl > 0.001) {
    vec3 swirl = snoise3(pos * 1.6 + uTime * 0.6);
    pos.xy += (dm / max(dist, 0.0001)) * infl * uMouseRadius * (0.3 + aRand.z * 0.75);
    pos += swirl * infl * 0.22;
  }

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float w = mix(aFrom.w, aTo.w, e);
  float stageSize = mix(uFromSize, uToSize, e);
  float size = uSize * stageSize * (0.5 + aRand.w * 1.0) * (1.0 + midness * 0.2);
  float persp = pow(10.0 / max(-mv.z, 0.1), 0.85);
  gl_PointSize = w > 0.004 ? size * uScale * 0.1 * persp : 0.0;

  float twinkle = 0.74 + 0.26 * sin(uTime * (0.8 + aRand.y * 2.4) + aRand.x * 60.0);
  float sparkle = aRand.z > 0.97 ? 1.7 : 1.0;
  float depthFade = smoothstep(0.35, 2.2, -mv.z);
  // dissolve mid-flight: leave the old shape fading, arrive in the new one fading in
  float gone = smoothstep(0.0, 0.3, e) * (1.0 - smoothstep(uFadeIn.x, uFadeIn.y, e));
  float fade = 1.0 - uMidFade * gone;
  vAlpha = uGain * w * twinkle * sparkle * uAlpha * depthFade * fade * smoothstep(0.0, 0.7, uIntro) / max(1.0, persp * 0.85);

  // particles behind the (translucent) core are seen through it
  if (pos.z < uCore.z && uCoreBody > 0.001) {
    float inside = 1.0 - smoothstep(uCoreRadius * 0.92, uCoreRadius * 1.02, length(pos.xy - uCore.xy));
    vAlpha *= 1.0 - min(0.96, uCoreBody * 2.3) * inside;
  }

  float nearCore = 1.0 - smoothstep(uCoreRadius, uCoreRadius * 1.3 + 0.15, length(pos - uCore));
  vColor = mix(uColor, uCoreColor, nearCore * 0.6);
}
`;

export const particlesFragment = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a *= a;
  float alpha = a * vAlpha;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(vColor, alpha);
}
`;

/* Particles on the shell of the AI core sphere */
export const shellVertex = /* glsl */ `
uniform float uTime;
uniform float uRadius;
uniform float uFuzz;
uniform float uSize;
uniform float uScale;
uniform float uAlpha;
uniform mat3 uRot;
attribute vec4 aRand;
varying float vAlpha;
varying float vRim;
void main() {
  vec3 dir = normalize(position);
  float r = uRadius * (1.0 + (aRand.x - 0.3) * uFuzz * 1.4 + (aRand.y - 0.5) * 0.015);
  vec3 p = uRot * dir * r;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aRand.z) * uScale * 0.1 * pow(10.0 / max(-mv.z, 0.1), 0.6);
  vec3 n = normalize(normalMatrix * (uRot * dir));
  float facing = abs(n.z);
  vRim = 1.0 - facing;
  float twinkle = 0.7 + 0.3 * sin(uTime * (1.0 + aRand.w * 3.0) + aRand.x * 40.0);
  vAlpha = uAlpha * twinkle * (0.6 + vRim * 0.45);
}
`;

export const shellFragment = /* glsl */ `
varying float vAlpha;
varying float vRim;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  float alpha = a * a * vAlpha;
  if (alpha < 0.002) discard;
  vec3 col = mix(vec3(0.62, 0.69, 0.84), vec3(0.86, 0.9, 0.98), vRim);
  gl_FragColor = vec4(col, alpha);
}
`;

/* Solid body of the core sphere: bright centre, steel blue, dark navy limb and a thin rim. */
export const sphereVertex = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vP = position;
  gl_Position = projectionMatrix * mv;
}
`;

export const sphereFragment = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uRim;
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
varying vec3 vP;
${noise}
void main() {
  float ndv = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  float rho = sqrt(1.0 - ndv * ndv); // 0 at the centre of the disc, 1 at the limb
  vec3 cCenter = vec3(0.78, 0.83, 0.91);
  vec3 cMid = vec3(0.47, 0.55, 0.69);
  vec3 cEdge = vec3(0.12, 0.17, 0.28);
  vec3 cRim = vec3(0.66, 0.73, 0.88);
  vec3 col = mix(cCenter, cMid, smoothstep(0.0, 0.42, rho));
  col = mix(col, cEdge, smoothstep(0.42, 0.86, rho));
  col *= mix(1.0, uGlow, 1.0 - smoothstep(0.0, 0.6, rho));
  float speck = snoise(vP * 26.0 + vec3(0.0, uTime * 0.35, 0.0));
  col *= 0.82 + 0.3 * smoothstep(0.1, 0.8, speck);
  col += cRim * smoothstep(0.9, 1.0, rho) * uRim;
  gl_FragColor = vec4(col, uOpacity);
}
`;

/* Camera-facing radial glow */
export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const glowFragment = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uPower;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), uPower);
  gl_FragColor = vec4(uColor, a * uIntensity);
}
`;

/* Background dust */
export const dustVertex = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uScale;
uniform float uAlpha;
attribute vec4 aRand;
varying float vAlpha;
void main() {
  vec3 p = position;
  p.x += sin(uTime * 0.05 + aRand.x * 6.28) * 0.25;
  p.y += cos(uTime * 0.04 + aRand.y * 6.28) * 0.25;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.5 + aRand.z) * uScale * 0.1 * pow(10.0 / max(-mv.z, 0.5), 0.5);
  vAlpha = uAlpha * (0.25 + 0.75 * aRand.w) * (0.6 + 0.4 * sin(uTime * (0.6 + aRand.x) + aRand.y * 30.0));
}
`;

export const dustFragment = /* glsl */ `
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.1, d);
  if (a * vAlpha < 0.003) discard;
  gl_FragColor = vec4(vec3(0.82, 0.86, 0.95), a * vAlpha);
}
`;
