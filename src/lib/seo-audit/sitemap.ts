// Reading robots.txt and XML sitemaps for the free SEO audit.

import { isFetchableUrl, isSameSite, urlKey } from "./url";

/** Common sitemap locations tried when robots.txt lists none. */
export const DEFAULT_SITEMAP_PATHS = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/wp-sitemap.xml"];

const NON_HTML_EXTENSIONS = /\.(?:pdf|jpe?g|png|gif|webp|avif|svg|ico|zip|rar|gz|mp4|mov|webm|mp3|wav|xml|txt|json|csv|docx?|xlsx?|pptx?)$/i;

/** "Sitemap:" lines from robots.txt, resolved against the site origin. */
export function sitemapsFromRobots(robotsTxt: string, origin: string): string[] {
	const found: string[] = [];
	for (const match of robotsTxt.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)) {
		const value = match[1];
		if (!value) continue;
		try {
			found.push(new URL(value, origin).href);
		} catch {
			// ignore malformed lines
		}
	}
	return [...new Set(found)];
}

export interface ParsedSitemap {
	kind: "index" | "urlset" | "unknown";
	locs: string[];
}

function decodeXmlText(text: string): string {
	return text
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
		.replace(/&amp;/g, "&");
}

/**
 * Page or child-sitemap URLs in a sitemap. Only plain <loc> tags count, so
 * <image:loc> and <video:loc> entries are ignored.
 */
export function parseSitemap(xml: string): ParsedSitemap {
	const kind = /<sitemapindex[\s>]/i.test(xml) ? "index" : /<urlset[\s>]/i.test(xml) ? "urlset" : "unknown";
	const locs: string[] = [];
	for (const match of xml.matchAll(/<loc>\s*(?:<!\[CDATA\[\s*)?([\s\S]*?)(?:\s*\]\]>)?\s*<\/loc>/gi)) {
		const value = decodeXmlText((match[1] ?? "").trim());
		if (value) locs.push(value);
	}
	return { kind, locs };
}

/**
 * Child sitemaps of an index in the order worth reading: pages and posts first,
 * archives and media last. Other-site children are dropped.
 */
export function orderChildSitemaps(locs: string[], siteHost: string): string[] {
	const rank = (url: string) => {
		const name = url.toLowerCase();
		if (/page/.test(name)) return 0;
		if (/post|article|blog|news/.test(name)) return 1;
		if (/product|service|location/.test(name)) return 2;
		if (/image|video|author|tag|category|attachment|archive/.test(name)) return 4;
		return 3;
	};
	const sameSite = locs.filter((loc) => {
		try {
			const url = new URL(loc);
			return isFetchableUrl(url) && isSameSite(url.hostname, siteHost);
		} catch {
			return false;
		}
	});
	return sameSite
		.map((url, index) => ({ url, index, rank: rank(url) }))
		.sort((a, b) => a.rank - b.rank || a.index - b.index)
		.map((entry) => entry.url);
}

export interface ChosenUrls {
	/** Pages to check (homepage first), at most `limit`. */
	urls: string[];
	/** Unique same-site page URLs found. */
	total: number;
}

/** Picks the pages to audit: same site only, no files, no duplicates, homepage first. */
export function chooseUrls(locs: string[], origin: string, limit: number): ChosenUrls {
	const site = new URL(origin);
	const seen = new Set<string>();
	const pages: string[] = [];
	for (const loc of locs) {
		let url: URL;
		try {
			url = new URL(loc, origin);
		} catch {
			continue;
		}
		if (!isFetchableUrl(url) || !isSameSite(url.hostname, site.hostname)) continue;
		if (NON_HTML_EXTENSIONS.test(url.pathname)) continue;
		url.hash = "";
		const key = urlKey(url.href);
		if (seen.has(key)) continue;
		seen.add(key);
		pages.push(url.href);
	}
	const homeKey = urlKey(site.href);
	const rest = pages.filter((page) => urlKey(page) !== homeKey);
	const homepage = pages.find((page) => urlKey(page) === homeKey) ?? site.href;
	const total = seen.has(homeKey) ? seen.size : seen.size + 1;
	return { urls: [homepage, ...rest].slice(0, limit), total };
}

/** Same-site links on a page, for sites without a sitemap. */
export function linksFromHtml(html: string, pageUrl: string): string[] {
	const links: string[] = [];
	const body = html.replace(/<!--[\s\S]*?-->/g, "");
	for (const match of body.matchAll(/<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
		const href = (match[1] ?? match[2] ?? match[3] ?? "").trim();
		if (!href || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
		try {
			links.push(new URL(decodeXmlText(href), pageUrl).href);
		} catch {
			// ignore malformed links
		}
	}
	return links;
}
