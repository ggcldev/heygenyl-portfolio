// Shared shapes for the free SEO audit (hero form, Cloudflare Worker, Excel report).

/** What the Worker learned about the site before any page is checked. */
export interface AuditSite {
	/** Final origin after redirects, e.g. "https://www.example.com". */
	origin: string;
	host: string;
	/** Status of the homepage request (after following redirects). */
	homepageStatus: number;
	robotsTxtFound: boolean;
	/** Sitemap files that were read successfully. */
	sitemaps: string[];
	/** True when a sitemap was found only by guessing, not listed in robots.txt. */
	sitemapMissingFromRobots: boolean;
	/** Where the page list came from. */
	source: "sitemap" | "homepage-links";
	/** Unique same-site page URLs found (before the 50-page cap). */
	totalUrls: number;
}

export interface AuditStartResponse {
	ok: true;
	session: string;
	site: AuditSite;
	/** Pages to check, at most 50, homepage first. */
	urls: string[];
	/** One key per URL (same order); /pages only checks a URL sent with its key. */
	keys: string[];
}

export interface AuditPagesResponse {
	ok: true;
	pages: PageData[];
}

export interface AuditErrorResponse {
	ok: false;
	code: string;
	error: string;
}

/** Everything checked on one page. Network fields are always set; HTML fields are null/0 when the page was not HTML. */
export interface PageData {
	url: string;
	/** HTTP status, 0 when the request failed. */
	status: number;
	/** Why the request failed (timeout, blocked, not on the site). */
	error: string | null;
	redirectTo: string | null;
	contentType: string;
	/** Time to response headers, in milliseconds. */
	ms: number;
	bytes: number;
	/** True when the page was larger than the read limit and cut off. */
	truncated: boolean;
	/** X-Robots-Tag response header. */
	xRobotsTag: string | null;
	html: PageSignals | null;
}

/** On-page SEO signals read from the HTML. */
export interface PageSignals {
	title: string | null;
	metaDescription: string | null;
	h1: string[];
	h2Count: number;
	canonical: string | null;
	metaRobots: string | null;
	lang: string | null;
	viewport: boolean;
	ogTitle: boolean;
	ogDescription: boolean;
	ogImage: boolean;
	/** JSON-LD @type values (top level and @graph). */
	schemaTypes: string[];
	/** JSON-LD blocks that failed to parse. */
	schemaErrors: number;
	microdata: boolean;
	images: number;
	imagesMissingAlt: number;
	words: number;
}

export type Severity = "High" | "Medium" | "Low";

export interface AuditIssue {
	severity: Severity;
	issue: string;
	/** Page URL, or the site origin for site-wide issues. */
	url: string;
	detail: string;
	fix: string;
}
