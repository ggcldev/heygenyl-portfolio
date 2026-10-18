// Free SEO audit API (Cloudflare Worker), served at heygenyl.com/api/seo-audit/*.
//
// POST /api/seo-audit/start  { url, token }                -> finds the sitemap, returns up to 50
//                                                              pages, a key per page and a session
// POST /api/seo-audit/pages  { session, urls[<=3], keys }  -> checks those pages
//
// The browser calls /pages in small batches (Workers free plan: 50 fetches and about
// 10 ms of CPU per request), then builds the issue list and Excel file itself. Each page
// key is an HMAC of the session + URL, so /pages only fetches pages /start handed out.

import { extractSignals } from "../../../src/lib/seo-audit/extract";
import { chooseUrls, crawlDelayMs, DEFAULT_SITEMAP_PATHS, linksFromHtml, orderChildSitemaps, parseSitemap, sitemapsFromRobots } from "../../../src/lib/seo-audit/sitemap";
import type { AuditErrorResponse, AuditPagesResponse, AuditSite, AuditStartResponse, PageData } from "../../../src/lib/seo-audit/types";
import { isFetchableUrl, isSameSite, normalizeSiteInput, visitorKey } from "../../../src/lib/seo-audit/url";

interface RateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** The slice of Workers KV used for daily allowances. */
interface KvStore {
	get(key: string, type: "json"): Promise<unknown>;
	put(key: string, value: string, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
}

export interface Env {
	/** Cloudflare Turnstile secret key (wrangler secret). Also signs audit sessions. */
	TURNSTILE_SECRET: string;
	/** Comma-separated origins allowed to call the API from another origin (local dev). */
	ALLOWED_ORIGINS?: string;
	/** Hostnames a Turnstile token may come from, comma-separated. Empty = any. */
	TURNSTILE_HOSTNAMES?: string;
	START_LIMITER?: RateLimiter;
	PAGES_LIMITER?: RateLimiter;
	/** Audits started per visitor in the last 24 hours. */
	AUDIT_LIMITS?: KvStore;
}

const MAX_PAGES = 50;
// Free audits per visitor (IPv4 address or IPv6 /64) per 24 hours, counted when an audit starts.
const DAILY_AUDITS = 3;
const DAY_S = 24 * 60 * 60;
// 3 pages per request keeps HTML parsing (about 1-4 ms per page) inside the CPU budget.
const BATCH_SIZE = 3;
const SESSION_TTL_MS = 20 * 60 * 1000;
const PAGE_BYTES = 1_500_000;
const SITEMAP_BYTES = 5_000_000;
// Sitemap entries parsed per file (the rest are only counted): parsing 50,000 URLs costs
// about 140 ms of CPU, far over the free-plan budget; a few hundred is plenty to pick 50.
const MAX_LOCS_PER_FILE = 400;
// Wait between page requests for hosts that block bursts (see isStrictHost), and the most a
// visitor's browser may ask for (it only ever slows the audit down).
const STRICT_HOST_PACE_MS = 1500;
const MAX_PACE_MS = 5000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Runs `fn` over `items`: all at once when `pace` is 0, else one by one `pace` ms apart. */
async function mapPaced<T, R>(items: T[], fn: (item: T) => Promise<R>, pace: number): Promise<R[]> {
	if (pace <= 0) return Promise.all(items.map(fn));
	const out: R[] = [];
	for (const [index, item] of items.entries()) {
		if (index > 0) await sleep(pace);
		out.push(await fn(item));
	}
	return out;
}

const FETCH_TIMEOUT_MS = 12_000;
// Fetch budget for /start (free plan allows 50 per request; each file may take up to
// 4 fetches with redirects): Turnstile 1 + homepage 8 + robots 4 + sitemaps 16 + children 16 = 45.
const MAX_LISTED_SITEMAPS = 4;
const MAX_CHILD_SITEMAPS = 4;
const USER_AGENT = "Mozilla/5.0 (compatible; HeyGenylSEOAudit/1.0; +https://heygenyl.com/)";

class AuditError extends Error {
	constructor(
		readonly code: string,
		message: string,
		readonly status = 400,
	) {
		super(message);
	}
}

// --- HTTP helpers ---

function corsHeaders(request: Request, env: Env): Record<string, string> {
	const origin = request.headers.get("Origin");
	const allowed = (env.ALLOWED_ORIGINS ?? "").split(",").map((value) => value.trim()).filter(Boolean);
	if (!origin || !allowed.includes(origin)) return {};
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Max-Age": "600",
		Vary: "Origin",
	};
}

