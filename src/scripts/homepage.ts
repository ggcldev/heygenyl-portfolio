type FeaturedState = {
  currentProgress: number;
  targetProgress: number;
};

const featuredSections = Array.from(
  document.querySelectorAll<HTMLElement>("[data-featured-scroll]"),
);

if (featuredSections.length > 0) {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FEATURED_START_DELAY_NARROW_PX = 0;
  const FEATURED_START_DELAY_DESKTOP_PX = 0;
  const FEATURED_NARROW_BREAKPOINT = 900;
  const FEATURED_DESKTOP_BREAKPOINT = 1024;
  const FEATURED_VERTICAL_SCROLL_RATIO_NARROW = 0.72;
  const FEATURED_VERTICAL_SCROLL_RATIO_DESKTOP = 1;
  const FEATURED_END_HOLD_NARROW_PX = 96;
  const FEATURED_END_HOLD_DESKTOP_PX = 180;
  const FEATURED_SCROLL_EASE = 0.14;
  const FEATURED_EASE_EPSILON = 0.001;
  const featuredState = new WeakMap<HTMLElement, FeaturedState>();
  let frameId = 0;
  let hasEnhancedSections = false;

  // Keep horizontal-scroll enhancement desktop-only to avoid costly layout work
  // during mobile's critical render path.
  const canEnhance = () =>
    !reduceMotionQuery.matches &&
    window.innerWidth >= FEATURED_DESKTOP_BREAKPOINT;

  const resetItemAnimation = (track: HTMLElement) => {
    const items = track.querySelectorAll<HTMLElement>(".featured-project-item");
    items.forEach((item) => {
      item.style.opacity = "";
      item.style.transform = "";
    });
  };

  const updateItemAnimation = (track: HTMLElement, progress: number) => {
    const items = Array.from(
      track.querySelectorAll<HTMLElement>(".featured-project-item"),
    );
    if (items.length === 0 || reduceMotionQuery.matches) {
      resetItemAnimation(track);
      return;
    }

    const activePosition = progress * Math.max(items.length - 1, 1);

    items.forEach((item, index) => {
      const distance = Math.min(Math.abs(index - activePosition), 1.4);
      const opacity = Math.max(1 - distance * 0.1, 0.86);
      const yShift = distance * 14;
      item.style.opacity = opacity.toFixed(3);
      item.style.transform = `translate3d(0, ${yShift.toFixed(1)}px, 0)`;
    });
  };

  const computeSectionMetrics = (section: HTMLElement) => {
    const stage = section.querySelector("[data-featured-stage]");
    const track = section.querySelector("[data-featured-track]");
    const shell = section.querySelector(".featured-projects-shell");
    const copy = section.querySelector(".featured-projects-copy");

    if (
      !(stage instanceof HTMLElement) ||
      !(track instanceof HTMLElement) ||
      !(shell instanceof HTMLElement)
    ) {
      return;
    }

    if (copy instanceof HTMLElement) {
      section.style.setProperty("--featured-copy-height", `${copy.offsetHeight}px`);
    } else {
      section.style.setProperty("--featured-copy-height", "0px");
    }

    const maxShiftByViewport = Math.max(track.scrollWidth - stage.clientWidth, 0);
    const items = Array.from(
      track.querySelectorAll<HTMLElement>(".featured-project-item"),
    );
    const lastItem = items.at(-1);
    const maxShiftToLastCardStart =
      lastItem instanceof HTMLElement ? Math.max(lastItem.offsetLeft, 0) : 0;
    const maxShift = Math.max(maxShiftByViewport, maxShiftToLastCardStart);
    const stageOffset = shell.offsetTop + stage.offsetTop;
    const stageBlockHeight = stageOffset + stage.offsetHeight;
    const naturalHeight = section.scrollHeight;
    const verticalRatio =
      window.innerWidth >= FEATURED_DESKTOP_BREAKPOINT
        ? FEATURED_VERTICAL_SCROLL_RATIO_DESKTOP
        : FEATURED_VERTICAL_SCROLL_RATIO_NARROW;
    const endHoldPx =
      window.innerWidth >= FEATURED_DESKTOP_BREAKPOINT
        ? FEATURED_END_HOLD_DESKTOP_PX
        : FEATURED_END_HOLD_NARROW_PX;
    const scrollDistance = Math.max(Math.ceil(maxShift * verticalRatio), 1);
    const finalHeight = Math.max(
      naturalHeight,
      Math.ceil(stageBlockHeight + scrollDistance + endHoldPx),
    );
    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    const stickTop = Number.parseFloat(window.getComputedStyle(stage).top) || 0;
    const scrollStart = sectionTop + stageOffset - stickTop;
    const scrollEnd = scrollStart + scrollDistance;

    section.style.minHeight = `${finalHeight}px`;
    shell.style.minHeight = `${finalHeight}px`;
    section.dataset.featuredScrollDistance = String(scrollDistance);
    section.dataset.featuredMaxShift = String(maxShift);
    section.dataset.featuredScrollStart = String(scrollStart);
    section.dataset.featuredScrollEnd = String(scrollEnd);
    section.dataset.featuredStageOffset = String(stageOffset);
  };

  const updateSection = (section: HTMLElement) => {
    const stage = section.querySelector("[data-featured-stage]");
    const track = section.querySelector("[data-featured-track]");
    if (!(stage instanceof HTMLElement) || !(track instanceof HTMLElement)) {
      return false;
    }

    if (!section.classList.contains("is-enhanced")) {
      track.style.transform = "";
      resetItemAnimation(track);
      section.style.minHeight = "";
      const shell = section.querySelector(".featured-projects-shell");
      if (shell instanceof HTMLElement) shell.style.minHeight = "";
      featuredState.delete(section);
      return false;
    }

    const scrollDistance = Number(section.dataset.featuredScrollDistance || "0");
    const maxShift = Number(section.dataset.featuredMaxShift || "0");
    const scrollStart = Number(section.dataset.featuredScrollStart || "0");
    const scrollEnd = Number(section.dataset.featuredScrollEnd || "0");

    if (scrollDistance <= 0 || maxShift <= 0) {
      track.style.transform = "";
      resetItemAnimation(track);
      featuredState.delete(section);
      return false;
    }

    const startDelay =
      window.innerWidth <= FEATURED_NARROW_BREAKPOINT
        ? FEATURED_START_DELAY_NARROW_PX
        : FEATURED_START_DELAY_DESKTOP_PX;
    const isDesktop = window.innerWidth >= FEATURED_DESKTOP_BREAKPOINT;
    const scrollY = window.scrollY;

    let progress = (scrollY - scrollStart - startDelay) / scrollDistance;
    if (scrollY <= scrollStart) progress = 0;
    if (scrollY >= scrollEnd) progress = 1;
    progress = Math.min(Math.max(progress, 0), 1);

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
          ? Math.min(FEATURED_SCROLL_EASE + 0.08, 0.3)
          : FEATURED_SCROLL_EASE;

      if (Math.abs(delta) <= FEATURED_EASE_EPSILON) {
        state.currentProgress = state.targetProgress;
      } else {
        state.currentProgress += delta * easing;
      }
    }

    const renderProgress = state.currentProgress;
    track.style.transform = `translate3d(${-maxShift * renderProgress}px, 0, 0)`;
    updateItemAnimation(track, renderProgress);

    return (
      !reduceMotionQuery.matches &&
      Math.abs(state.targetProgress - state.currentProgress) >
        FEATURED_EASE_EPSILON
    );
  };

  const updateAll = () => {
    frameId = 0;
    let shouldContinue = false;

    featuredSections.forEach((section) => {
      if (updateSection(section)) shouldContinue = true;
    });

    if (shouldContinue) {
      frameId = window.requestAnimationFrame(updateAll);
    }
  };

  const requestUpdate = () => {
    if (!hasEnhancedSections) return;
    if (frameId) return;
    frameId = window.requestAnimationFrame(updateAll);
  };

  const applyMode = () => {
    const enhanced = canEnhance();
    hasEnhancedSections = false;

    featuredSections.forEach((section) => {
      section.style.minHeight = "";
      const shell = section.querySelector(".featured-projects-shell");
      if (shell instanceof HTMLElement) shell.style.minHeight = "";

      if (enhanced) {
        hasEnhancedSections = true;
        section.classList.add("is-enhanced");
        computeSectionMetrics(section);
        return;
      }

      section.classList.remove("is-enhanced");
      const track = section.querySelector("[data-featured-track]");
      if (track instanceof HTMLElement) {
        track.style.transform = "";
        resetItemAnimation(track);
      }
    });

    if (!hasEnhancedSections && frameId) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }
    requestUpdate();
  };

  applyMode();
  window.addEventListener("load", applyMode);
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", applyMode);
  reduceMotionQuery.addEventListener("change", applyMode);

  featuredSections.forEach((section) => {
    const images = section.querySelectorAll<HTMLImageElement>("img");
    images.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", applyMode, { once: true });
    });

    const stage = section.querySelector("[data-featured-stage]");
    if (!(stage instanceof HTMLElement)) return;

    let pendingWheelDelta = 0;
    let wheelFrameId = 0;

    const flushWheelDelta = () => {
      wheelFrameId = 0;
      if (Math.abs(pendingWheelDelta) < 0.01) return;
      const maxScrollLeft = Math.max(stage.scrollWidth - stage.clientWidth, 0);
      stage.scrollLeft = Math.min(
        Math.max(stage.scrollLeft + pendingWheelDelta, 0),
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
        const clampedDelta = Math.sign(rawDelta) * Math.min(Math.abs(rawDelta), 88);
        pendingWheelDelta += clampedDelta * 0.86;

        if (!wheelFrameId) {
          wheelFrameId = window.requestAnimationFrame(flushWheelDelta);
        }
      },
      { passive: false },
    );

    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;

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
      if (!isDragging) return;
      const deltaX = event.clientX - dragStartX;
      stage.scrollLeft = dragStartScrollLeft - deltaX;
    });

    const stopDragging = (event: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      stage.classList.remove("is-dragging");
      if (stage.hasPointerCapture?.(event.pointerId)) {
        stage.releasePointerCapture(event.pointerId);
      }
    };

    stage.addEventListener("pointerup", stopDragging);
    stage.addEventListener("pointercancel", stopDragging);
  });
}

