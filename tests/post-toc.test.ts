// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  installImmediateAnimationFrame,
  installMatchMedia,
} from "./browser-helpers";

describe("post toc", () => {
  beforeEach(() => {
    vi.resetModules();
    installMatchMedia();
    installImmediateAnimationFrame();
    document.documentElement.removeAttribute("data-toc-history-bound");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
    document.body.innerHTML = `
      <aside data-post-toc>
        <ol>
          <li data-toc-section>
            <a href="#section-one">Section one</a>
          </li>
        </ol>
      </aside>
      <h2 id="section-one">Section one</h2>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    document.documentElement.removeAttribute("data-toc-history-bound");
  });

  it("updates the hash and focuses the heading target", async () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");

    await import("../src/scripts/post-toc");

    const link = document.querySelector('a[href="#section-one"]');
    const heading = document.getElementById("section-one");

    if (!(link instanceof HTMLAnchorElement) || !(heading instanceof HTMLElement)) {
      throw new Error("Expected TOC elements");
    }

    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0,
      }),
    );

    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "#section-one");
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    expect(document.activeElement).toBe(heading);
  });
});