function json(body: AuditStartResponse | AuditPagesResponse | AuditErrorResponse, status: number, cors: Record<string, string>): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors },
	});
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
	const text = await request.text();
	if (text.length > 8_000) throw new AuditError("too_large", "Request is too large.", 413);
	try {
		const data: unknown = JSON.parse(text);
		if (data && typeof data === "object" && !Array.isArray(data)) return data as Record<string, unknown>;
	} catch {
		// fall through
	}
	throw new AuditError("bad_request", "Request was not valid JSON.");
}

const clientIp = (request: Request) => request.headers.get("CF-Connecting-IP") ?? "unknown";

// --- Signed sessions (stateless) ---

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64url = (text: string) => Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));

async function sessionKey(env: Env): Promise<CryptoKey> {
	const material = new TextEncoder().encode(`seo-audit-session:${env.TURNSTILE_SECRET}`);
	return crypto.subtle.importKey("raw", material, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

interface SessionData {
	host: string;
	exp: number;
	/** Random id, so page keys from one audit don't work in another. */
	nonce: string;
	/** Minimum wait between page requests to this site, in ms (0 = none). */
	pace: number;
}

const hmac = async (env: Env, text: string) =>
	new Uint8Array(await crypto.subtle.sign("HMAC", await sessionKey(env), new TextEncoder().encode(text)));

async function signSession(env: Env, data: SessionData): Promise<string> {
	const payload = b64url(new TextEncoder().encode(JSON.stringify(data)));
	return `${payload}.${b64url(await hmac(env, payload))}`;
}

async function readSession(env: Env, token: unknown): Promise<SessionData> {
	if (typeof token !== "string" || token.length > 600 || !token.includes(".")) throw new AuditError("bad_session", "Audit session is missing.", 401);
	const [payload = "", signature = ""] = token.split(".");
	let valid = false;
	try {
		valid = await crypto.subtle.verify("HMAC", await sessionKey(env), fromB64url(signature), new TextEncoder().encode(payload));
	} catch {
		valid = false;
	}
	if (!valid) throw new AuditError("bad_session", "Audit session is not valid.", 401);
	const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as Partial<SessionData>;
	if (typeof data.host !== "string" || typeof data.nonce !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) {
		throw new AuditError("expired", "This audit took too long. Please start it again.", 401);
	}
	return data as SessionData;
}

/** Short key that lets /pages fetch this one URL for this one audit. */
async function pageKey(env: Env, session: SessionData, url: string): Promise<string> {
	return b64url((await hmac(env, `page|${session.nonce}|${url}`)).subarray(0, 16));
}

// --- Daily allowance ---

interface Allowance {
	count: number;
	/** When the 24-hour window ends (Unix seconds). */
	resetAt: number;
}

/** Throws when this visitor has used today's free audits; otherwise returns their record. */
async function checkAllowance(env: Env, visitor: string): Promise<Allowance | null> {
	if (!env.AUDIT_LIMITS) return null;
	const stored = (await env.AUDIT_LIMITS.get(`audits:${visitor}`, "json")) as Allowance | null;
	const now = Math.floor(Date.now() / 1000);
	const current = stored && stored.resetAt > now ? stored : null;
	if (current && current.count >= DAILY_AUDITS) {
		const hours = Math.max(1, Math.ceil((current.resetAt - now) / 3600));
		throw new AuditError(
			"daily_limit",
			`You've used your ${DAILY_AUDITS} free audits for today. You can run more in about ${hours} hour${hours > 1 ? "s" : ""}, or get in touch for a full audit.`,
			429,
		);
	}
	return current;
}

/** Counts one started audit against the visitor's 24-hour window. */
async function useAllowance(env: Env, visitor: string, current: Allowance | null): Promise<void> {
	if (!env.AUDIT_LIMITS) return;
	const now = Math.floor(Date.now() / 1000);
	const next: Allowance = current ? { count: current.count + 1, resetAt: current.resetAt } : { count: 1, resetAt: now + DAY_S };
	// KV needs the expiry at least 60 s ahead.
	await env.AUDIT_LIMITS.put(`audits:${visitor}`, JSON.stringify(next), { expiration: Math.max(next.resetAt, now + 60) });
}

// --- Turnstile ---

const TURNSTILE_ACTION = "seo-audit";

async function verifyTurnstile(env: Env, token: unknown, ip: string): Promise<void> {
	if (!env.TURNSTILE_SECRET) throw new AuditError("not_configured", "The audit tool is not set up yet.", 503);
	if (typeof token !== "string" || !token || token.length > 2048) throw new AuditError("captcha", "Please complete the security check.", 400);
	const form = new FormData();
	form.append("secret", env.TURNSTILE_SECRET);
	form.append("response", token);
	if (ip !== "unknown") form.append("remoteip", ip);
	const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
	const result = (await response.json().catch(() => ({}))) as { success?: boolean; hostname?: string; action?: string };
	if (!result.success) throw new AuditError("captcha", "The security check failed. Please try again.", 400);
	// Tokens from other forms on the site don't count (Cloudflare's test keys report no action).
	if (result.action && result.action !== TURNSTILE_ACTION) {
		throw new AuditError("captcha", "The security check failed. Please try again.", 400);
	}
	const hostnames = (env.TURNSTILE_HOSTNAMES ?? "").split(",").map((value) => value.trim()).filter(Boolean);
	if (hostnames.length && result.hostname && !hostnames.includes(result.hostname)) {
		throw new AuditError("captcha", "The security check failed. Please try again.", 400);
	}
}

// --- Fetching other sites ---

interface Fetched {
	url: string;
	status: number;
	location: string | null;
	contentType: string;
	ms: number;
	bytes: number;
	truncated: boolean;
	body: string;
	xRobotsTag: string | null;
	error: string | null;
	/** Served through a CDN known to block quick bursts of requests (Hostinger's hCDN). */
	strictHost: boolean;
}

/** Hostinger's CDN blocks an IP for minutes after a few quick requests; all Worker
 * requests share Cloudflare's addresses, so sites behind it must be checked slowly. */
const isStrictHost = (headers: Headers) => headers.has("x-hcdn-request-id") || headers.get("platform") === "hostinger";

function charsetOf(contentType: string): string {
	const match = contentType.match(/charset=["']?([\w-]+)/i);
	return match?.[1]?.toLowerCase() ?? "utf-8";
}

async function readLimited(response: Response, maxBytes: number): Promise<{ bytes: Uint8Array; truncated: boolean }> {
	const reader = response.body?.getReader();
	if (!reader) return { bytes: new Uint8Array(0), truncated: false };
	const chunks: Uint8Array[] = [];
	let total = 0;
	let truncated = false;
	for (;;) {
		const { done, value } = await reader.read();
		if (done || !value) break;
		const room = maxBytes - total;
		if (value.byteLength > room) {
			chunks.push(value.subarray(0, Math.max(room, 0)));
			total += Math.max(room, 0);
			truncated = true;
			await reader.cancel().catch(() => undefined);
			break;
		}
		chunks.push(value);
		total += value.byteLength;
	}
	const bytes = new Uint8Array(total);
	let at = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, at);
		at += chunk.byteLength;
	}
	return { bytes, truncated };
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
	const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream("gzip"));
	const { bytes: out } = await readLimited(new Response(stream), SITEMAP_BYTES);
	return out;
}

/** Absolute redirect target, or null when there is none or it is not a valid URL. */
function resolveLocation(raw: string | null, base: URL): string | null {
	if (!raw) return null;
	try {
		return new URL(raw, base).href;
	} catch {
		return null;
	}
}

/** One request, no redirect following, size and time limited. Never throws. */
async function fetchOnce(url: string, maxBytes: number, accept: string): Promise<Fetched> {
	const base: Fetched = { url, status: 0, location: null, contentType: "", ms: 0, bytes: 0, truncated: false, body: "", xRobotsTag: null, error: null, strictHost: false };
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return { ...base, error: "Not a valid address." };
	}
	if (!isFetchableUrl(parsed)) return { ...base, error: "Address is not a public website." };
	const started = Date.now();
	try {
		const response = await fetch(parsed.href, {
			redirect: "manual",
			headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Language": "en" },
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});
		const ms = Date.now() - started;
		const contentType = response.headers.get("Content-Type") ?? "";
		const result: Fetched = {
			...base,
			status: response.status,
			location: resolveLocation(response.headers.get("Location"), parsed),
			contentType,
			ms,
			xRobotsTag: response.headers.get("X-Robots-Tag"),
			strictHost: isStrictHost(response.headers),
		};
		const wantsBody = response.status >= 200 && response.status < 300;
		if (!wantsBody) {
			await response.body?.cancel().catch(() => undefined);
			return result;
		}
		let { bytes, truncated } = await readLimited(response, maxBytes);
		if (bytes[0] === 0x1f && bytes[1] === 0x8b) bytes = await gunzip(bytes);
		let body: string;
		try {
			body = new TextDecoder(charsetOf(contentType)).decode(bytes);
		} catch {
			body = new TextDecoder().decode(bytes);
		}
		return { ...result, bytes: bytes.byteLength, truncated, body };
	} catch (error) {
		const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
		return { ...base, ms: Date.now() - started, error: timedOut ? `No response after ${FETCH_TIMEOUT_MS / 1000} seconds.` : "Could not connect." };
	}
}

