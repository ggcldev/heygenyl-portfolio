type FeaturedState = {
  currentProgress: number;
  targetProgress: number;
};

type FeaturedMetrics = {
  maxShift: number;
  scrollDistance: number;
  scrollEnd: number;
  scrollStart: number;
};

type FeaturedNodes = {
  copy: HTMLElement | null;
  shell: HTMLElement;
  stage: HTMLElement;
  track: HTMLElement;
};

const FEATURED_CONFIG = {
  desktopBreakpoint: 1024,
  easeEpsilon: 0.001,
  endHoldDesktopPx: 180,
  endHoldNarrowPx: 96,
  narrowBreakpoint: 900,
  scrollEase: 0.14,
  startDelayDesktopPx: 0,
  startDelayNarrowPx: 0,
  verticalScrollRatioDesktop: 1,
  verticalScrollRatioNarrow: 0.72,
} as const;

const APPROACH_TAB_TRANSITION_MS = 300;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getFeaturedItems = (track: HTMLElement) =>
  Array.from(track.querySelectorAll<HTMLElement>(".featured-project-item"));

const getFeaturedNodes = (section: HTMLElement): FeaturedNodes | null => {
  const stage = section.querySelector("[data-featured-stage]");
  const track = section.querySelector("[data-featured-track]");
  const shell = section.querySelector(".featured-projects-shell");
  const copy = section.querySelector(".featured-projects-copy");

  if (
    !(stage instanceof HTMLElement) ||
    !(track instanceof HTMLElement) ||
    !(shell instanceof HTMLElement)
  ) {
    return null;
  }

  return {
    copy: copy instanceof HTMLElement ? copy : null,
    shell,
    stage,
    track,
  };
};

const resetFeaturedItemAnimation = (track: HTMLElement) => {
  getFeaturedItems(track).forEach((item) => {
    item.style.opacity = "";
    item.style.transform = "";
  });
};

const updateFeaturedItemAnimation = (
  track: HTMLElement,
  progress: number,
  reduceMotionQuery: MediaQueryList,
) => {
  const items = getFeaturedItems(track);
  if (items.length === 0 || reduceMotionQuery.matches) {
    resetFeaturedItemAnimation(track);
    return;
  }

  const activePosition = progress * Math.max(items.length - 1, 1);

  items.forEach((item, index) => {
    const distance = Math.min(Math.abs(index - activePosition), 1.4);
    const opacity = Math.max(1 - distance * 0.4, 0.44);
    const yShift = distance * 14;
    item.style.opacity = opacity.toFixed(3);
    item.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
  });
};

const clearFeaturedSection = (
  section: HTMLElement,
  nodes: FeaturedNodes,
  featuredMetrics: WeakMap<HTMLElement, FeaturedMetrics>,
  featuredState: WeakMap<HTMLElement, FeaturedState>,
) => {
  nodes.track.style.transform = "";
  resetFeaturedItemAnimation(nodes.track);
  nodes.shell.style.minHeight = "";
  section.style.minHeight = "";
  featuredMetrics.delete(section);
  featuredState.delete(section);
};

const computeFeaturedMetrics = (
  section: HTMLElement,
  nodes: FeaturedNodes,
  featuredMetrics: WeakMap<HTMLElement, FeaturedMetrics>,
) => {
  section.style.setProperty(
    "--featured-copy-height",
    nodes.copy ? `${nodes.copy.offsetHeight}px` : "0px",
  );

  const maxShiftByViewport = Math.max(
    nodes.track.scrollWidth - nodes.stage.clientWidth,
    0,
  );
  const lastItem = getFeaturedItems(nodes.track).at(-1);
  const maxShiftToLastCardStart =
    lastItem instanceof HTMLElement ? Math.max(lastItem.offsetLeft, 0) : 0;
  const maxShift = Math.max(maxShiftByViewport, maxShiftToLastCardStart);
  const stageOffset = nodes.shell.offsetTop + nodes.stage.offsetTop;
  const stageBlockHeight = stageOffset + nodes.stage.offsetHeight;
  const naturalHeight = section.scrollHeight;
  const verticalRatio =
    window.innerWidth >= FEATURED_CONFIG.desktopBreakpoint
      ? FEATURED_CONFIG.verticalScrollRatioDesktop
      : FEATURED_CONFIG.verticalScrollRatioNarrow;
  const endHoldPx =
    window.innerWidth >= FEATURED_CONFIG.desktopBreakpoint
      ? FEATURED_CONFIG.endHoldDesktopPx
      : FEATURED_CONFIG.endHoldNarrowPx;
  const scrollDistance = Math.max(Math.ceil(maxShift * verticalRatio), 1);
  const finalHeight = Math.max(
    naturalHeight,
    Math.ceil(stageBlockHeight + scrollDistance + endHoldPx),
  );
  const sectionTop = window.scrollY + section.getBoundingClientRect().top;
  const stickTop =
    Number.parseFloat(window.getComputedStyle(nodes.stage).top) || 0;
  const scrollStart = sectionTop + stageOffset - stickTop;
  const scrollEnd = scrollStart + scrollDistance;

  section.style.minHeight = `${finalHeight}px`;
  nodes.shell.style.minHeight = `${finalHeight}px`;
  featuredMetrics.set(section, {
    maxShift,
    scrollDistance,
    scrollEnd,
    scrollStart,
  });
};