const approachTabGroups = Array.from(
  document.querySelectorAll<HTMLElement>("[data-approach-tabs]"),
);

approachTabGroups.forEach((group) => {
  const tabs = Array.from(group.querySelectorAll<HTMLElement>("[role='tab']"));
  const panels = Array.from(
    group.querySelectorAll<HTMLElement>("[role='tabpanel']"),
  );
  const panelShell = group.querySelector(".approach-panels");
  if (tabs.length === 0 || panels.length === 0) return;
  if (!(panelShell instanceof HTMLElement)) return;

  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hoverPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const TRANSITION_MS = 300;
  let transitionTimer = 0;

  const clearPanelState = () => {
    panels.forEach((panel) => {
      panel.classList.remove("is-entering", "is-leaving");
    });
  };

  const activateTab = (nextTab: HTMLElement, withFocus = false) => {
    const tabKey = nextTab.getAttribute("data-tab-id");
    if (!tabKey) return;

    const nextPanel = panels.find(
      (panel) => panel.getAttribute("data-panel-id") === tabKey,
    );
    if (!(nextPanel instanceof HTMLElement)) return;

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
      panels.forEach((panel) => panel.toggleAttribute("hidden", panel !== nextPanel));
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
        panels.forEach((panel) => panel.toggleAttribute("hidden", panel !== nextPanel));
        clearPanelState();
        panelShell.classList.remove("is-animating");
        panelShell.style.height = "";
        transitionTimer = 0;
      }, TRANSITION_MS);
    }

    if (withFocus) {
      nextTab.focus();
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("mouseenter", () => {
      if (!hoverPointerQuery.matches) return;
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
      if (!targetTab) return;

      event.preventDefault();
      activateTab(targetTab, true);
    });
  });

  const initialTab =
    tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
  if (!initialTab) return;
  activateTab(initialTab);
});