/**
 * Follows up to 3 redirects, only within the same site (www / https changes are fine).
 * At most 4 fetches, so a whole /start request stays well under the 50-fetch limit.
 */
async function fetchFollow(url: string, maxBytes: number, accept: string): Promise<Fetched> {
	let current = url;
	let result = await fetchOnce(current, maxBytes, accept);
	for (let hop = 0; hop < 3; hop++) {
		if (result.status < 300 || result.status >= 400 || !result.location) return result;
		const next = new URL(result.location); // resolveLocation only returns valid URLs
		if (!isSameSite(next.hostname, new URL(url).hostname)) return result;
		current = next.href;
		result = await fetchOnce(current, maxBytes, accept);
	}
	return result.status >= 300 && result.status < 400 ? { ...result, error: "Too many redirects." } : result;
}

const isHtml = (fetched: Fetched) => /html/i.test(fetched.contentType) || (!fetched.contentType && /<html[\s>]/i.test(fetched.body.slice(0, 2000)));

// --- Sitemaps ---

const SITEMAP_ACCEPT = "application/xml,text/xml,*/*";

async function readSitemapFile(url: string) {
	const fetched = await fetchFollow(url, SITEMAP_BYTES, SITEMAP_ACCEPT);
	const parsed = fetched.status === 200 && fetched.body ? parseSitemap(fetched.body, MAX_LOCS_PER_FILE) : null;
	return parsed && parsed.kind !== "unknown" ? { url: fetched.url, ...parsed } : null;
}

