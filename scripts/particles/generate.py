#!/usr/bin/env python3
"""
Turns the density maps in ./maps into the particle shapes used by the WebGL scene.

    python3 scripts/particles/generate.py [--count 52000] [--preview out_dir]

Writes public/particles/shapes.bin and shapes-lite.bin (every shape is shuffled with the
same permutation, so the first half of the file is an even subsample for phones).

Shapes, in file order (all share the same particle count so they can morph):
  0  hero    the two hands reaching for the spark
  1  intent  the same hands, closer and parted to the edges; particle i of the hero
             becomes particle i here, so the hands appear to turn and grow
  2  palm    one open hand under the AI core (the core sits at the origin of the palm)
  3  brain   brain around the smaller core
Rings and the wave field are cheap to build, so the browser generates them.

Binary layout (little endian):
  char[4] "PTS2" | uint32 count | uint32 shapes | float32 range
  per shape: int16[count*3] xyz (value / 32767 * range) | uint8[count] weight (0..255)
"""
import argparse
import json
import struct
from pathlib import Path

import cv2
import numpy as np
from scipy import ndimage
from scipy.spatial import cKDTree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
META = json.loads((HERE / "maps" / "maps.json").read_text())
W, H = META["width"], META["height"]
# world units per reference pixel on the z = 0 plane (camera at z = 10, vertical fov 35°)
K = 2 * 10 * np.tan(np.radians(17.5)) / H
RANGE = 8.0

ap = argparse.ArgumentParser()
ap.add_argument("--count", type=int, default=52000)
ap.add_argument("--preview", type=str, default=None)
args = ap.parse_args()
COUNT = args.count
rng = np.random.default_rng(21)


def scaled(n):
    return int(round(n * COUNT / 52000))


def read_map(name):
    img = cv2.imread(str(HERE / "maps" / f"{name}.png"), cv2.IMREAD_GRAYSCALE)
    return img.astype(np.float32) / META["mapScale"]


def sample(D, n, gamma=1.0):
    p = np.clip(D, 0, None).astype(np.float64) ** gamma
    p = p.ravel() / p.sum()
    idx = rng.choice(p.size, size=n, p=p)
    y, x = np.divmod(idx, W)
    return np.stack([x + rng.random(n), y + rng.random(n)], 1)


def to_world(px):
    return np.stack([(px[:, 0] - W / 2) * K, (H / 2 - px[:, 1]) * K], 1)


def thickness(D, sigma):
    m = ndimage.gaussian_filter((D > 3).astype(np.float32), sigma)
    return m / max(m.max(), 1e-6)


def depth_for(px, T, amp, both_sides=True):
    xi = np.clip(px[:, 0].astype(int), 0, W - 1)
    yi = np.clip(px[:, 1].astype(int), 0, H - 1)
    t = np.sqrt(T[yi, xi])
    side = np.where(rng.random(len(px)) < 0.5, -1.0, 1.0) if both_sides else 1.0
    return side * amp * t * (0.55 + 0.45 * rng.random(len(px))) + rng.normal(0, 0.012, len(px))


def extrude(D, n, edge, length_px):
    """Continue a limb past the edge of the frame (for screens wider or taller than 16:9)."""
    if edge == "left":
        prof = D[:, :4].sum(1)
        inner = D[:, 30:40].sum(1)
    elif edge == "right":
        prof = D[:, -4:].sum(1)
        inner = D[:, -40:-30].sum(1)
    else:  # bottom
        prof = D[-4:, :].sum(0)
        inner = D[-40:-30, :].sum(0)
    ax = np.arange(len(prof))
    c_edge = (prof * ax).sum() / prof.sum()
    c_in = (inner * ax).sum() / max(inner.sum(), 1e-6)
    slope = (c_edge - c_in) / 35.0  # drift of the limb's centre per pixel outwards
    pos = rng.choice(len(prof), size=n, p=prof / prof.sum()) + rng.random(n)
    t = length_px * rng.random(n) ** 0.8
    keep = rng.random(n) < (1 - t / length_px) ** 0.6
    t = np.where(keep, t, t * 0.3)
    across = pos + slope * t
    if edge == "left":
        return np.stack([-t, across], 1)
    if edge == "right":
        return np.stack([W + t, across], 1)
    return np.stack([across, H + t], 1)


