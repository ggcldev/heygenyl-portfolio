const initServicesScrollHub = () => {
  const root = document.querySelector<HTMLElement>("[data-services-flow]");
  if (!root) return;

  const scroller = root.querySelector<HTMLElement>("[data-services-cards]");
  if (!scroller) return;

  const cards = Array.from(
    root.querySelectorAll<HTMLElement>("[data-service-card]"),
  );
  const statusItems = Array.from(
    root.querySelectorAll<HTMLElement>("[data-service-status-item]"),
  );
  if (cards.length === 0 || statusItems.length === 0) return;

  const desktopQuery = window.matchMedia("(min-width: 768px)");
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let activeIndex = 0;
  let targetIndex = 0;
  let wheelLocked = false;
  let wheelCooldownUntil = 0;
  let settleFrameId = 0;
  let settleTimeoutId = 0;
  let syncFrameId = 0;

  const lockCooldownMs = () => (reduceMotionQuery.matches ? 90 : 340);
  const inertiaExtensionMs = () => (reduceMotionQuery.matches ? 45 : 170);

  const clampIndex = (index: number) =>
    Math.min(Math.max(index, 0), cards.length - 1);

  const setStatus = (index: number) => {
    activeIndex = index;

    statusItems.forEach((item, itemIndex) => {
      let state = "upcoming";
      if (itemIndex === index) {
        state = "current";
      } else if (itemIndex === index + 1) {
        state = "next";
      }
      item.dataset.state = state;
    });
  };

  const getNearestIndexFromScroll = () => {
    const scrollTop = scroller.scrollTop;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetTop - scrollTop);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    return nearestIndex;
  };

  const isSectionActive = () => {
    const rect = root.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    return (
      rect.top <= viewportHeight * 0.34 &&
      rect.bottom >= viewportHeight * 0.66
    );
  };

  const clearSettleTimers = () => {
    if (settleFrameId) {
      window.cancelAnimationFrame(settleFrameId);
      settleFrameId = 0;
    }
    if (settleTimeoutId) {
      window.clearTimeout(settleTimeoutId);
      settleTimeoutId = 0;
    }
  };

  const finishSnap = () => {
    clearSettleTimers();
    wheelLocked = false;
    setStatus(targetIndex);
    wheelCooldownUntil = performance.now() + lockCooldownMs();
  };

  const snapToIndex = (index: number, smooth = true) => {
    targetIndex = clampIndex(index);
    const targetCard = cards[targetIndex];
    if (!targetCard) return;

    const targetTop = targetCard.offsetTop;
    setStatus(targetIndex);
    wheelLocked = true;
    clearSettleTimers();

    if (desktopQuery.matches) {
      scroller.scrollTo({
        top: targetTop,
        behavior: smooth && !reduceMotionQuery.matches ? "smooth" : "auto",
      });
    } else {
      targetCard.scrollIntoView({
        behavior: smooth && !reduceMotionQuery.matches ? "smooth" : "auto",
        block: "start",
      });
      finishSnap();
      return;
    }

    const startedAt = performance.now();
    const settle = () => {
      if (!wheelLocked) return;

      const distance = Math.abs(scroller.scrollTop - targetTop);
      const elapsed = performance.now() - startedAt;
      const settled = distance <= 1.5;
      const timedOut = elapsed > 1100;

      if (settled || timedOut) {
        if (!settled) {
          scroller.scrollTo({ top: targetTop, behavior: "auto" });
        }
        finishSnap();
        return;
      }

      settleFrameId = window.requestAnimationFrame(settle);
    };

    settleFrameId = window.requestAnimationFrame(settle);
    settleTimeoutId = window.setTimeout(() => {
      if (!wheelLocked) return;
      scroller.scrollTo({ top: targetTop, behavior: "auto" });
      finishSnap();
    }, reduceMotionQuery.matches ? 260 : 1280);
  };

  const syncStatus = () => {
    syncFrameId = 0;
    if (wheelLocked) return;

    const nearest = getNearestIndexFromScroll();
    if (nearest !== activeIndex) {
      targetIndex = nearest;
      setStatus(nearest);
    }
  };

  const requestSync = () => {
    if (syncFrameId) return;
    syncFrameId = window.requestAnimationFrame(syncStatus);
  };

  const onWheelCapture = (event: WheelEvent) => {
    if (!desktopQuery.matches) return;
    if (!isSectionActive()) return;
    if (Math.abs(event.deltaY) < 8) return;

    const now = performance.now();
    if (wheelLocked || now < wheelCooldownUntil) {
      event.preventDefault();
      wheelCooldownUntil = Math.max(
        wheelCooldownUntil,
        now + inertiaExtensionMs(),
      );
      return;
    }

    const direction = event.deltaY > 0 ? 1 : -1;
    const nextIndex = clampIndex(activeIndex + direction);
    if (nextIndex === activeIndex) return;

    event.preventDefault();
    snapToIndex(nextIndex, true);
  };

  const onStatusActivate = (index: number) => {
    wheelCooldownUntil = 0;
    snapToIndex(index, true);
  };

  const onModeChange = () => {
    clearSettleTimers();
    wheelLocked = false;
    requestSync();
  };

  window.addEventListener("wheel", onWheelCapture, {
    passive: false,
    capture: true,
  });

  statusItems.forEach((item) => {
    const index = Number(item.dataset.index ?? "0");
    if (Number.isNaN(index)) return;

    item.addEventListener("click", () => {
      onStatusActivate(index);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      onStatusActivate(index);
    });
  });

  setStatus(0);
  requestSync();

  scroller.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
  desktopQuery.addEventListener("change", onModeChange);
  reduceMotionQuery.addEventListener("change", onModeChange);
  window.addEventListener("beforeunload", clearSettleTimers);
};

initServicesScrollHub();