const updateFeaturedSection = (
  section: HTMLElement,
  reduceMotionQuery: MediaQueryList,
  featuredMetrics: WeakMap<HTMLElement, FeaturedMetrics>,
  featuredState: WeakMap<HTMLElement, FeaturedState>,
) => {
  const nodes = getFeaturedNodes(section);
  if (!nodes) {
    return false;
  }

  if (!section.classList.contains("is-enhanced")) {
    clearFeaturedSection(section, nodes, featuredMetrics, featuredState);
    return false;
  }

  const metrics = featuredMetrics.get(section);
  if (!metrics || metrics.scrollDistance <= 0 || metrics.maxShift <= 0) {
    clearFeaturedSection(section, nodes, featuredMetrics, featuredState);
    return false;
  }

  const startDelay =
    window.innerWidth <= FEATURED_CONFIG.narrowBreakpoint
      ? FEATURED_CONFIG.startDelayNarrowPx
      : FEATURED_CONFIG.startDelayDesktopPx;
  const isDesktop = window.innerWidth >= FEATURED_CONFIG.desktopBreakpoint;
  const scrollY = window.scrollY;

  let progress =
    (scrollY - metrics.scrollStart - startDelay) / metrics.scrollDistance;
  if (scrollY <= metrics.scrollStart) progress = 0;
  if (scrollY >= metrics.scrollEnd) progress = 1;
  progress = clamp(progress, 0, 1);

  let state = featuredState.get(section);
  if (!state) {
    state = {
      currentProgress: progress,
      targetProgress: progress,
    };
    featuredState.set(section, state);
  }

  state.targetProgress = progress;

  if (reduceMotionQuery.matches || !isDesktop) {
    state.currentProgress = state.targetProgress;
  } else {
    const delta = state.targetProgress - state.currentProgress;
    const easing =
      Math.abs(delta) > 0.22
        ? Math.min(FEATURED_CONFIG.scrollEase + 0.08, 0.3)
        : FEATURED_CONFIG.scrollEase;

    if (Math.abs(delta) <= FEATURED_CONFIG.easeEpsilon) {
      state.currentProgress = state.targetProgress;
    } else {
      state.currentProgress += delta * easing;
    }
  }

  nodes.track.style.transform = `translate3d(${-metrics.maxShift * state.currentProgress}px, 0, 0)`;
  updateFeaturedItemAnimation(nodes.track, state.currentProgress, reduceMotionQuery);

  return (
    !reduceMotionQuery.matches &&
    Math.abs(state.targetProgress - state.currentProgress) >
      FEATURED_CONFIG.easeEpsilon
  );
};