/**
 * Reads the sitemaps listed in robots.txt (or the usual guesses), plus up to a
 * few child sitemaps of any sitemap index. Files are fetched in parallel.
 * `listedTotal` counts every page entry in the page sitemaps read (parsed or not).
 */
async function readSitemaps(
	listed: string[],
	origin: string,
	host: string,
	pace: number,
): Promise<{ sitemapsRead: string[]; pageLocs: string[]; listedTotal: number }> {
	let top: Array<Awaited<ReturnType<typeof readSitemapFile>>>;
	if (listed.length) {
		top = await mapPaced(listed.slice(0, MAX_LISTED_SITEMAPS), readSitemapFile, pace);
	} else if (pace > 0) {
		// Polite: try the usual paths one by one, stop at the first that works.
		let found: Awaited<ReturnType<typeof readSitemapFile>> = null;
		for (const [index, path] of DEFAULT_SITEMAP_PATHS.entries()) {
			if (index > 0) await sleep(pace);
			found = await readSitemapFile(`${origin}${path}`);
			if (found) break;
		}
		top = [found];
	} else {
		// Guesses: try them all at once, keep the first that works (in DEFAULT_SITEMAP_PATHS order).
		const guesses = await Promise.all(DEFAULT_SITEMAP_PATHS.map((path) => readSitemapFile(`${origin}${path}`)));
		top = [guesses.find(Boolean) ?? null];
	}
	const found = top.filter((file): file is NonNullable<typeof file> => file !== null);
	const sitemapsRead = found.map((file) => file.url);
	const pageFiles = found.filter((file) => file.kind === "urlset");
	const pageLocs = pageFiles.flatMap((file) => file.locs);
	let listedTotal = pageFiles.reduce((sum, file) => sum + file.total, 0);

	const children = found
		.filter((file) => file.kind === "index")
		.flatMap((file) => orderChildSitemaps(file.locs, host))
		.filter((url) => !sitemapsRead.includes(url))
		.slice(0, MAX_CHILD_SITEMAPS);
	if (pace > 0 && children.length) await sleep(pace);
	const childFiles = await mapPaced(children, readSitemapFile, pace);
	for (const file of childFiles) {
		if (!file || file.kind !== "urlset") continue;
		sitemapsRead.push(file.url);
		pageLocs.push(...file.locs);
		listedTotal += file.total;
	}
	return { sitemapsRead, pageLocs, listedTotal };
}

