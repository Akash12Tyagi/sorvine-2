#!/usr/bin/env python3
"""
Builds the particle density maps from the design reference video.

    python3 scripts/particles/extract_maps.py <reference.mp4>

For each scene it averages the frames where that scene is still (which removes the
twinkle and the video noise), strips the text, the glows and the core sphere out, and
writes an 8-bit PNG density map plus maps.json with the measured sphere geometry.
`npm run particles` turns the maps into particle positions (scripts/generate-particles.mjs).
Only needed when the shapes change; the generated .bin files are committed.
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np

OUT = Path(__file__).resolve().parent / "maps"
W, H = 960, 540  # reference frame size; every coordinate below is in these pixels

# frame ranges (30 fps) where each scene is static
RANGES = {"hero": (0, 57), "intent": (112, 139), "palm": (174, 222), "reason": (270, 300), "brain": (345, 354)}


def load(video):
    cap = cv2.VideoCapture(video)
    frames = []
    while True:
        ok, f = cap.read()
        if not ok:
            break
        frames.append(cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA)[:, :, ::-1].astype(np.float32))
    if not frames:
        sys.exit(f"could not read {video}")
    return np.stack(frames)


yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)


def disc(cx, cy, r):
    return np.hypot(xx - cx, yy - cy) < r


def box(x0, y0, x1, y1):
    return (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)


def radial_halo(L, cx, cy, r0, r1, keep):
    """Median brightness per radius, measured only where `keep` is true (no hand there)."""
    r = np.hypot(xx - cx, yy - cy)
    prof = np.zeros(int(r1) + 2, np.float32)
    for k in range(int(r0), int(r1) + 1):
        ring = (r >= k) & (r < k + 1) & keep
        prof[k] = np.median(L[ring]) if ring.sum() > 8 else 0
    prof[: int(r0)] = prof[int(r0)]
    halo = np.interp(r, np.arange(len(prof)), prof, right=0)
    return halo


# maps are stored as 8-bit PNGs at 2x the frame brightness (0.5 level precision)
MAP_SCALE = 2.0


def save_map(path, arr):
    cv2.imwrite(str(path), np.clip(np.round(arr * MAP_SCALE), 0, 255).astype(np.uint8))


def clean(L, keep, floor=3.0):
    d = np.where(keep, L - floor, 0)
    return np.clip(d, 0, None)


def main(video):
    F = load(video)
    OUT.mkdir(parents=True, exist_ok=True)
    avg = {k: F[a:b].mean(0) for k, (a, b) in RANGES.items()}
    lum = {k: v.mean(-1) for k, v in avg.items()}
    meta = {"width": W, "height": H, "mapScale": MAP_SCALE}

    # ---- hero: two hands meeting at a blue spark -------------------------------------
    L = lum["hero"]
    blue = avg["hero"][:, :, 2] - avg["hero"][:, :, :2].mean(-1)
    g = cv2.GaussianBlur(blue, (0, 0), 2)
    sy, sx = np.unravel_index(np.argmax(g[280:]), g[280:].shape)
    sy += 280
    meta["heroSpark"] = [float(sx), float(sy)]
    keep = (yy > 282) & ~box(425, 503, 540, 530)
    # remove the spark: its light is the blue excess, the neutral part is particles
    spark = np.clip(blue, 0, None) * 2.2 * disc(sx, sy, 34)
    hero = clean(L - spark, keep)
    left = hero * (xx < sx + 6)
    right = hero * (xx >= sx + 6)
    save_map(OUT / "hero_left.png", left)
    save_map(OUT / "hero_right.png", right)

    # ---- intent: the hands parted to the edges, copy in the middle --------------------
    L = lum["intent"]
    keep = ~box(372, 196, 652, 334)
    intent = clean(L, keep, floor=4.0)
    save_map(OUT / "intent_left.png", intent * (xx < 480))
    save_map(OUT / "intent_right.png", intent * (xx >= 480))

    # ---- palm: open hand under the core sphere ------------------------------------------
    L = lum["palm"]
    cx, cy, r = 484.1, 184.4, 59.5
    meta["palmSphere"] = [cx, cy, r]
    above = (yy < cy) & ~box(0, 0, 430, 120)
    halo = radial_halo(L, cx, cy, r + 3, 260, above)
    keep = ~disc(cx, cy, r + 5) & ~box(0, 0, 430, 120) & ~box(630, 420, 960, 540) & (yy > cy - 20)
    palm = clean(L - halo, keep, floor=2.0)
    save_map(OUT / "palm.png", palm)

    # ---- brain around the (smaller) core ---------------------------------------------------
    L = lum["brain"]
    cx, cy, r = 480.0, 270.0, 42.0
    meta["brainSphere"] = [cx, cy, r]
    keep_txt = ~box(0, 0, 430, 120) & ~box(630, 420, 960, 540)
    # glow: brightness around the core that is not brain, estimated from the darkest
    # quartile per radius (the brain is patchy, so its gaps show the glow alone)
    rr = np.hypot(xx - cx, yy - cy)
    prof = np.zeros(300, np.float32)
    for k in range(int(r), 300):
        ring = (rr >= k) & (rr < k + 1) & keep_txt
        prof[k] = np.percentile(L[ring], 20) if ring.sum() > 8 else 0
    prof[: int(r)] = prof[int(r)]
    glow = np.interp(rr, np.arange(300), prof, right=0)
    brain = clean(L - glow, keep_txt & ~disc(cx, cy, r + 3), floor=2.0)
    # fill the part hidden behind the core with the average of the ring around it
    ring = (rr >= r + 3) & (rr < r + 14)
    brain = np.where(disc(cx, cy, r + 3), brain[ring].mean() * 0.8, brain)
    save_map(OUT / "brain.png", brain)

    # ---- rings (only measured, the shape is procedural) -------------------------------------
    meta["reasonSphere"] = [479.4, 277.4, 67.0]
    meta["actSphere"] = [cx, cy, r]

    (OUT / "maps.json").write_text(json.dumps(meta, indent=2))
    print("wrote maps to", OUT)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