const attachFeaturedStageInteractions = (
  section: HTMLElement,
  stage: HTMLElement,
) => {
  let pendingWheelDelta = 0;
  let wheelFrameId = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScrollLeft = 0;

  const flushWheelDelta = () => {
    wheelFrameId = 0;
    if (Math.abs(pendingWheelDelta) < 0.01) {
      return;
    }

    const maxScrollLeft = Math.max(stage.scrollWidth - stage.clientWidth, 0);
    stage.scrollLeft = clamp(
      stage.scrollLeft + pendingWheelDelta,
      0,
      maxScrollLeft,
    );
    pendingWheelDelta = 0;
  };

  stage.addEventListener(
    "wheel",
    (event) => {
      if (section.classList.contains("is-enhanced")) return;
      if (stage.scrollWidth <= stage.clientWidth + 1) return;

      const dominantDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (Math.abs(dominantDelta) < 0.01) return;

      event.preventDefault();

      const deltaModeScale =
        event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? window.innerHeight
            : 1;
      const rawDelta = dominantDelta * deltaModeScale;
      const clampedDelta =
        Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 88);
      pendingWheelDelta += clampedDelta * 0.86;

      if (!wheelFrameId) {
        wheelFrameId = window.requestAnimationFrame(flushWheelDelta);
      }
    },
    { passive: false },
  );

  stage.addEventListener("pointerdown", (event) => {
    if (section.classList.contains("is-enhanced")) return;
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (stage.scrollWidth <= stage.clientWidth + 1) return;

    if (wheelFrameId) {
      window.cancelAnimationFrame(wheelFrameId);
      wheelFrameId = 0;
      pendingWheelDelta = 0;
    }

    isDragging = true;
    dragStartX = event.clientX;
    dragStartScrollLeft = stage.scrollLeft;
    stage.classList.add("is-dragging");
    stage.setPointerCapture?.(event.pointerId);
  });

  stage.addEventListener("pointermove", (event) => {
    if (!isDragging) {
      return;
    }

    stage.scrollLeft = dragStartScrollLeft - (event.clientX - dragStartX);
  });

  const stopDragging = (event: PointerEvent) => {
    if (!isDragging) {
      return;
    }

    isDragging = false;
    stage.classList.remove("is-dragging");
    if (stage.hasPointerCapture?.(event.pointerId)) {
      stage.releasePointerCapture(event.pointerId);
    }
  };

  stage.addEventListener("pointerup", stopDragging);
  stage.addEventListener("pointercancel", stopDragging);
};

const initFeaturedProjects = () => {
  const featuredSections = Array.from(
    document.querySelectorAll<HTMLElement>("[data-featured-scroll]"),
  );
  if (featuredSections.length === 0) {
    return;
  }

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const featuredMetrics = new WeakMap<HTMLElement, FeaturedMetrics>();
  const featuredState = new WeakMap<HTMLElement, FeaturedState>();
  let frameId = 0;

  const requestUpdate = () => {
    if (frameId) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = 0;
      let shouldContinue = false;

      featuredSections.forEach((section) => {
        if (
          updateFeaturedSection(
            section,
            reduceMotionQuery,
            featuredMetrics,
            featuredState,
          )
        ) {
          shouldContinue = true;
        }
      });

      if (shouldContinue) {
        requestUpdate();
      }
    });
  };

  const applyMode = () => {
    const shouldEnhance = !reduceMotionQuery.matches;

    featuredSections.forEach((section) => {
      const nodes = getFeaturedNodes(section);
      if (!nodes) {
        return;
      }

      section.style.minHeight = "";
      nodes.shell.style.minHeight = "";

      if (!shouldEnhance) {
        section.classList.remove("is-enhanced");
        clearFeaturedSection(section, nodes, featuredMetrics, featuredState);
        return;
      }

      section.classList.add("is-enhanced");
      computeFeaturedMetrics(section, nodes, featuredMetrics);
    });

    requestUpdate();
  };

  featuredSections.forEach((section) => {
    const nodes = getFeaturedNodes(section);
    if (!nodes) {
      return;
    }

    section.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
      if (img.complete) {
        return;
      }

      img.addEventListener("load", applyMode, { once: true });
    });

    attachFeaturedStageInteractions(section, nodes.stage);
  });

  applyMode();
  window.addEventListener("load", applyMode);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", applyMode);
  reduceMotionQuery.addEventListener("change", applyMode);
};

