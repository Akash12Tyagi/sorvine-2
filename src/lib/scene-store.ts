/**
 * Shared, mutable state between the DOM (scroll + pointer) and the WebGL scene.
 * Plain objects on purpose: they are written by scroll listeners and read inside the
 * render loop every frame, so going through React state would only add re-renders.
 */

/** Scroll position, written by the scroll bridge (SmoothScroll). */
export const progress = {
  /** scroll position in screens (viewport heights) from the top of the page */
  s: 0,
  /** the content sections between the story and the closing call to action (0..1) */
  rest: 0,
  /** closing call to action, from its top entering the screen to its bottom leaving (0..1) */
  cta: 0,
};

/** Pointer in normalised device coordinates (-1..1), plus whether it is over the page. */
export const pointer = { x: 0, y: 0, active: false, lastMove: 0 };

export const env = {
  reducedMotion: false,
  isMobile: false,
};