/** The homepage at its final address (http → https, www or not), or a clear error. */
async function fetchHomepage(site: URL): Promise<Fetched> {
	let homepage = await fetchFollow(site.href, PAGE_BYTES, "text/html,application/xhtml+xml");
	if (homepage.status === 0 && site.protocol === "https:") {
		homepage = await fetchFollow(site.href.replace(/^https:/, "http:"), PAGE_BYTES, "text/html,application/xhtml+xml");
	}
	if (homepage.status === 0) throw new AuditError("unreachable", `We couldn't reach ${site.hostname}. Check the address and try again.`, 422);
	if (homepage.status >= 300 && homepage.status < 400 && homepage.location) {
		const target = new URL(homepage.location);
		throw new AuditError("other_domain", `${site.hostname} redirects to ${target.hostname}. Enter that address instead.`, 422);
	}
	if (homepage.status === 429) throw siteBusy(new URL(homepage.url).hostname);
	return homepage;
}

/**
 * robots.txt: whether it exists, the sitemaps it lists, and the pace for the rest of the
 * audit (its Crawl-delay, or STRICT_HOST_PACE_MS for hosts that block bursts).
 */
async function readRobots(homepage: Fetched, origin: string, host: string): Promise<{ robotsTxtFound: boolean; listed: string[]; pace: number }> {
	if (homepage.strictHost) await sleep(STRICT_HOST_PACE_MS);
	const robots = await fetchFollow(`${origin}/robots.txt`, 500_000, "text/plain");
	if (robots.status === 429) throw siteBusy(host);
	const robotsTxtFound = robots.status === 200 && !isHtml(robots);
	const strict = homepage.strictHost || robots.strictHost;
	return {
		robotsTxtFound,
		listed: robotsTxtFound ? sitemapsFromRobots(robots.body, origin).filter((url) => isSameSite(new URL(url).hostname, host)) : [],
		pace: Math.max(robotsTxtFound ? crawlDelayMs(robots.body, MAX_PACE_MS) : 0, strict ? STRICT_HOST_PACE_MS : 0),
	};
}

