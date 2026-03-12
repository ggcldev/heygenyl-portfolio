const tocRoots = document.querySelectorAll<HTMLElement>(
  "[data-post-toc]:not([data-toc-ready])",
);
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const focusTarget = (target: HTMLElement) => {
  const hadTabIndex = target.hasAttribute("tabindex");
  if (!hadTabIndex) {
    target.setAttribute("tabindex", "-1");
  }

  target.focus({ preventScroll: true });

  if (!hadTabIndex) {
    target.addEventListener(
      "blur",
      () => {
        if (target.getAttribute("tabindex") === "-1") {
          target.removeAttribute("tabindex");
        }
      },
      { once: true },
    );
  }
};

const scrollToHashTarget = (hash: string, shouldFocus = true) => {
  if (!hash || hash.length < 2) return false;

  const target = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!(target instanceof HTMLElement)) return false;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });

  if (shouldFocus) {
    window.requestAnimationFrame(() => focusTarget(target));
  }

  return true;
};

const closeSection = (section: Element) => {
  section.classList.remove("is-open");
  const toggle = section.querySelector("[data-toc-toggle]");
  const panel = section.querySelector("[data-toc-panel]");

  if (toggle instanceof HTMLButtonElement) {
    toggle.setAttribute("aria-expanded", "false");
  }

  if (panel instanceof HTMLElement) {
    panel.classList.remove("is-open");
  }
};

const openSection = (section: Element) => {
  section.classList.add("is-open");
  const toggle = section.querySelector("[data-toc-toggle]");
  const panel = section.querySelector("[data-toc-panel]");

  if (toggle instanceof HTMLButtonElement) {
    toggle.setAttribute("aria-expanded", "true");
  }

  if (panel instanceof HTMLElement) {
    panel.classList.add("is-open");
  }
};

tocRoots.forEach((root) => {
  root.setAttribute("data-toc-ready", "true");
  const sections = Array.from(root.querySelectorAll("[data-toc-section]"));

  sections.forEach((section) => {
    const toggle = section.querySelector("[data-toc-toggle]");
    if (!(toggle instanceof HTMLButtonElement)) return;

    toggle.addEventListener("click", () => {
      const shouldOpen = !section.classList.contains("is-open");
      sections.forEach((item) => {
        if (item !== section) closeSection(item);
      });

      if (shouldOpen) {
        openSection(section);
      } else {
        closeSection(section);
      }
    });
  });

  const tocLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'));
  tocLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const href = link.getAttribute("href");
      if (!href || href.length < 2) return;
      if (!scrollToHashTarget(href, false)) return;

      event.preventDefault();
      if (window.location.hash !== href) {
        window.history.pushState(null, "", href);
      }

      scrollToHashTarget(href);
    });
  });
});

if (!document.documentElement.hasAttribute("data-toc-history-bound")) {
  const syncHashNavigation = () => {
    scrollToHashTarget(window.location.hash);
  };

  window.addEventListener("hashchange", syncHashNavigation);
  window.addEventListener("popstate", syncHashNavigation);
  document.documentElement.setAttribute("data-toc-history-bound", "true");
}

export {};
