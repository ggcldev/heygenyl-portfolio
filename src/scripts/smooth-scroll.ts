import Lenis from "lenis";

// Smooth (Lenis) scrolling on desktop pointers only. Touch devices keep
// native scrolling, and users who ask for reduced motion are left alone.
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

if (!reducedMotion.matches && finePointer.matches) {
  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };

  requestAnimationFrame(raf);

  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) lenis.destroy();
  });
}
