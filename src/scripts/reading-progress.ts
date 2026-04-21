const progressBar = document.querySelector("[data-reading-progress-bar]");
const articleTarget = document.querySelector("[data-reading-progress-target]");
const siteHeader = document.querySelector(".site-header");

if (
  progressBar instanceof HTMLElement &&
  articleTarget instanceof HTMLElement
) {
  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  let start = 0;
  let end = 1;

  const recalculateBounds = () => {
    const headerHeight =
      siteHeader instanceof HTMLElement ? siteHeader.offsetHeight : 0;
    const articleTop = articleTarget.offsetTop;
    const articleHeight = articleTarget.offsetHeight;
    const viewportHeight = window.innerHeight;

    start = Math.max(0, articleTop - headerHeight);
    end = Math.max(start + 1, articleTop + articleHeight - viewportHeight * 0.4);
  };

  const updateProgress = () => {
    const progress = clamp((window.scrollY - start) / (end - start), 0, 1);
    progressBar.style.transform = `scaleX(${progress})`;
  };

  let frame = 0;
  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      updateProgress();
    });
  };

  const recalculateAndUpdate = () => {
    recalculateBounds();
    updateProgress();
  };

  recalculateAndUpdate();

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      recalculateAndUpdate();
    });

    observer.observe(articleTarget);
    if (siteHeader instanceof HTMLElement) observer.observe(siteHeader);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", recalculateAndUpdate);
  window.addEventListener("load", recalculateAndUpdate);
}
