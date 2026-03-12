// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { installMatchMedia } from "./browser-helpers";

describe("homepage approach tabs", () => {
  beforeEach(() => {
    vi.resetModules();
    installMatchMedia((query) =>
      query.includes("prefers-reduced-motion"),
    );
    document.body.innerHTML = `
      <div data-approach-tabs>
        <button role="tab" data-tab-id="audit" aria-selected="true" tabindex="0">
          Audit
        </button>
        <button role="tab" data-tab-id="ship" aria-selected="false" tabindex="-1">
          Ship
        </button>
        <div class="approach-panels">
          <section role="tabpanel" data-panel-id="audit">Audit panel</section>
          <section role="tabpanel" data-panel-id="ship" hidden>Ship panel</section>
        </div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("switches panels when a tab is clicked", async () => {
    await import("../src/scripts/homepage");

    const tabs = Array.from(document.querySelectorAll<HTMLElement>("[role='tab']"));
    const panels = Array.from(
      document.querySelectorAll<HTMLElement>("[role='tabpanel']"),
    );
    const nextTab = tabs[1];
    const firstPanel = panels[0];
    const secondPanel = panels[1];

    if (!nextTab || !firstPanel || !secondPanel) {
      throw new Error("Expected homepage tabs");
    }

    nextTab.click();

    expect(nextTab.getAttribute("aria-selected")).toBe("true");
    expect(nextTab.getAttribute("tabindex")).toBe("0");
    expect(firstPanel.hidden).toBe(true);
    expect(secondPanel.hidden).toBe(false);
  });
});