def shell(n, cx, cy, r):
    v = rng.normal(size=(n, 3))
    v /= np.linalg.norm(v, axis=1, keepdims=True)
    c = to_world(np.array([[cx, cy]]))[0]
    return np.stack([c[0] + v[:, 0] * r * K, c[1] + v[:, 1] * r * K, v[:, 2] * r * K], 1)


def hilbert_index(px, order=11):
    """Position along a Hilbert curve for points in pixel space (vectorised)."""
    n = 1 << order
    lo = px.min(0)
    span = (px.max(0) - lo).max() + 1e-6
    x = np.clip(((px[:, 0] - lo[0]) / span * (n - 1)).astype(np.int64), 0, n - 1)
    y = np.clip(((px[:, 1] - lo[1]) / span * (n - 1)).astype(np.int64), 0, n - 1)
    d = np.zeros(len(px), np.int64)
    s = n >> 1
    while s > 0:
        rx = ((x & s) > 0).astype(np.int64)
        ry = ((y & s) > 0).astype(np.int64)
        d += s * s * ((3 * rx) ^ ry)
        # rotate
        flip = ry == 0
        swap_x = np.where(flip & (rx == 1), s - 1 - x, x)
        swap_y = np.where(flip & (rx == 1), s - 1 - y, y)
        x, y = np.where(flip, swap_y, swap_x), np.where(flip, swap_x, swap_y)
        s >>= 1
    return d


def similarity_icp(src, dst, iters=40):
    """Best 2D similarity (scale, rotation, translation) taking src onto dst."""
    tree_d = cKDTree(dst)
    sub = src[rng.choice(len(src), min(4000, len(src)), replace=False)]
    best = None
    mu_s, mu_d = src.mean(0), dst.mean(0)
    s0 = np.sqrt(((dst - mu_d) ** 2).sum(1).mean() / ((src - mu_s) ** 2).sum(1).mean())
    for a0 in np.radians(np.arange(-120, 121, 15)):
        s, a, t = s0, a0, mu_d - s0 * rot(a0) @ mu_s
        for _ in range(iters):
            cur = s * sub @ rot(a).T + t
            _, j = tree_d.query(cur)
            s, a, t = umeyama(sub, dst[j])
        cur = s * sub @ rot(a).T + t
        d1, _ = tree_d.query(cur)
        d2, _ = cKDTree(cur).query(dst[rng.choice(len(dst), 4000)])
        err = d1.mean() + d2.mean()
        if best is None or err < best[0]:
            best = (err, s, a, t)
    return best[1:]


def rot(a):
    return np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]])


def umeyama(a, b):
    ma, mb = a.mean(0), b.mean(0)
    A, B = a - ma, b - mb
    U, S, Vt = np.linalg.svd(B.T @ A / len(a))
    D = np.eye(2)
    if np.linalg.det(U @ Vt) < 0:
        D[1, 1] = -1
    R = U @ D @ Vt
    s = (S * np.diag(D)).sum() / (A ** 2).sum(1).mean()
    ang = np.arctan2(R[1, 0], R[0, 0])
    return s, ang, mb - s * R @ ma


def sliced_transport(src, dst, iters=250):
    """Move src towards the distribution of dst along random 1D slices (sliced OT)."""
    x = src.copy()
    for k in range(iters):
        a = rng.random() * np.pi
        d = np.array([np.cos(a), np.sin(a)])
        ps, pd = x @ d, dst @ d
        i_s, i_d = np.argsort(ps), np.argsort(pd)
        delta = np.empty(len(x))
        delta[i_s] = pd[i_d] - ps[i_s]
        x += np.outer(delta, d) * (0.6 if k < iters - 20 else 1.0)
    return x


def pair(src_px, dst_px):
    """Reorder dst so that dst[i] is a coherent partner for src[i] (same size sets)."""
    s, a, t = similarity_icp(src_px, dst_px)
    aligned = s * src_px @ rot(a).T + t
    moved = sliced_transport(aligned, dst_px)
    order_s = np.argsort(hilbert_index(np.vstack([moved, dst_px]))[: len(moved)])
    order_d = np.argsort(hilbert_index(np.vstack([moved, dst_px]))[len(moved):])
    out = np.empty_like(dst_px)
    out[order_s] = dst_px[order_d]
    return out, (s, np.degrees(a))


def jitter_w(n, mean, spread=0.15):
    return np.clip(mean * (1 + spread * (rng.random(n) * 2 - 1)), 0, 1)


# ---------------------------------------------------------------------------------------
maps = {k: read_map(k) for k in ("hero_left", "hero_right", "intent_left", "intent_right", "palm", "brain")}
sums = {k: float(v.sum()) for k, v in maps.items()}

