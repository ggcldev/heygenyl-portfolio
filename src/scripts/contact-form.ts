type ContactFormOptions = {
  navigate?: (href: string) => void;
  submitForm?: (
    endpoint: string,
    formData: FormData,
  ) => Promise<{ ok: boolean }>;
};

type HumanCheckState = {
  input: HTMLInputElement;
  expectedAnswer: string;
};

const getMinSubmitSeconds = (value: string | undefined) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
};

const setupHumanCheck = (form: HTMLFormElement): HumanCheckState | null => {
  const prompt = form.querySelector<HTMLElement>("[data-human-check-prompt]");
  const input = form.querySelector<HTMLInputElement>("[data-human-check-input]");

  if (!prompt || !input) {
    return null;
  }

  const left = Math.floor(Math.random() * 8) + 2;
  const right = Math.floor(Math.random() * 8) + 1;

  prompt.textContent = `What is ${left} + ${right}?`;
  input.value = "";

  return {
    input,
    expectedAnswer: String(left + right),
  };
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
  const minSubmitSeconds = getMinSubmitSeconds(form.dataset.contactMinSeconds);
  const startedAt = Date.now();
  let humanCheck = setupHumanCheck(form);

  form.addEventListener("submit", async (event) => {
    const endpoint = form.dataset.contactAjaxEndpoint;
    if (!endpoint) {
      return;
    }

    event.preventDefault();
    const feedback = form.querySelector<HTMLElement>("[data-contact-feedback]");
    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const successUrl = form.dataset.contactSuccessUrl || "/contact/thanks/";

    if (minSubmitSeconds > 0) {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      if (elapsedSeconds < minSubmitSeconds) {
        const waitSeconds = Math.ceil(minSubmitSeconds - elapsedSeconds);
        setFeedback(
          feedback,
          "error",
          waitSeconds > 1
            ? `Please wait ${waitSeconds} more seconds before sending.`
            : "Please wait one more second before sending.",
        );
        return;
      }
    }

    if (humanCheck) {
      const answer = humanCheck.input.value.trim();
      if (answer !== humanCheck.expectedAnswer) {
        setFeedback(
          feedback,
          "error",
          "Human verification failed. Please solve the check and try again.",
        );
        humanCheck = setupHumanCheck(form);
        humanCheck?.input.focus();
        return;
      }
    }

    setSubmitButtonState(submitButton, true);
    setFeedback(feedback, "pending", "Sending your inquiry...");

    try {
      const formData = new FormData(form);
      formData.delete("humanCheckAnswer");

      const response = await submitForm(endpoint, formData);
      if (!response.ok) {
        throw new Error("Contact form submission failed");
      }

      form.reset();
      humanCheck = setupHumanCheck(form);
      setFeedback(feedback, "idle", "");
      navigate(successUrl);
    } catch {
      humanCheck = setupHumanCheck(form);
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
