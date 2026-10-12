import { useEffect } from 'react';

// Publishes how far down the page the user has scrolled as a CSS variable on <html>:
//   --cq-scroll: 0 (top) … 1 (bottom)
// Background glows use it to drift as you scroll (see utils/parallax.js). One passive
// listener + requestAnimationFrame, so scrolling stays smooth.
export default function ScrollProgressVar() {
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty('--cq-scroll', max > 0 ? (window.scrollY / max).toFixed(4) : '0');
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Page height changes (route change, data loading) also change the progress.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      observer.disconnect();
    };
  }, []);
  return null;
}