# brightness of one particle in map units; the hero sets the reference
N_HAND = scaled(22500)
B_REF = sums["hero_left"] / N_HAND / 0.9
SIZE = {"hero": 1.0, "intent": 1.25, "palm": 1.0, "brain": 0.95}


# per-stage trim, measured by rendering each scene and comparing it with the reference
TRIM = {"hero": 1.0, "intent": 1.2, "palm": 1.09, "brain": 1.35}


def weight_for(total, n, stage):
    return min(1.0, TRIM[stage] * total / n / (B_REF * SIZE[stage] ** 2))


stages = {}

# ---- 0 hero / 1 intent ---------------------------------------------------------------
hero_parts, intent_parts = [], []
for side, edge, ext_frac in (("left", "left", 0.07), ("right", "right", 0.09)):
    Dh, Di = maps[f"hero_{side}"], maps[f"intent_{side}"]
    hp = sample(Dh, N_HAND)
    n_ext = int(N_HAND * ext_frac)
    ip = np.vstack([sample(Di, N_HAND - n_ext), extrude(Di, n_ext, edge, 260)])
    ip, (sc, ang) = pair(hp, ip)
    print(f"{side} hand: hero -> intent scale {sc:.2f}, rotation {ang:.0f} deg")
    Th, Ti = thickness(Dh, 5), thickness(Di, 9)
    hz = depth_for(hp, Th, 0.11)
    # keep each particle on the same side (front / back) of the hand
    iz = np.abs(depth_for(np.clip(ip, 0, [W - 1, H - 1]), Ti, 0.2, both_sides=False)) * np.sign(hz)
    hw = jitter_w(N_HAND, weight_for(sums[f"hero_{side}"], N_HAND, "hero"))
    iw = jitter_w(N_HAND, weight_for(sums[f"intent_{side}"] * (1 + ext_frac), N_HAND, "intent"))
    # past the frame edge the limb fades out
    if edge == "left":
        iw *= np.clip(1 + ip[:, 0] / 260, 0, 1) ** 0.7
    else:
        iw *= np.clip(1 - (ip[:, 0] - W) / 260, 0, 1) ** 0.7
    hero_parts.append(np.column_stack([to_world(hp), hz, hw]))
    intent_parts.append(np.column_stack([to_world(ip), iz, iw]))

hero_hands = np.vstack(hero_parts)
intent_hands = np.vstack(intent_parts)

# spark: a tight knot of particles where the fingertips meet; it opens into a haze behind
# the intent copy
sx, sy = META["heroSpark"]
n_orb = scaled(1500)
orb_h = np.column_stack([to_world(np.array([[sx, sy]]) + rng.normal(0, 9.0, (n_orb, 2))), rng.normal(0, 0.08, n_orb), jitter_w(n_orb, 0.5, 0.4)])
orb_i = np.column_stack([to_world(np.array([[480, 230]]) + rng.normal(0, 60, (n_orb, 2)) * [1.4, 0.8]), rng.normal(0, 0.3, n_orb), jitter_w(n_orb, 0.12, 0.5)])

# aura: loose particles around the hands; in the intent they keep their place relative
# to the nearest bit of hand, scaled with it
n_aura = COUNT - len(hero_hands) - n_orb
halo_map = ndimage.gaussian_filter(maps["hero_left"] + maps["hero_right"], 10)
halo_map = np.clip(halo_map - (maps["hero_left"] + maps["hero_right"]) * 0.35, 0, None)
aura_px = sample(halo_map, n_aura)
aura_w = to_world(aura_px)
tree = cKDTree(hero_hands[:, :2])
_, nn = tree.query(aura_w)
off = aura_w - hero_hands[nn, :2]
aura_h = np.column_stack([aura_w + rng.normal(0, 0.03, (n_aura, 2)), rng.normal(0, 0.18, n_aura), jitter_w(n_aura, 0.2, 0.5)])
aura_i = np.column_stack([intent_hands[nn, :2] + off * 1.9, rng.normal(0, 0.35, n_aura), jitter_w(n_aura, 0.16, 0.5)])

stages["hero"] = np.vstack([hero_hands, orb_h, aura_h])
stages["intent"] = np.vstack([intent_hands, orb_i, aura_i])