const setupApproachTabGroup = (group: HTMLElement) => {
  const tabs = Array.from(group.querySelectorAll<HTMLElement>("[role='tab']"));
  const panels = Array.from(
    group.querySelectorAll<HTMLElement>("[role='tabpanel']"),
  );
  const panelShell = group.querySelector(".approach-panels");
  if (tabs.length === 0 || panels.length === 0 || !(panelShell instanceof HTMLElement)) {
    return;
  }

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  let transitionTimer = 0;

  const clearPanelState = () => {
    panels.forEach((panel) => {
      panel.classList.remove("is-entering", "is-leaving");
    });
  };

  const activateTab = (nextTab: HTMLElement, withFocus = false) => {
    const tabKey = nextTab.getAttribute("data-tab-id");
    if (!tabKey) {
      return;
    }

    const nextPanel = panels.find(
      (panel) => panel.getAttribute("data-panel-id") === tabKey,
    );
    if (!(nextPanel instanceof HTMLElement)) {
      return;
    }

    const currentPanel =
      panels.find((panel) => !panel.hasAttribute("hidden")) ?? nextPanel;
    const shouldAnimate =
      !reduceMotionQuery.matches && currentPanel !== nextPanel;

    if (transitionTimer) {
      window.clearTimeout(transitionTimer);
      transitionTimer = 0;
    }

    clearPanelState();
    panelShell.classList.remove("is-animating");
    panelShell.style.height = "";

    tabs.forEach((tab) => {
      const isActive = tab === nextTab;
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    if (!shouldAnimate) {
      panels.forEach((panel) =>
        panel.toggleAttribute("hidden", panel !== nextPanel),
      );
    } else {
      nextPanel.hidden = false;
      const currentHeight = currentPanel.getBoundingClientRect().height;
      const nextHeight = nextPanel.getBoundingClientRect().height;

      panelShell.style.height = `${currentHeight}px`;
      panelShell.classList.add("is-animating");
      void panelShell.offsetHeight;
      panelShell.style.height = `${nextHeight}px`;

      currentPanel.classList.add("is-leaving");
      nextPanel.classList.add("is-entering");

      transitionTimer = window.setTimeout(() => {
        panels.forEach((panel) =>
          panel.toggleAttribute("hidden", panel !== nextPanel),
        );
        clearPanelState();
        panelShell.classList.remove("is-animating");
        panelShell.style.height = "";
        transitionTimer = 0;
      }, APPROACH_TAB_TRANSITION_MS);
    }

    if (withFocus) {
      nextTab.focus();
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("mouseenter", () => {
      if (!hoverPointerQuery.matches) {
        return;
      }

      activateTab(tab);
    });
    tab.addEventListener("keydown", (event) => {
      let nextIndex = index;

      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = tabs.length - 1;
      else return;

      const targetTab = tabs[nextIndex];
      if (!targetTab) {
        return;
      }

      event.preventDefault();
      activateTab(targetTab, true);
    });
  });

  const initialTab =
    tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
  if (!initialTab) {
    return;
  }

  activateTab(initialTab);
};

const initApproachTabs = () => {
  Array.from(
    document.querySelectorAll<HTMLElement>("[data-approach-tabs]"),
  ).forEach(setupApproachTabGroup);
};

const setupHomeFaqItem = (item: HTMLDetailsElement) => {
  const trigger = item.querySelector<HTMLElement>("[data-home-faq-trigger]");
  const answer = item.querySelector<HTMLElement>("[data-home-faq-answer]");
  const answerInner = item.querySelector<HTMLElement>(
    "[data-home-faq-answer-inner]",
  );

  if (
    !(trigger instanceof HTMLElement) ||
    !(answer instanceof HTMLElement) ||
    !(answerInner instanceof HTMLElement)
  ) {
    return;
  }

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isExpanding = false;
  let isCollapsing = false;

  const syncState = () => {
    item.classList.remove("is-expanding", "is-collapsing");
    answer.style.height = item.open ? "auto" : "0px";
    isExpanding = false;
    isCollapsing = false;
  };

  const expand = () => {
    isExpanding = true;
    item.classList.remove("is-collapsing");
    item.classList.add("is-expanding");
    item.open = true;
    answer.style.height = "0px";

    window.requestAnimationFrame(() => {
      answer.style.height = `${answerInner.offsetHeight}px`;
    });
  };

  const collapse = () => {
    isCollapsing = true;
    item.classList.remove("is-expanding");
    item.classList.add("is-collapsing");
    answer.style.height = `${answerInner.offsetHeight}px`;

    window.requestAnimationFrame(() => {
      answer.style.height = "0px";
    });
  };

  answer.addEventListener("transitionend", (event) => {
    if (event.target !== answer || event.propertyName !== "height") {
      return;
    }

    if (isCollapsing) {
      item.open = false;
      syncState();
      return;
    }

    if (isExpanding) {
      answer.style.height = "auto";
      item.classList.remove("is-expanding");
      isExpanding = false;
    }
  });

  trigger.addEventListener("click", (event) => {
    event.preventDefault();

    if (isExpanding || isCollapsing) {
      return;
    }

    if (reduceMotionQuery.matches) {
      item.open = !item.open;
      syncState();
      return;
    }

    if (item.open) {
      collapse();
      return;
    }

    expand();
  });

  reduceMotionQuery.addEventListener("change", syncState);
  syncState();
};

const initHomeFaq = () => {
  Array.from(
    document.querySelectorAll<HTMLDetailsElement>("[data-home-faq-item]"),
  ).forEach(setupHomeFaqItem);
};

initFeaturedProjects();
initApproachTabs();
initHomeFaq();

export {};
