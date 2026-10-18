// Free SEO audit form in the homepage hero, in two steps:
//   1. Website + "Get my free audit": the audit starts right away.
//   2. Email + "Get my report": the report downloads once the email is in and
//      the audit is done (whichever comes last), and the lead is emailed to me.
// The Worker finds the sitemap and checks pages in batches; this script shows
// progress and builds the issue list and the .xlsx report in the browser.

import type { AuditReport } from "../lib/seo-audit/report";
import type { AuditErrorResponse, AuditPagesResponse, AuditStartResponse, PageData } from "../lib/seo-audit/types";
import { isValidEmail, normalizeSiteInput } from "../lib/seo-audit/url";

const BATCH_SIZE = 5;
const RETRY_BATCH_SIZE = 2;
const RETRY_DELAY_MS = 4000;
const RETRY_STATUSES = new Set([429, 503]);
const TOKEN_WAIT_MS = 20_000;
const TICK_WAIT_MS = 180_000;
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const CONTACT = { name: "Hey Genyl", website: "https://heygenyl.com" };

interface TurnstileApi {
	render(container: HTMLElement, options: Record<string, unknown>): string;
	reset(widgetId?: string): void;
}

declare global {
	interface Window {
		turnstile?: TurnstileApi;
		gtag?: (...args: unknown[]) => void;
	}
}

type Json = AuditStartResponse | AuditPagesResponse | AuditErrorResponse;
type Step = "site" | "email" | "done";

let turnstileLoader: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
	if (window.turnstile) return Promise.resolve(window.turnstile);
	turnstileLoader ??= new Promise<TurnstileApi>((resolve, reject) => {
		const script = document.createElement("script");
		script.src = TURNSTILE_SRC;
		script.async = true;
		script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile missing")));
		script.onerror = () => {
			turnstileLoader = null;
			reject(new Error("Turnstile failed to load"));
		};
		document.head.append(script);
	});
	return turnstileLoader;
}

class AuditFailure extends Error {}

