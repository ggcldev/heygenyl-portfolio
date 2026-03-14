// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("contact form", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("submits form data to the configured endpoint", async () => {
    const { submitContactForm } = await import("../src/scripts/contact-form");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    const formData = new FormData();

    formData.set("name", "Ada Lovelace");
    formData.set("email", "ada@example.com");
    formData.set("service", "Freelance SEO specialist");
    formData.set("message", "Need help with a local SEO launch.");

    const response = await submitContactForm(
      "https://formsubmit.co/ajax/hi@heygenyl.com",
      formData,
      fetchMock as typeof fetch,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://formsubmit.co/ajax/hi@heygenyl.com",
      expect.objectContaining({
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      }),
    );
    expect(response.ok).toBe(true);
  });

  it("submits the form and redirects to the thank-you page", async () => {
    const { attachContactForm } = await import("../src/scripts/contact-form");

    document.body.innerHTML = `
      <form
        data-contact-ajax-endpoint="https://formsubmit.co/ajax/hi@heygenyl.com"
        data-contact-success-url="/contact/thanks/"
      >
        <input name="name" value="Ada Lovelace" />
        <input name="email" value="ada@example.com" />
        <input name="service" value="Freelance SEO specialist" />
        <textarea name="message">Need help with a local SEO launch.</textarea>
        <p data-contact-feedback hidden></p>
        <button type="submit">Send project inquiry</button>
      </form>
    `;

    const navigate = vi.fn();
    const submitForm = vi.fn().mockResolvedValue({ ok: true });
    const form = document.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected a contact form");
    }

    attachContactForm(form, { navigate, submitForm });
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(submitForm).toHaveBeenCalledWith(
      "https://formsubmit.co/ajax/hi@heygenyl.com",
      expect.any(FormData),
    );
    expect(navigate).toHaveBeenCalledWith("/contact/thanks/");
  });

  it("shows an inline error when the submission fails", async () => {
    const { attachContactForm } = await import("../src/scripts/contact-form");

    document.body.innerHTML = `
      <form
        data-contact-ajax-endpoint="https://formsubmit.co/ajax/hi@heygenyl.com"
        data-contact-success-url="/contact/thanks/"
      >
        <input name="name" value="Ada Lovelace" />
        <input name="email" value="ada@example.com" />
        <input name="service" value="Freelance SEO specialist" />
        <textarea name="message">Need help with a local SEO launch.</textarea>
        <p data-contact-feedback hidden></p>
        <button type="submit">Send project inquiry</button>
      </form>
    `;

    const navigate = vi.fn();
    const submitForm = vi.fn().mockResolvedValue({ ok: false });
    const form = document.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected a contact form");
    }

    attachContactForm(form, { navigate, submitForm });
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const feedback = form.querySelector("[data-contact-feedback]");
    if (!(feedback instanceof HTMLElement)) {
      throw new Error("Expected feedback element");
    }

    expect(navigate).not.toHaveBeenCalled();
    expect(feedback.hidden).toBe(false);
    expect(feedback.dataset.state).toBe("error");
    expect(feedback.textContent).toContain("could not be sent");
  });

  it("blocks submission when human verification is incorrect", async () => {
    const { attachContactForm } = await import("../src/scripts/contact-form");

    vi.spyOn(Math, "random").mockReturnValue(0);

    document.body.innerHTML = `
      <form
        data-contact-ajax-endpoint="https://formsubmit.co/ajax/hi@heygenyl.com"
        data-contact-success-url="/contact/thanks/"
        data-contact-min-seconds="0"
      >
        <input name="name" value="Ada Lovelace" />
        <input name="email" value="ada@example.com" />
        <input name="service" value="Freelance SEO specialist" />
        <textarea name="message">Need help with a local SEO launch.</textarea>
        <div data-human-check>
          <p data-human-check-prompt></p>
          <input data-human-check-input name="humanCheckAnswer" />
        </div>
        <p data-contact-feedback hidden></p>
        <button type="submit">Send project inquiry</button>
      </form>
    `;

    const navigate = vi.fn();
    const submitForm = vi.fn().mockResolvedValue({ ok: true });
    const form = document.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected a contact form");
    }

    attachContactForm(form, { navigate, submitForm });

    const humanInput = form.querySelector<HTMLInputElement>("[data-human-check-input]");
    if (!(humanInput instanceof HTMLInputElement)) {
      throw new Error("Expected human verification input");
    }
    humanInput.value = "99";

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const feedback = form.querySelector("[data-contact-feedback]");
    if (!(feedback instanceof HTMLElement)) {
      throw new Error("Expected feedback element");
    }

    expect(submitForm).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(feedback.hidden).toBe(false);
    expect(feedback.dataset.state).toBe("error");
    expect(feedback.textContent).toContain("Human verification failed");
  });

  it("blocks submissions that are sent too quickly", async () => {
    const { attachContactForm } = await import("../src/scripts/contact-form");

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    document.body.innerHTML = `
      <form
        data-contact-ajax-endpoint="https://formsubmit.co/ajax/hi@heygenyl.com"
        data-contact-success-url="/contact/thanks/"
        data-contact-min-seconds="4"
      >
        <input name="name" value="Ada Lovelace" />
        <input name="email" value="ada@example.com" />
        <input name="service" value="Freelance SEO specialist" />
        <textarea name="message">Need help with a local SEO launch.</textarea>
        <p data-contact-feedback hidden></p>
        <button type="submit">Send project inquiry</button>
      </form>
    `;

    const navigate = vi.fn();
    const submitForm = vi.fn().mockResolvedValue({ ok: true });
    const form = document.querySelector("form");
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected a contact form");
    }

    attachContactForm(form, { navigate, submitForm });

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();

    const feedback = form.querySelector("[data-contact-feedback]");
    if (!(feedback instanceof HTMLElement)) {
      throw new Error("Expected feedback element");
    }

    expect(submitForm).not.toHaveBeenCalled();
    expect(feedback.textContent).toContain("Please wait");

    vi.setSystemTime(new Date("2026-01-01T00:00:05Z"));

    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await Promise.resolve();

    expect(submitForm).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/contact/thanks/");
  });
});
