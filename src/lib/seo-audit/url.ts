// Address checks for the free SEO audit. The audit only ever fetches public
// websites by domain name: no IP addresses, no internal names, no odd ports.

const BLOCKED_SUFFIXES = [
	".localhost",
	".local",
	".internal",
	".lan",
	".home",
	".corp",
	".intranet",
	".arpa",
	".test",
	".example",
	".invalid",
	".onion",
];

/** True for a public domain name such as "example.com" (never an IP address). */
export function isPublicHostname(hostname: string): boolean {
	const host = hostname.toLowerCase().replace(/\.$/, "");
	if (!host || host.length > 253) return false;
	if (host.includes(":") || host.startsWith("[")) return false; // IPv6 literal
	if (/^[\d.]+$/.test(host)) return false; // IPv4 literal (any form)
	if (/^0x/i.test(host)) return false;
	if (!/^[a-z0-9.-]+$/.test(host)) return false;
	if (host === "localhost" || !host.includes(".")) return false;
	if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return false;
	const labels = host.split(".");
	if (labels.some((label) => !label || label.length > 63 || label.startsWith("-") || label.endsWith("-"))) {
		return false;
	}
	const tld = labels[labels.length - 1] ?? "";
	return /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(tld);
}

/** Same site, ignoring a leading "www.". */
export function isSameSite(hostA: string, hostB: string): boolean {
	const strip = (host: string) => host.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
	return strip(hostA) === strip(hostB);
}

/** True when a URL is safe to fetch: http(s), public domain, default port, no login part. */
export function isFetchableUrl(url: URL): boolean {
	if (url.protocol !== "https:" && url.protocol !== "http:") return false;
	if (url.username || url.password) return false;
	if (url.port && url.port !== "80" && url.port !== "443") return false;
	return isPublicHostname(url.hostname);
}

/**
 * Turns what a visitor typed ("example.com", "https://example.com/blog") into
 * the site's root URL, or null when it is not a public website address.
 */
export function normalizeSiteInput(raw: string): URL | null {
	let value = raw.trim();
	if (!value || value.length > 2048 || /\s/.test(value)) return null;
	if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		return null;
	}
	if (!isFetchableUrl(url)) return null;
	return new URL(`${url.protocol}//${url.host}/`);
}

/** Loose email check, enough to catch typos. */
export function isValidEmail(raw: string): boolean {
	const email = raw.trim();
	return email.length <= 254 && /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(email);
}

/** URL key for comparing pages: lowercase host, no hash, no trailing slash (except root). */
export function urlKey(raw: string): string {
	try {
		const url = new URL(raw);
		url.hash = "";
		const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
		return `${url.protocol}//${url.host.toLowerCase()}${path}${url.search}`;
	} catch {
		return raw;
	}
}
