import { useEffect } from 'react';

// Scroll-linked drift for the blurred background glows.
//  - Fixed page backgrounds use `--cq-scroll` (0 at the top of the page, 1 at the bottom),
//    set on <html> by components/ScrollProgressVar.
//  - Landing-page sections use their own `--cq-local` (0 as the section enters the screen,
//    1 as it leaves), set by useSectionProgress, so each section's glows move while it's in view.

// Different directions/distances so neighbouring glows move apart and past each other.
const MOTIONS = [
  [80, -220, 1.15],
  [-120, 160, 0.9],
  [140, 120, 1.1],
  [-90, -180, 1.2],
  [110, 200, 0.92],
];

// sx for the i-th glow. `strength` scales the distance; `centered` makes the glow sit at its
// normal spot halfway through (drifting either side of it). Off for reduced motion.
export function parallaxSx(i, { strength = 1, variable = '--cq-scroll', centered = false } = {}) {
  const [dx, dy, scale] = MOTIONS[i % MOTIONS.length];
  const p = centered ? `(var(${variable}, 0.5) - 0.5)` : `var(${variable}, 0)`;
  return {
    transform: `translate3d(calc(${p} * ${dx * strength}px), calc(${p} * ${dy * strength}px), 0) scale(calc(1 + ${p} * ${scale - 1}))`,
    willChange: 'transform',
    '@media (prefers-reduced-motion: reduce)': { transform: 'none', willChange: 'auto' },
  };
}

// ---------- Ambient float (always moving; faster while scrolling or moving the mouse) ----------
// Each glow runs a looping float (Web Animations API). Scrolling and mouse movement "stir"
// them: their speed raises every float's playback rate, which then eases back to normal.

const FLOATS = [
  // [x px, y px, scale, seconds per one-way trip]
  [130, -150, 1.22, 4],
  [-160, 110, 1.25, 5],
  [140, 140, 0.82, 3.5],
  [-120, -160, 1.2, 4.5],
  [160, -110, 1.24, 3],
];
const floating = new Set();
let boost = 0;
let loop = 0;
let lastY = 0;
let listening = false;

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function tick() {
  boost *= 0.95; // ease back to the slow pace (~1.5s)
  if (boost < 0.02) boost = 0;
  floating.forEach((anim) => anim.updatePlaybackRate(1 + boost));
  loop = boost ? requestAnimationFrame(tick) : 0;
}

function onScroll() {
  const y = window.scrollY;
  // The base float is already fairly quick, so cap the boost lower to keep scrolling feeling the same.
  boost = Math.min(boost + Math.abs(y - lastY) * 0.04, 4.5); // up to ~5.5x while scrolling fast
  lastY = y;
  if (!loop) loop = requestAnimationFrame(tick);
}

// Moving the mouse stirs the colours too (mouse/trackpad only; on touch screens that's scrolling).
let lastPointer = null;
function onPointerMove(e) {
  if (e.pointerType !== 'mouse') return;
  if (lastPointer) {
    const distance = Math.hypot(e.clientX - lastPointer.x, e.clientY - lastPointer.y);
    boost = Math.min(boost + distance * 0.02, 4.5); // same cap as scrolling
    if (!loop) loop = requestAnimationFrame(tick);
  }
  lastPointer = { x: e.clientX, y: e.clientY };
}

function startListening() {
  if (listening) return;
  listening = true;
  lastY = window.scrollY;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  // Forget the last position when the mouse leaves, so re-entering doesn't count as a big jump.
  document.documentElement.addEventListener('pointerleave', () => {
    lastPointer = null;
  });
}

// Starts the i-th float on the element; returns a cleanup function.
export function useFloat(ref, i) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !el.animate || prefersReducedMotion()) return undefined;
    const [x, y, scale, seconds] = FLOATS[i % FLOATS.length];
    const anim = el.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1)' },
        { transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})` },
      ],
      { duration: seconds * 1000, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', delay: -i * 700 }
    );
    floating.add(anim);
    startListening();
    return () => {
      floating.delete(anim);
      anim.cancel();
    };
  }, [ref, i]);
}

// Writes `--cq-local` (0…1) on the element as it scrolls through the viewport.
export function useSectionProgress(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
      el.style.setProperty('--cq-local', progress.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [ref]);
}
