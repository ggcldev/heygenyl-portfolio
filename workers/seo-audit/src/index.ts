// Free SEO audit API (Cloudflare Worker), served at heygenyl.com/api/seo-audit/*.
//
// POST /api/seo-audit/start  { url, token }         -> finds the sitemap, returns up to 50 pages + a session
// POST /api/seo-audit/pages  { session, urls[<=5] } -> checks those pages
//
// The browser calls /pages in small batches (Workers free plan: 50 fetches and
// little CPU per request), then builds the issue list and Excel file itself.

import { extractSignals } from "../../../src/lib/seo-audit/extract";
import { chooseUrls, DEFAULT_SITEMAP_PATHS, linksFromHtml, orderChildSitemaps, parseSitemap, sitemapsFromRobots } from "../../../src/lib/seo-audit/sitemap";
import type { AuditErrorResponse, AuditPagesResponse, AuditSite, AuditStartResponse, PageData } from "../../../src/lib/seo-audit/types";
import { isFetchableUrl, isSameSite, normalizeSiteInput } from "../../../src/lib/seo-audit/url";

interface RateLimiter {
	limit(options: { key: string }): Promise<{ success: boolean }>;
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
}

const MAX_PAGES = 50;
const BATCH_SIZE = 5;
const SESSION_TTL_MS = 20 * 60 * 1000;
const PAGE_BYTES = 1_500_000;
const SITEMAP_BYTES = 5_000_000;
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
}

async function signSession(env: Env, data: SessionData): Promise<string> {
	const payload = b64url(new TextEncoder().encode(JSON.stringify(data)));
	const signature = await crypto.subtle.sign("HMAC", await sessionKey(env), new TextEncoder().encode(payload));
	return `${payload}.${b64url(new Uint8Array(signature))}`;
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
	const data = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as SessionData;
	if (typeof data.host !== "string" || typeof data.exp !== "number" || data.exp < Date.now()) {
		throw new AuditError("expired", "This audit took too long. Please start it again.", 401);
	}
	return data;
}

// --- Turnstile ---

async function verifyTurnstile(env: Env, token: unknown, ip: string): Promise<void> {
	if (!env.TURNSTILE_SECRET) throw new AuditError("not_configured", "The audit tool is not set up yet.", 503);
	if (typeof token !== "string" || !token || token.length > 2048) throw new AuditError("captcha", "Please complete the security check.", 400);
	const form = new FormData();
	form.append("secret", env.TURNSTILE_SECRET);
	form.append("response", token);
	if (ip !== "unknown") form.append("remoteip", ip);
	const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
	const result = (await response.json().catch(() => ({}))) as { success?: boolean; hostname?: string };
	if (!result.success) throw new AuditError("captcha", "The security check failed. Please try again.", 400);
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
}

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
	const base: Fetched = { url, status: 0, location: null, contentType: "", ms: 0, bytes: 0, truncated: false, body: "", xRobotsTag: null, error: null };
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
	const parsed = fetched.status === 200 && fetched.body ? parseSitemap(fetched.body) : null;
	return parsed && parsed.kind !== "unknown" ? { url: fetched.url, ...parsed } : null;
}

/**
 * Reads the sitemaps listed in robots.txt (or the usual guesses), plus up to a
 * few child sitemaps of any sitemap index. Files are fetched in parallel.
 */
async function readSitemaps(listed: string[], origin: string, host: string): Promise<{ sitemapsRead: string[]; pageLocs: string[] }> {
	let top: Array<Awaited<ReturnType<typeof readSitemapFile>>>;
	if (listed.length) {
		top = await Promise.all(listed.slice(0, MAX_LISTED_SITEMAPS).map(readSitemapFile));
	} else {
		// Guesses: try them all at once, keep the first that works (in DEFAULT_SITEMAP_PATHS order).
		const guesses = await Promise.all(DEFAULT_SITEMAP_PATHS.map((path) => readSitemapFile(`${origin}${path}`)));
		top = [guesses.find(Boolean) ?? null];
	}
	const found = top.filter((file): file is NonNullable<typeof file> => file !== null);
	const sitemapsRead = found.map((file) => file.url);
	const pageLocs = found.filter((file) => file.kind === "urlset").flatMap((file) => file.locs);

	const children = found
		.filter((file) => file.kind === "index")
		.flatMap((file) => orderChildSitemaps(file.locs, host))
		.filter((url) => !sitemapsRead.includes(url))
		.slice(0, MAX_CHILD_SITEMAPS);
	const childFiles = await Promise.all(children.map(readSitemapFile));
	for (const file of childFiles) {
		if (!file || file.kind !== "urlset") continue;
		sitemapsRead.push(file.url);
		pageLocs.push(...file.locs);
	}
	return { sitemapsRead, pageLocs };
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

	// Homepage: find the final address (http → https, www or not).
	let homepage = await fetchFollow(site.href, PAGE_BYTES, "text/html,application/xhtml+xml");
	if (homepage.status === 0 && site.protocol === "https:") {
		homepage = await fetchFollow(site.href.replace(/^https:/, "http:"), PAGE_BYTES, "text/html,application/xhtml+xml");
	}
	if (homepage.status === 0) throw new AuditError("unreachable", `We couldn't reach ${site.hostname}. Check the address and try again.`, 422);
	if (homepage.status >= 300 && homepage.status < 400 && homepage.location) {
		const target = new URL(homepage.location);
		throw new AuditError("other_domain", `${site.hostname} redirects to ${target.hostname}. Enter that address instead.`, 422);
	}
	const origin = new URL(homepage.url).origin;
	const host = new URL(origin).hostname;

	// robots.txt, then sitemaps.
	const robots = await fetchFollow(`${origin}/robots.txt`, 500_000, "text/plain");
	const robotsTxtFound = robots.status === 200 && !isHtml(robots);
	const listed = robotsTxtFound ? sitemapsFromRobots(robots.body, origin).filter((url) => isSameSite(new URL(url).hostname, host)) : [];
	const { sitemapsRead, pageLocs } = await readSitemaps(listed, origin, host);

	let source: AuditSite["source"] = "sitemap";
	let chosen = chooseUrls(pageLocs, origin, MAX_PAGES);
	if (pageLocs.length === 0) {
		source = "homepage-links";
		chosen = chooseUrls(isHtml(homepage) ? linksFromHtml(homepage.body, homepage.url) : [], origin, MAX_PAGES);
	}

	const auditSite: AuditSite = {
		origin,
		host,
		homepageStatus: homepage.status,
		robotsTxtFound,
		sitemaps: sitemapsRead,
		sitemapMissingFromRobots: source === "sitemap" && listed.length === 0,
		source,
		totalUrls: chosen.total,
	};
	const session = await signSession(env, { host, exp: Date.now() + SESSION_TTL_MS });
	return { ok: true, session, site: auditSite, urls: chosen.urls };
}

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
	const urls = Array.isArray(body.urls) ? body.urls.filter((url): url is string => typeof url === "string").slice(0, BATCH_SIZE) : [];
	if (!urls.length) throw new AuditError("bad_request", "No pages to check.");
	// Two at a time: gentle on small hosts and on sites that rate-limit bots.
	const results: PageData[] = new Array<PageData>(urls.length);
	let next = 0;
	const worker = async () => {
		while (next < urls.length) {
			const index = next++;
			results[index] = await checkPage(urls[index] ?? "", session.host);
		}
	};
	await Promise.all([worker(), worker()]);
	return { ok: true, pages: results };
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
