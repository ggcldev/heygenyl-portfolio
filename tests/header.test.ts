// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installImmediateAnimationFrame,
  installMatchMedia,
} from "./browser-helpers";

describe("header navigation", () => {
  beforeEach(() => {
    vi.resetModules();
    installMatchMedia();
    installImmediateAnimationFrame();
    document.documentElement.dataset.theme = "light";
    document.body.innerHTML = `
      <header class="site-header">
        <nav>
          <button
            id="nav-toggle"
            aria-controls="mobile-nav"
            aria-expanded="false"
            aria-haspopup="dialog"
          >
            Menu
          </button>
          <div
            id="mobile-nav"
            role="dialog"
            aria-hidden="true"
            aria-modal="true"
            tabindex="-1"
            hidden
          >
            <button id="mobile-close">Close</button>
            <a href="/services/">Services</a>
            <button data-theme-toggle>Theme</button>
          </div>
        </nav>
      </header>
      <main></main>
      <footer></footer>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    delete document.documentElement.dataset.nav;
    delete document.documentElement.dataset.theme;
  });

  it("opens and closes the mobile nav with dialog semantics", async () => {
    await import("../src/scripts/header");

    const navButton = document.getElementById("nav-toggle");
    const mobileNav = document.getElementById("mobile-nav");
    const mobileClose = document.getElementById("mobile-close");
    const main = document.querySelector("main");

    if (
      !(navButton instanceof HTMLButtonElement) ||
      !(mobileNav instanceof HTMLElement) ||
      !(mobileClose instanceof HTMLButtonElement) ||
      !(main instanceof HTMLElement)
    ) {
      throw new Error("Expected header elements");
    }

    navButton.focus();
    navButton.click();

    expect(navButton.getAttribute("aria-expanded")).toBe("true");
    expect(mobileNav.hidden).toBe(false);
    expect(mobileNav.getAttribute("aria-hidden")).toBe("false");
    expect(main.inert).toBe(true);
    expect(document.activeElement).toBe(mobileClose);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(navButton.getAttribute("aria-expanded")).toBe("false");
    expect(mobileNav.hidden).toBe(true);
    expect(mobileNav.getAttribute("aria-hidden")).toBe("true");
    expect(main.inert).toBe(false);
    expect(document.activeElement).toBe(navButton);
  });
});