# ---- 2 palm ---------------------------------------------------------------------------
pcx, pcy, pr = META["palmSphere"]
n_palm = scaled(40000)
n_ext = int(n_palm * 0.05)
pp = np.vstack([sample(maps["palm"], n_palm - n_ext), extrude(maps["palm"], n_ext, "bottom", 220)])
Tp = thickness(maps["palm"], 8)
pz = depth_for(np.clip(pp, 0, [W - 1, H - 1]), Tp, 0.16)
pw = jitter_w(n_palm, weight_for(sums["palm"] * 1.05, n_palm, "palm"))
pw *= np.clip(1 - (pp[:, 1] - H) / 220, 0, 1) ** 0.7
n_paura = scaled(3000)
pa_map = np.clip(ndimage.gaussian_filter(maps["palm"], 12) - maps["palm"] * 0.3, 0, None)
pa = sample(pa_map, n_paura)
n_hidden = COUNT - n_palm - n_paura
stages["palm"] = np.vstack([
    np.column_stack([to_world(pp), pz, pw]),
    np.column_stack([to_world(pa), rng.normal(0, 0.2, n_paura), jitter_w(n_paura, 0.18, 0.5)]),
    np.column_stack([shell(n_hidden, pcx, pcy, pr * 0.97), np.zeros(n_hidden)]),
])

# ---- 3 brain --------------------------------------------------------------------------
bcx, bcy, br = META["brainSphere"]
n_brain = scaled(26000)
bp = sample(maps["brain"], n_brain, gamma=1.15)
Tb = thickness(maps["brain"], 22)
bz = depth_for(bp, Tb, 0.55)
bw = jitter_w(n_brain, weight_for(sums["brain"], n_brain, "brain") * 1.05, 0.3)
n_bdust = scaled(4000)
bd_map = np.clip(ndimage.gaussian_filter(maps["brain"], 16) - maps["brain"] * 0.2, 0, None)
bd = sample(bd_map, n_bdust)
n_hidden = COUNT - n_brain - n_bdust
stages["brain"] = np.vstack([
    np.column_stack([to_world(bp), bz, bw]),
    np.column_stack([to_world(bd), rng.normal(0, 0.35, n_bdust), jitter_w(n_bdust, 0.14, 0.5)]),
    np.column_stack([shell(n_hidden, bcx, bcy, br * 0.95), np.zeros(n_hidden)]),
])

# ---------------------------------------------------------------------------------------
order = ["hero", "intent", "palm", "brain"]
for k in ("palm", "brain"):  # independent shapes: random order
    stages[k] = stages[k][rng.permutation(COUNT)]
perm = rng.permutation(COUNT)  # one shared permutation keeps hero[i] <-> intent[i]
for k in order:
    assert stages[k].shape == (COUNT, 4), (k, stages[k].shape)
    stages[k] = stages[k][perm]


def encode(count):
    out = bytearray(struct.pack("<4sIIf", b"PTS2", count, len(order), RANGE))
    for k in order:
        a = stages[k][:count]
        q = np.clip(np.round(a[:, :3] / RANGE * 32767), -32767, 32767).astype("<i2")
        w = np.clip(np.round(a[:, 3] * 255), 0, 255).astype(np.uint8)
        out += q.tobytes() + w.tobytes()
    return bytes(out)


dst = ROOT / "public" / "particles"
dst.mkdir(parents=True, exist_ok=True)
for name, count in (("shapes.bin", COUNT), ("shapes-lite.bin", COUNT // 2)):
    (dst / name).write_bytes(encode(count))
    print(f"wrote public/particles/{name}: {count} particles x {len(order)} shapes ({(dst / name).stat().st_size // 1024} KB)")

stats = {k: dict(n=int((v[:, 3] > 0.004).sum()), w=float(v[:, 3][v[:, 3] > 0.004].mean())) for k, v in stages.items()}
print("visible particles / mean weight:", stats)

if args.preview:
    out = Path(args.preview)
    out.mkdir(parents=True, exist_ok=True)
    for k in order:
        a = stages[k]
        x = a[:, 0] / K + W / 2
        y = H / 2 - a[:, 1] / K
        img = np.zeros((H, W), np.float32)
        ok = (x >= 0) & (x < W) & (y >= 0) & (y < H)
        np.add.at(img, (y[ok].astype(int), x[ok].astype(int)), a[ok, 3] * SIZE[k] ** 2)
        img = ndimage.gaussian_filter(img, 0.6) * B_REF * 1.4
        cv2.imwrite(str(out / f"stage_{k}.png"), np.clip(img, 0, 255).astype(np.uint8))