// --- Routes ---

async function start(request: Request, env: Env): Promise<AuditStartResponse> {
	const body = await readJson(request);
	const ip = clientIp(request);
	const site = normalizeSiteInput(typeof body.url === "string" ? body.url : "");
	if (!site) throw new AuditError("bad_url", "Enter a website address like yourwebsite.com.");

	if (env.START_LIMITER) {
		const { success } = await env.START_LIMITER.limit({ key: ip });
		if (!success) throw new AuditError("rate_limited", "Too many audits from your connection. Please wait a minute.", 429);
	}
	await verifyTurnstile(env, body.token, ip);
	const visitor = visitorKey(ip);
	const allowance = await checkAllowance(env, visitor);

	const homepage = await fetchHomepage(site);
	const origin = new URL(homepage.url).origin;
	const host = new URL(origin).hostname;
	const { robotsTxtFound, listed, pace } = await readRobots(homepage, origin, host);
	if (pace > 0) await sleep(pace);
	const { sitemapsRead, pageLocs, listedTotal } = await readSitemaps(listed, origin, host, pace);

	let source: AuditSite["source"] = "sitemap";
	let chosen = chooseUrls(pageLocs, origin, MAX_PAGES);
	if (pageLocs.length === 0) {
		source = "homepage-links";
		chosen = chooseUrls(isHtml(homepage) ? linksFromHtml(homepage.body, homepage.url).slice(0, 2000) : [], origin, MAX_PAGES);
	}

	const auditSite: AuditSite = {
		origin,
		host,
		homepageStatus: homepage.status,
		robotsTxtFound,
		sitemaps: sitemapsRead,
		sitemapMissingFromRobots: source === "sitemap" && listed.length === 0,
		source,
		// Sitemap entries counted (big sitemaps are only partly parsed), else unique links.
		totalUrls: source === "sitemap" ? Math.max(listedTotal, chosen.urls.length) : chosen.total,
	};
	const sessionData: SessionData = { host, exp: Date.now() + SESSION_TTL_MS, nonce: b64url(crypto.getRandomValues(new Uint8Array(9))), pace };
	const session = await signSession(env, sessionData);
	const keys = await Promise.all(chosen.urls.map((url) => pageKey(env, sessionData, url)));
	// Counted only now: a site that couldn't be reached doesn't use up a free audit.
	await useAllowance(env, visitor, allowance);
	return { ok: true, session, site: auditSite, urls: chosen.urls, keys, paceMs: pace };
}

const isRefused = (status: number) => status === 429 || status === 503;

/** The site is refusing our checker right now (its block usually lifts within minutes). */
const siteBusy = (host: string) =>
	new AuditError("site_busy", `${host} is limiting automated checks right now. Please try again in about 5 minutes.`, 503);

const notChecked = (url: string): PageData => ({
	url,
	status: 429,
	error: "Not checked: the site asked us to slow down.",
	redirectTo: null,
	contentType: "",
	ms: 0,
	bytes: 0,
	truncated: false,
	xRobotsTag: null,
	html: null,
});

