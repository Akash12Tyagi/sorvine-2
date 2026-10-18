# Sorvine — scroll-driven landing page

Next.js (App Router) + TypeScript + Tailwind CSS v4, with a WebGL particle scene (three.js /
React Three Fiber), Lenis smooth scrolling and GSAP ScrollTrigger.

Everything on the page moves with the scroll position: scroll down and each transition plays
forward, scroll back up and it reverses.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Node 20+ is recommended. Deploys to Vercel (or any Node host) with no extra configuration.

## What happens as you scroll

| Scroll (screens) | Scene |
| --- | --- |
| 0 | Hero: two particle hands reach for a blue spark |
| 0 – 0.6 | Hero copy scrolls away, the hands rise |
| 0.6 – 1.1 | The camera "flies in": the hands grow and part to the edges, the spark fades into a haze |
| 1.1 – 2.3 | "Human intent, machine intelligence." |
| 2.3 – 3.7 | Copy and hands scroll away, the hands dissolve, the core lights up and an open hand condenses under it |
| 3.7 – 4.4 | **Learn** |
| 4.4 – 5.1 | The hand swirls into rings around the core |
| 5.1 – 6.0 | **Reason** |
| 6.0 – 6.65 | The rings collapse into a brain |
| 6.65 – 7.6 | **Act** |
| 7.6 – 8.4 | The brain dissolves into a data field behind the content sections |
| … | Capabilities, How it works (pinned timeline), Pricing, FAQ |
| end | Closing call to action: the hands come back, then the footer |

All of these keys live in one place, `src/lib/timeline.ts`. The DOM copy
(`src/components/scroll/story-dom.ts`) and the particles
(`src/components/experience/choreography.ts`) both read them, so text and particles always
stay in sync. Change a range there and both follow.

## Where things are

```
src/
  app/                    layout, page, global styles (type scale, buttons, reveals)
  lib/
    content.ts            all copy, links, prices — edit text here
    timeline.ts           the scroll script (see table above)
    scene-store.ts        shared scroll / pointer state between DOM and WebGL
  components/
    layout/               Navbar, Footer
    sections/             Hero, Story (intent + AI core), Capabilities, Process, Pricing, Faq, FinalCta
    scroll/               SmoothScroll (Lenis + scroll bridge + scrubbed reveals), story-dom
    experience/           WebGL scene: particles, core sphere, shaders, shapes, choreography
    ui/                   buttons, logo, icons, cards
public/particles/         particle shapes (shapes.bin desktop, shapes-lite.bin phones)
scripts/particles/        tools that generate the particle shapes
```

### Editing copy

Every string (nav, hero, sections, pricing, FAQ, footer) is in `src/lib/content.ts`.

### Scroll cues

So visitors always know there is more to scroll:

- **Hero:** "Scroll down" with a soft shimmer and a light running down a hairline.
- **Chapter rail** (desktop, right edge): Intro · Intent · Learn · Reason · Act. It fills as the
  story plays, shows the current chapter and its number, and each dot jumps to that chapter.
- **Pause hints:** when someone stops on a pinned scene for ~1.3 s, a line at the bottom says
  what the next scroll shows ("Scroll to see it reason", …). It fades away as soon as they scroll.
  "How it works" gets one too while it is pinned.

The wording, chapter positions and hint ranges are in `scrollCues` in `src/lib/content.ts`;
`IDLE_MS` in `src/components/scroll/story-dom.ts` sets the pause length.

### Scroll reveals on new sections

Add `data-reveal` to any element and it blurs in as it scrolls into view (and back out when
scrolling up). Optional attributes: `data-reveal-delay="0.1"` (starts a little later in the
scroll), `data-reveal-start="94"` (viewport % where it starts), `data-reveal-length="30"`.

### Particle shapes

The hands and the brain were traced from the design reference video: the static frames of each
scene were averaged into density maps (`scripts/particles/maps/*.png`), and
`scripts/particles/generate.py` samples particles from them and pairs the hero and intent hands
so each particle keeps its place on the hand while they turn. Rings and the data field are
generated in the browser.

```bash
pip install numpy scipy opencv-python
npm run particles                     # rebuild public/particles/*.bin from the maps
npm run particles:maps -- video.mp4   # rebuild the maps from a reference video
```

## Performance and accessibility

- Desktop draws ~104k particles, phones ~45k (half-size data file, lower pixel ratio).
- The WebGL layer is client-only and never blocks the HTML; all copy is server-rendered.
- `prefers-reduced-motion`: smooth scrolling, cursor effects, camera parallax, the hero load-in
  and the text blur are switched off; copy appears without animation. The particles still
  follow the scroll, since that motion is driven by the visitor.
- Without JavaScript all copy is visible (see the `noscript` style in `app/layout.tsx`).
