const THEME_STORAGE_KEY = "theme";

const getPreferredTheme = (): "light" | "dark" => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Ignore storage access errors and fall through to media query.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const applyTheme = (theme: "light" | "dark") => {
  document.documentElement.dataset.theme = theme;
  const buttons = document.querySelectorAll<HTMLElement>("[data-theme-toggle]");
  buttons.forEach((button) =>
    button.setAttribute("aria-label", `Toggle theme (current: ${theme})`),
  );
};

const toggleTheme = () => {
  const current =
    document.documentElement.dataset.theme === "light" ||
    document.documentElement.dataset.theme === "dark"
      ? document.documentElement.dataset.theme
      : getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";

  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Ignore storage access errors.
  }

  applyTheme(next);
};

applyTheme(
  document.documentElement.dataset.theme === "light" ||
    document.documentElement.dataset.theme === "dark"
    ? document.documentElement.dataset.theme
    : getPreferredTheme(),
);

const navButton = document.getElementById("nav-toggle");
const mobileNav = document.getElementById("mobile-nav");
const mobileClose = document.getElementById("mobile-close");
const navElement = document.querySelector("nav");
const siteHeader = document.querySelector(".site-header");
const mainContent = document.querySelector("main");
const siteFooter = document.querySelector("footer");
let lastFocusedElement: HTMLElement | null = null;
let lastNavToggleAt = 0;

if (mobileNav instanceof HTMLElement && mobileNav.parentElement !== document.body) {
  document.body.appendChild(mobileNav);
}

const getFocusableElements = (): HTMLElement[] => {
  if (!(mobileNav instanceof HTMLElement)) return [];

  return Array.from(
    mobileNav.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hidden);
};

const applyNav = (state: "open" | "closed") => {
  const isOpen = state === "open";
  const wasOpen = document.documentElement.dataset.nav === "open";
  document.documentElement.dataset.nav = isOpen ? "open" : "closed";

  if (navButton instanceof HTMLElement) {
    navButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  document.body.style.overflow = isOpen ? "hidden" : "";

  [mainContent, siteFooter].forEach((element) => {
    if (element instanceof HTMLElement) {
      element.inert = isOpen;
    }
  });

  if (!(mobileNav instanceof HTMLElement)) return;

  mobileNav.hidden = !isOpen;
  mobileNav.setAttribute("aria-hidden", isOpen ? "false" : "true");

  if (isOpen) {
    const focusableElements = getFocusableElements();
    const firstFocusable = focusableElements[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      mobileNav.focus();
    }
    return;
  }

  if (!wasOpen) return;

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  } else if (navButton instanceof HTMLElement) {
    navButton.focus();
  }

  lastFocusedElement = null;
};

const closeNav = () => applyNav("closed");

const openNav = () => {
  lastFocusedElement =
    document.activeElement instanceof HTMLElement ? document.activeElement : null;
  applyNav("open");
};

const toggleNav = () =>
  document.documentElement.dataset.nav === "open" ? closeNav() : openNav();

applyNav("closed");

const applyHeaderScrollState = () => {
  if (!(siteHeader instanceof HTMLElement)) return;
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
};

let headerScrollTicking = false;
const onHeaderScroll = () => {
  if (headerScrollTicking) return;
  headerScrollTicking = true;
  window.requestAnimationFrame(() => {
    applyHeaderScrollState();
    headerScrollTicking = false;
  });
};

applyHeaderScrollState();

if (navButton instanceof HTMLElement) {
  const onNavToggle = (event: Event) => {
    const now = Date.now();
    if (now - lastNavToggleAt < 320) return;
    lastNavToggleAt = now;
    event.preventDefault();
    toggleNav();
  };

  navButton.addEventListener("click", onNavToggle);
  navButton.addEventListener("touchend", onNavToggle, { passive: false });
}

if (mobileClose instanceof HTMLElement) {
  mobileClose.addEventListener("click", closeNav);
}

if (mobileNav instanceof HTMLElement) {
  mobileNav.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("a")) closeNav();
  });
}

window.addEventListener("scroll", onHeaderScroll, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth >= 768 && document.documentElement.dataset.nav === "open") {
    closeNav();
  }
});

window.addEventListener("keydown", (event) => {
  if (document.documentElement.dataset.nav !== "open") return;

  if (event.key === "Escape") {
    closeNav();
    return;
  }

  if (event.key !== "Tab") return;

  const focusableElements = getFocusableElements();
  if (focusableElements.length === 0) {
    event.preventDefault();
    if (mobileNav instanceof HTMLElement) mobileNav.focus();
    return;
  }

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements.at(-1);
  const activeElement = document.activeElement;
  if (!firstFocusable || !lastFocusable) return;

  if (event.shiftKey && activeElement === firstFocusable) {
    event.preventDefault();
    lastFocusable.focus();
    return;
  }

  if (!event.shiftKey && activeElement === lastFocusable) {
    event.preventDefault();
    firstFocusable.focus();
  }
});

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (!target.closest("[data-theme-toggle]")) return;
  event.preventDefault();
  toggleTheme();
});

if (navElement instanceof HTMLElement) {
  navElement.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest("a")) closeNav();
  });
}

export {};
