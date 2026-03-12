type ContactFormOptions = {
  navigate?: (href: string) => void;
  submitForm?: (
    endpoint: string,
    formData: FormData,
  ) => Promise<{ ok: boolean }>;
};

const setFeedback = (
  feedback: HTMLElement | null,
  state: "pending" | "error" | "idle",
  message: string,
) => {
  if (!feedback) {
    return;
  }

  feedback.hidden = state === "idle" || message.length === 0;
  feedback.dataset.state = state;
  feedback.textContent = message;
};

const setSubmitButtonState = (
  button: HTMLButtonElement | null,
  isPending: boolean,
) => {
  if (!button) {
    return;
  }

  if (!button.dataset.idleLabel) {
    button.dataset.idleLabel = button.textContent?.trim() || "Send project inquiry";
  }

  button.disabled = isPending;
  button.textContent = isPending ? "Sending..." : button.dataset.idleLabel;
};

export const submitContactForm = async (
  endpoint: string,
  formData: FormData,
  fetchImpl: typeof fetch = fetch,
) =>
  fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
    },
    body: formData,
  });

export const attachContactForm = (
  form: HTMLFormElement,
  {
    navigate = (href) => window.location.assign(href),
    submitForm = submitContactForm,
  }: ContactFormOptions = {},
) => {
  form.addEventListener("submit", async (event) => {
    const endpoint = form.dataset.contactAjaxEndpoint;
    if (!endpoint) {
      return;
    }

    event.preventDefault();
    const feedback = form.querySelector<HTMLElement>("[data-contact-feedback]");
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const successUrl = form.dataset.contactSuccessUrl || "/contact/thanks/";

    setSubmitButtonState(submitButton, true);
    setFeedback(feedback, "pending", "Sending your inquiry...");

    try {
      const response = await submitForm(endpoint, new FormData(form));
      if (!response.ok) {
        throw new Error("Contact form submission failed");
      }

      form.reset();
      setFeedback(feedback, "idle", "");
      navigate(successUrl);
    } catch {
      setFeedback(
        feedback,
        "error",
        "The form could not be sent right now. Use the direct email link below or try again in a minute.",
      );
    } finally {
      setSubmitButtonState(submitButton, false);
    }
  });
};

const form = document.querySelector<HTMLFormElement>("[data-contact-form]");

if (form) {
  attachContactForm(form);
}
