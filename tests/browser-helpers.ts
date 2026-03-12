import { vi } from "vitest";

export const installMatchMedia = (
  resolveMatches: (query: string) => boolean = () => false,
) => {
  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: resolveMatches(query),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMedia,
  });

  return matchMedia;
};

export const installImmediateAnimationFrame = () => {
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    callback(0);
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
};