async function postJson(url: string, body: unknown): Promise<Json> {
	let response: Response;
	try {
		response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
	} catch {
		throw new AuditFailure("Couldn't reach the audit service. Check your connection and try again.");
	}
	try {
		return (await response.json()) as Json;
	} catch {
		throw new AuditFailure("The audit service had a problem. Please try again in a minute.");
	}
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const failedPage = (url: string, error: string): PageData => ({
	url,
	status: 0,
	error,
	redirectTo: null,
	contentType: "",
	ms: 0,
	bytes: 0,
	truncated: false,
	xRobotsTag: null,
	html: null,
});

/** One audit run. Superseded runs keep going quietly but their results are ignored. */
interface Job {
	id: number;
	host: string;
	report: AuditReport | null;
	/** The finished .xlsx, built as soon as the run ends. */
	file: { bytes: Uint8Array; name: string } | null;
	error: string | null;
	pagesFound: number | null;
	done: Promise<void>;
}

export function initSeoAudit(form: HTMLFormElement): void {
	const endpoint = (form.dataset.endpoint ?? "/api/seo-audit").replace(/\/$/, "");
	const siteKey = form.dataset.sitekey ?? "";
	// Empty in local dev, so test runs never email real leads.
	const leadEmail = form.dataset.leadEmail ?? "";
	const contactEmail = form.dataset.contactEmail ?? leadEmail;

	const websiteInput = form.querySelector<HTMLInputElement>("[name=website]");
	const emailInput = form.querySelector<HTMLInputElement>("[name=email]");
	const submit = form.querySelector<HTMLButtonElement>("[type=submit]");
	const submitLabel = submit?.querySelector<HTMLElement>(".button-cta > span");
	const widgetBox = form.querySelector<HTMLElement>("[data-turnstile]");
	const status = form.querySelector<HTMLElement>("[data-status]");
	const statusText = form.querySelector<HTMLElement>("[data-status-text]");
	const bar = form.querySelector<HTMLElement>("[data-progress]");
	const download = form.querySelector<HTMLAnchorElement>("[data-download]");
	const back = form.querySelector<HTMLButtonElement>("[data-back]");
	if (!websiteInput || !emailInput || !submit || !submitLabel || !widgetBox || !status || !statusText || !bar || !download || !back) return;

	let step: Step = "site";
	let job: Job | null = null;
	let jobCounter = 0;
	let email: string | null = null;
	let widgetId: string | null = null;
	let token: string | null = null;
	let tokenWaiters: Array<(value: string) => void> = [];
	let downloadUrl: string | null = null;

	// --- UI ---

	const setStatus = (text: string, state: "running" | "ready" | "done" | "error", progress?: number) => {
		status.hidden = false;
		status.dataset.state = state;
		statusText.textContent = text;
		statusText.setAttribute("role", state === "error" ? "alert" : "status");
		bar.style.setProperty("--progress", String(progress ?? (state === "running" ? 0 : 1)));
		bar.toggleAttribute("data-indeterminate", state === "running" && progress === undefined);
	};

	const showStep = (next: Step) => {
		step = next;
		form.dataset.step = next;
		const onSite = next === "site";
		websiteInput.hidden = !onSite;
		emailInput.hidden = onSite;
		emailInput.disabled = next === "done";
		websiteInput.disabled = false;
		submit.disabled = next === "done";
		submit.hidden = next === "done";
		submitLabel.textContent = onSite ? "Get my free audit" : "Get my report";
		back.hidden = onSite;
		back.textContent = next === "done" ? "Audit another site" : "Change website";
		if (onSite) {
			download.hidden = true;
			websiteInput.focus();
		} else if (next === "email") {
			emailInput.focus();
		}
	};

	// --- Turnstile (security check) ---

	const ensureWidget = async () => {
		if (widgetId !== null || !siteKey) return;
		const turnstile = await loadTurnstile();
		if (widgetId !== null) return;
		widgetId = turnstile.render(widgetBox, {
			sitekey: siteKey,
			theme: "dark",
			appearance: "interaction-only",
			size: "flexible",
			action: "seo-audit",
			callback: (value: string) => {
				token = value;
				const waiters = tokenWaiters;
				tokenWaiters = [];
				for (const resolve of waiters) resolve(value);
			},
			"expired-callback": () => {
				token = null;
			},
			"error-callback": () => {
				token = null;
			},
			// Cloudflare wants a human click ("Verify you are human"): wait for it.
			"before-interactive-callback": () => {
				needsTick = true;
				onNeedsTick?.();
			},
			"after-interactive-callback": () => {
				needsTick = false;
			},
		});
	};

	let needsTick = false;
	let onNeedsTick: (() => void) | null = null;

	/** A Turnstile token. Waits 20 s for the invisible check, or 3 min once the visitor has to tick the box. */
	const getToken = async (whenTickNeeded: () => void): Promise<string> => {
		if (!siteKey) throw new AuditFailure("The audit tool isn't set up yet. Please email me instead.");
		try {
			await ensureWidget();
		} catch {
			throw new AuditFailure("The security check couldn't load. Turn off content blockers for this site and try again.");
		}
		if (token) return token;
		return new Promise<string>((resolve, reject) => {
			const fail = () => reject(new AuditFailure("Please tick the security check box, then try again."));
			let timer = setTimeout(fail, needsTick ? TICK_WAIT_MS : TOKEN_WAIT_MS);
			const tickNeeded = () => {
				clearTimeout(timer);
				timer = setTimeout(fail, TICK_WAIT_MS);
				whenTickNeeded();
			};
			onNeedsTick = tickNeeded;
			if (needsTick) whenTickNeeded();
			tokenWaiters.push((value) => {
				clearTimeout(timer);
				onNeedsTick = null;
				resolve(value);
			});
		});
	};

	const useUpToken = () => {
		token = null;
		if (widgetId !== null) window.turnstile?.reset(widgetId);
	};

	// Load the security check as soon as someone shows interest in the form.
	const warmUp = () => void ensureWidget().catch(() => undefined);
	form.addEventListener("focusin", warmUp, { once: true });
	form.addEventListener("pointerenter", warmUp, { once: true });

	// --- Lead email (FormSubmit, same as the contact form) ---

	const sendLead = (fields: Record<string, string | number>) => {
		if (!leadEmail) {
			console.info("[seo-audit] lead (not sent in dev):", fields);
			return;
		}
		fetch(`https://formsubmit.co/ajax/${leadEmail}`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Accept: "application/json" },
			body: JSON.stringify({ _subject: `Free SEO audit: ${fields.website}`, _template: "table", ...fields }),
			keepalive: true,
		}).catch(() => undefined);
	};

	let leadSent = false;
	const leadFor = (current: Job, result: string): Record<string, string | number> => {
		const fields: Record<string, string | number> = { website: current.host, email: email ?? "", result };
		if (current.pagesFound !== null) fields.pages_found = current.pagesFound;
		if (current.report) {
			fields.pages_checked = current.report.pages.length;
			fields.high = current.report.counts.High;
			fields.medium = current.report.counts.Medium;
			fields.low = current.report.counts.Low;
		}
		return fields;
	};

	window.addEventListener("pagehide", () => {
		// Only runs that passed the security check (they have a page count) count as leads.
		if (job && email && !leadSent && job.pagesFound !== null) {
			leadSent = true;
			sendLead(leadFor(job, "Left the page before the audit finished"));
		}
	});

	// --- Audit run ---

	const checkBatches = async (session: string, urls: string[], size: number, onProgress: (done: number) => void) => {
		const results: PageData[] = [];
		for (let i = 0; i < urls.length; i += size) {
			const batch = urls.slice(i, i + size);
			let data = await postJson(`${endpoint}/pages`, { session, urls: batch }).catch(() => null);
			if (!data || !data.ok) {
				if (data && !data.ok && data.code === "expired") throw new AuditFailure(data.error);
				await sleep(1500);
				data = await postJson(`${endpoint}/pages`, { session, urls: batch }).catch(() => null);
			}
			if (data && data.ok && "pages" in data) results.push(...data.pages);
			else results.push(...batch.map((url) => failedPage(url, "Our checker had a problem with this page.")));
			onProgress(results.length);
		}
		return results;
	};

	/** Shows the run's progress, unless the visitor already moved on to another run. */
	const progress = (current: Job, text: string, value?: number) => {
		if (job !== current || step === "site") return;
		if (email) setStatus(`Thanks! ${text}`, "running", value);
		else setStatus(text, "running", value);
	};

	const runAudit = async (current: Job, site: URL) => {
		progress(current, "Running a quick security check…");
		const turnstileToken = await getToken(() => {
			if (job === current && step !== "site") setStatus("Tick the “Verify you are human” box to start your audit.", "running");
		});

		progress(current, `Finding the sitemap for ${site.hostname}…`);
		const start = await postJson(`${endpoint}/start`, { url: site.href, token: turnstileToken });
		useUpToken();
		if (!start.ok) throw new AuditFailure(start.error);
		if (!("session" in start)) throw new AuditFailure("The audit service had a problem. Please try again.");

		const { session, site: auditSite, urls } = start;
		current.host = auditSite.host;
		current.pagesFound = auditSite.totalUrls;
		const total = urls.length;
		progress(current, `Checking ${total} pages on ${auditSite.host}…`, 0.04);

		let pages = await checkBatches(session, urls, BATCH_SIZE, (done) =>
			progress(current, `Checked ${done} of ${total} pages on ${auditSite.host}…`, 0.04 + (done / total) * 0.9),
		);

		// Pages the site refused for "too many requests": one gentler retry.
		const refused = pages.filter((page) => RETRY_STATUSES.has(page.status)).map((page) => page.url);
		if (refused.length) {
			progress(current, `The site asked me to slow down. Retrying ${refused.length} pages…`, 0.95);
			await sleep(RETRY_DELAY_MS);
			const retried = await checkBatches(session, refused, RETRY_BATCH_SIZE, () => undefined).catch(() => []);
			const byUrl = new Map(retried.filter((page) => page.status !== 0).map((page) => [page.url, page]));
			pages = pages.map((page) => byUrl.get(page.url) ?? page);
		}

		// Report code loads only now, so the homepage doesn't ship it up front.
		const { buildReportXlsx, createReport, reportFileName } = await import("../lib/seo-audit/report");
		const report = createReport(auditSite, pages);
		current.file = { bytes: buildReportXlsx(report, { ...CONTACT, email: contactEmail }), name: reportFileName(report) };
		current.report = report;
	};

	const startJob = (site: URL) => {
		const current: Job = { id: ++jobCounter, host: site.hostname, report: null, file: null, error: null, pagesFound: null, done: Promise.resolve() };
		job = current;
		leadSent = false;
		current.done = runAudit(current, site).catch((error: unknown) => {
			useUpToken();
			current.error = error instanceof AuditFailure ? error.message : "Something went wrong. Please try again.";
		});
		void current.done.then(() => settle(current));
	};

	/** Called when the run ends and again when the email comes in; acts once both are ready. */
	const settle = (current: Job) => {
		if (job !== current || step === "site") return;
		if (current.error) {
			// No lead email for runs that never passed the security check (bots, typos).
			if (email && !leadSent && current.pagesFound !== null) {
				leadSent = true;
				sendLead(leadFor(current, `Failed: ${current.error}`));
			}
			showStep("site");
			setStatus(current.error, "error");
			job = null;
			return;
		}
		if (!current.report) return; // still running; progress() keeps the status fresh
		if (!email) {
			setStatus(`Your report for ${current.host} is ready. Enter your email to download it.`, "ready");
			return;
		}
		deliver(current, current.report);
	};

	const deliver = (current: Job, report: AuditReport) => {
		if (!current.file) return;
		const blob = new Blob([current.file.bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
		if (downloadUrl) URL.revokeObjectURL(downloadUrl);
		downloadUrl = URL.createObjectURL(blob);
		download.href = downloadUrl;
		download.download = current.file.name;
		download.hidden = false;
		download.click();

		showStep("done");
		const { High, Medium, Low } = report.counts;
		setStatus(
			`Done. Checked ${report.pages.length} pages on ${report.site.host} and found ${report.issues.length} issues (${High} high, ${Medium} medium, ${Low} low). Your report is downloading.`,
			"done",
		);
		if (!leadSent) {
			leadSent = true;
			sendLead(leadFor(current, "Report downloaded"));
		}
		window.gtag?.("event", "seo_audit_complete", { pages_checked: report.pages.length, issues: report.issues.length });
	};

	// --- Events ---

	form.addEventListener("submit", (event) => {
		event.preventDefault();

		if (step === "site") {
			const site = normalizeSiteInput(websiteInput.value);
			websiteInput.toggleAttribute("aria-invalid", !site);
			if (!site) {
				setStatus("Enter your website address, like yourwebsite.com.", "error");
				websiteInput.focus();
				return;
			}
			email = null;
			emailInput.removeAttribute("aria-invalid");
			showStep("email");
			setStatus(`Starting your audit of ${site.hostname}…`, "running");
			startJob(site);
			return;
		}

		if (step === "email" && job) {
			const value = emailInput.value.trim();
			const valid = isValidEmail(value);
			emailInput.toggleAttribute("aria-invalid", !valid);
			if (!valid) {
				setStatus("Enter a valid email address to get your report.", "error", 0);
				emailInput.focus();
				return;
			}
			email = value;
			emailInput.disabled = true;
			submit.disabled = true;
			if (!job.report && !job.error) progress(job, "Finishing your audit…");
			settle(job);
		}
	});

	back.addEventListener("click", () => {
		job = null; // the running audit, if any, is ignored from now on
		email = null;
		status.hidden = true;
		showStep("site");
	});
}

for (const form of document.querySelectorAll<HTMLFormElement>("form[data-seo-audit]")) initSeoAudit(form);