const testimonialTabGroups = Array.from(
  document.querySelectorAll<HTMLElement>("[data-testimonial-tabs]"),
);

testimonialTabGroups.forEach((group) => {
  const tabs = Array.from(
    group.querySelectorAll<HTMLElement>("[data-testimonial-tab-id]"),
  );
  const panels = Array.from(
    group.querySelectorAll<HTMLElement>("[data-testimonial-panel-id]"),
  );
  if (tabs.length === 0 || panels.length === 0) return;
  group.style.setProperty("--testimonial-tab-count", String(tabs.length));

  const hoverPointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");

  const activateTab = (nextTab: HTMLElement, withFocus = false) => {
    const tabKey = nextTab.getAttribute("data-testimonial-tab-id");
    if (!tabKey) return;

    const nextPanel = panels.find(
      (panel) => panel.getAttribute("data-testimonial-panel-id") === tabKey,
    );
    if (!(nextPanel instanceof HTMLElement)) return;

    tabs.forEach((tab) => {
      const isActive = tab === nextTab;
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });

    const activeIndex = tabs.indexOf(nextTab);
    if (activeIndex >= 0) {
      group.style.setProperty("--testimonial-active-index", String(activeIndex));
      group.style.setProperty("--testimonial-active-column", String(activeIndex + 1));
    }
    group.setAttribute("data-active-testimonial", tabKey);

    panels.forEach((panel) => {
      const isActive = panel === nextPanel;
      panel.classList.toggle("is-active", isActive);
      panel.setAttribute("aria-hidden", isActive ? "false" : "true");
    });

    if (withFocus) {
      nextTab.focus();
    }
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("mouseenter", () => {
      if (!hoverPointerQuery.matches) return;
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
      if (!targetTab) return;

      event.preventDefault();
      activateTab(targetTab, true);
    });
  });

  panels.forEach((panel) => {
    panel.hidden = false;
    panel.classList.remove("is-active");
    panel.setAttribute("aria-hidden", "true");
  });

  const initialTab =
    tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0];
  if (!initialTab) return;
  activateTab(initialTab);
});

const homeFaqItems = Array.from(
  document.querySelectorAll<HTMLDetailsElement>("[data-home-faq-item]"),
);

homeFaqItems.forEach((item) => {
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

  const onTransitionEnd = (event: TransitionEvent) => {
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

  syncState();
  answer.addEventListener("transitionend", onTransitionEnd);

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
});

export {};