async function checkPage(url: string, host: string): Promise<PageData> {
	let parsed: URL | null = null;
	try {
		parsed = new URL(url);
	} catch {
		parsed = null;
	}
	if (!parsed || !isFetchableUrl(parsed) || !isSameSite(parsed.hostname, host)) {
		return { url, status: 0, error: "Not on the audited site.", redirectTo: null, contentType: "", ms: 0, bytes: 0, truncated: false, xRobotsTag: null, html: null };
	}
	const fetched = await fetchOnce(parsed.href, PAGE_BYTES, "text/html,application/xhtml+xml");
	const page: PageData = {
		url: parsed.href,
		status: fetched.status,
		error: fetched.error,
		redirectTo: fetched.location,
		contentType: fetched.contentType,
		ms: fetched.ms,
		bytes: fetched.bytes,
		truncated: fetched.truncated,
		xRobotsTag: fetched.xRobotsTag,
		html: null,
	};
	if (fetched.status >= 200 && fetched.status < 300 && isHtml(fetched)) page.html = extractSignals(fetched.body, parsed.href);
	return page;
}

async function pages(request: Request, env: Env): Promise<AuditPagesResponse> {
	const body = await readJson(request);
	const session = await readSession(env, body.session);
	if (env.PAGES_LIMITER) {
		const { success } = await env.PAGES_LIMITER.limit({ key: `${clientIp(request)}:${session.host}` });
		if (!success) throw new AuditError("rate_limited", "Too many requests. Please wait a moment.", 429);
	}
	const urls = Array.isArray(body.urls) ? body.urls.slice(0, BATCH_SIZE) : [];
	const keys = Array.isArray(body.keys) ? body.keys : [];
	if (!urls.length) throw new AuditError("bad_request", "No pages to check.");
	// Only pages this audit's /start handed out (each carries its own key).
	for (const [index, url] of urls.entries()) {
		const key = keys[index];
		if (typeof url !== "string" || typeof key !== "string" || key !== (await pageKey(env, session, url))) {
			throw new AuditError("bad_page", "That page isn't part of this audit.", 403);
		}
	}
	const checked = urls as string[];
	// The browser may ask for a longer gap (after the site pushed back), never a shorter one.
	const requested = typeof body.gapMs === "number" && Number.isFinite(body.gapMs) ? Math.min(Math.max(body.gapMs, 0), MAX_PACE_MS) : 0;
	const pace = Math.max(session.pace ?? 0, requested);
	return { ok: true, pages: await checkBatch(checked, session.host, pace) };
}

/**
 * Checks a batch: one at a time with `pace` ms between pages, or two at a time when 0.
 * Once the site refuses a page, the rest of the batch isn't fetched (it would only extend
 * the block); those come back as "not checked".
 */
async function checkBatch(urls: string[], host: string, pace: number): Promise<PageData[]> {
	const results: PageData[] = new Array<PageData>(urls.length);
	let refused = false;
	let next = 0;
	const lane = async () => {
		while (next < urls.length) {
			const index = next++;
			const url = urls[index] ?? "";
			if (refused) {
				results[index] = notChecked(url);
				continue;
			}
			if (pace > 0 && index > 0) await sleep(pace);
			const page = await checkPage(url, host);
			results[index] = page;
			if (isRefused(page.status)) refused = true;
		}
	};
	await Promise.all(pace > 0 ? [lane()] : [lane(), lane()]);
	return results;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const cors = corsHeaders(request, env);
		if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
		const { pathname } = new URL(request.url);
		try {
			if (request.method !== "POST") throw new AuditError("method", "Use POST.", 405);
			if (pathname.endsWith("/start")) return json(await start(request, env), 200, cors);
			if (pathname.endsWith("/pages")) return json(await pages(request, env), 200, cors);
			throw new AuditError("not_found", "Not found.", 404);
		} catch (error) {
			if (error instanceof AuditError) return json({ ok: false, code: error.code, error: error.message }, error.status, cors);
			console.error("seo-audit error", error);
			return json({ ok: false, code: "server", error: "Something went wrong. Please try again." }, 500, cors);
		}
	},
};
