// Turns checked pages into a plain-English issue list for the audit report.

import type { AuditIssue, AuditSite, PageData, Severity } from "./types";
import { urlKey } from "./url";

export const TITLE_MIN = 30;
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;
export const THIN_CONTENT_WORDS = 300;
export const SLOW_RESPONSE_MS = 2000;

export const SEVERITY_ORDER: Record<Severity, number> = { High: 0, Medium: 1, Low: 2 };

const isBlockedStatus = (status: number) => status === 401 || status === 403 || status === 429 || status === 503;

/** True when the page returned readable HTML. */
export function isAuditable(page: PageData): boolean {
	return page.status >= 200 && page.status < 300 && page.html !== null;
}

/** noindex from the robots meta tag or the X-Robots-Tag header. */
export function isNoindex(page: PageData): boolean {
	const values = `${page.html?.metaRobots ?? ""} ${page.xRobotsTag ?? ""}`.toLowerCase();
	return /\bnoindex\b|\bnone\b/.test(values);
}

export function auditIssues(site: AuditSite, pages: PageData[]): AuditIssue[] {
	const issues: AuditIssue[] = [];
	const add = (severity: Severity, issue: string, url: string, detail: string, fix: string) =>
		issues.push({ severity, issue, url, detail, fix });

	// Site-wide checks.
	if (site.source === "homepage-links") {
		add(
			"High",
			"No XML sitemap found",
			site.origin,
			"No sitemap was listed in robots.txt or found at /sitemap.xml, /sitemap_index.xml or /wp-sitemap.xml. This audit used links from your homepage instead.",
			"Create an XML sitemap (most SEO plugins do this), list it in robots.txt and submit it in Google Search Console.",
		);
	} else if (site.sitemapMissingFromRobots) {
		add(
			"Low",
			"Sitemap not listed in robots.txt",
			site.origin,
			`Found ${site.sitemaps[0] ?? "a sitemap"}, but robots.txt does not point to it.`,
			"Add a line like \"Sitemap: https://yoursite.com/sitemap.xml\" to robots.txt.",
		);
	}
	if (!site.robotsTxtFound) {
		add("Low", "No robots.txt file", site.origin, "/robots.txt did not return a file.", "Add a robots.txt that allows crawling and lists your sitemap.");
	}
	if (site.origin.startsWith("http://")) {
		add(
			"High",
			"Site does not use HTTPS",
			site.origin,
			"The homepage loads over plain http://.",
			"Install an SSL certificate and redirect every http:// address to https://.",
		);
	}

	// Duplicate titles and descriptions across pages.
	const auditable = pages.filter(isAuditable);
	const countBy = (pick: (page: PageData) => string | null | undefined) => {
		const counts = new Map<string, number>();
		for (const page of auditable) {
			const value = pick(page)?.trim().toLowerCase();
			if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
		}
		return counts;
	};
	const titleCounts = countBy((page) => page.html?.title);
	const descriptionCounts = countBy((page) => page.html?.metaDescription);

	for (const page of pages) {
		const url = page.url;

		if (page.status === 0) {
			add("High", "Page could not be loaded", url, page.error ?? "The request failed.", "Check the page loads in a browser and the server is not timing out.");
			continue;
		}
		if (page.status >= 300 && page.status < 400) {
			add(
				"Medium",
				site.source === "sitemap" ? "Redirect listed in sitemap" : "Link points to a redirect",
				url,
				`Returns ${page.status}${page.redirectTo ? ` and redirects to ${page.redirectTo}` : ""}.`,
				"List or link the final address directly so Google does not have to follow the redirect.",
			);
			continue;
		}
		if (isBlockedStatus(page.status)) {
			add(
				"Medium",
				`Page blocked our checker (${page.status})`,
				url,
				"The server refused an automated request. Google may be blocked the same way.",
				"If the page works in a browser, check your firewall or security plugin is not blocking crawlers like Googlebot.",
			);
			continue;
		}
		if (page.status >= 400) {
			add(
				"High",
				`Broken page (${page.status})`,
				url,
				site.source === "sitemap" ? "This address is in your sitemap but returns an error." : "This page returns an error.",
				"Fix the page, or remove it from the sitemap and 301-redirect it to the closest working page.",
			);
			continue;
		}
		if (!page.html) {
			add("Low", "Not an HTML page", url, `Content type: ${page.contentType || "unknown"}.`, "Sitemaps should list web pages, not files.");
			continue;
		}

		const html = page.html;

		if (isNoindex(page)) {
			add(
				"High",
				"Page is set to noindex",
				url,
				`Robots setting: ${[html.metaRobots, page.xRobotsTag].filter(Boolean).join(", ")}. Google will not show this page.`,
				site.source === "sitemap"
					? "If the page should rank, remove noindex. If not, take it out of the sitemap."
					: "If the page should rank, remove noindex.",
			);
		}

		if (!html.title) {
			add("High", "Missing meta title", url, "The page has no <title> tag.", `Add a unique title of ${TITLE_MIN}-${TITLE_MAX} characters with the page's main keyword.`);
		} else {
			const length = html.title.length;
			if (length > TITLE_MAX) {
				add("Medium", "Meta title too long", url, `${length} characters: "${html.title}"`, `Keep titles under about ${TITLE_MAX} characters so Google does not cut them off.`);
			} else if (length < TITLE_MIN) {
				add("Low", "Meta title too short", url, `${length} characters: "${html.title}"`, `Use ${TITLE_MIN}-${TITLE_MAX} characters to describe the page and include its main keyword.`);
			}
			const shared = titleCounts.get(html.title.trim().toLowerCase()) ?? 0;
			if (shared > 1) {
				add("Medium", "Duplicate meta title", url, `Same title as ${shared - 1} other checked page${shared > 2 ? "s" : ""}: "${html.title}"`, "Give every page its own title.");
			}
		}

		if (!html.metaDescription) {
			add("Medium", "Missing meta description", url, "No meta description tag.", `Add a ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} character summary that makes people want to click.`);
		} else {
			const length = html.metaDescription.length;
			if (length > DESCRIPTION_MAX) {
				add("Low", "Meta description too long", url, `${length} characters.`, `Keep it under about ${DESCRIPTION_MAX} characters so it is not cut off.`);
			} else if (length < DESCRIPTION_MIN) {
				add("Low", "Meta description too short", url, `${length} characters: "${html.metaDescription}"`, `Use ${DESCRIPTION_MIN}-${DESCRIPTION_MAX} characters.`);
			}
			const shared = descriptionCounts.get(html.metaDescription.trim().toLowerCase()) ?? 0;
			if (shared > 1) {
				add("Medium", "Duplicate meta description", url, `Same description as ${shared - 1} other checked page${shared > 2 ? "s" : ""}.`, "Write a unique description for each page.");
			}
		}

		const h1s = html.h1.filter((text) => text.length > 0);
		if (html.h1.length === 0) {
			add("High", "Missing H1 heading", url, "The page has no <h1>.", "Add one H1 that says what the page is about.");
		} else if (h1s.length === 0) {
			add("Medium", "Empty H1 heading", url, "The <h1> has no text.", "Put real words in the H1, not only an image or icon.");
		} else if (html.h1.length > 1) {
			add("Low", "Multiple H1 headings", url, `${html.h1.length} H1s: ${h1s.slice(0, 3).map((text) => `"${text}"`).join(", ")}`, "Use a single H1 and make the rest H2 or H3.");
		}

		if (!html.canonical) {
			add("Low", "Missing canonical tag", url, "No <link rel=\"canonical\">.", "Add a self-referencing canonical tag so Google knows the preferred address.");
		} else if (urlKey(html.canonical) !== urlKey(url)) {
			add("Medium", "Canonical points to another page", url, `Canonical: ${html.canonical}`, "If this page should rank on its own, point the canonical to itself.");
		}

		if (html.schemaTypes.length === 0 && !html.microdata) {
			add(
				"Medium",
				html.schemaErrors > 0 ? "Structured data has errors" : "No structured data",
				url,
				html.schemaErrors > 0 ? `${html.schemaErrors} JSON-LD block(s) could not be read.` : "No schema markup (JSON-LD or microdata).",
				html.schemaErrors > 0
					? "Fix the JSON-LD and test it in Google's Rich Results Test."
					: "Add schema such as Organization, LocalBusiness, Service, Article or FAQPage.",
			);
		} else if (html.schemaErrors > 0) {
			add("Medium", "Structured data has errors", url, `${html.schemaErrors} JSON-LD block(s) could not be read.`, "Fix the JSON-LD and test it in Google's Rich Results Test.");
		}

		if (!html.viewport) {
			add("High", "Not set up for mobile", url, "No viewport meta tag.", "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.");
		}
		if (!html.lang) {
			add("Low", "Missing language attribute", url, "The <html> tag has no lang.", "Add lang=\"en\" (or your language) to the <html> tag.");
		}
		if (html.imagesMissingAlt > 0) {
			add("Low", "Images missing alt text", url, `${html.imagesMissingAlt} of ${html.images} images have no alt attribute.`, "Describe each meaningful image in its alt text; use alt=\"\" for decorative ones.");
		}
		if (html.words < THIN_CONTENT_WORDS) {
			add("Low", "Thin content", url, `About ${html.words} words on the page.`, `Pages that should rank usually need more than ${THIN_CONTENT_WORDS} words of useful content.`);
		}
		if (!html.ogTitle || !html.ogImage) {
			const missing = [!html.ogTitle && "og:title", !html.ogDescription && "og:description", !html.ogImage && "og:image"].filter(Boolean).join(", ");
			add("Low", "Missing social sharing tags", url, `Missing ${missing}.`, "Add Open Graph tags so links look good on Facebook, LinkedIn and messaging apps.");
		}
		if (page.ms > SLOW_RESPONSE_MS) {
			add("Medium", "Slow server response", url, `${(page.ms / 1000).toFixed(1)} seconds before the server started answering.`, "Look at caching, hosting speed and heavy plugins.");
		}
	}

	return issues.sort(
		(a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || a.issue.localeCompare(b.issue) || a.url.localeCompare(b.url),
	);
}

export interface IssueSummaryRow {
	severity: Severity;
	issue: string;
	pages: number;
}

/** Issue types with how many pages each affects, worst first. */
export function summarizeIssues(issues: AuditIssue[]): IssueSummaryRow[] {
	const rows = new Map<string, IssueSummaryRow>();
	for (const item of issues) {
		const key = `${item.severity}|${item.issue}`;
		const row = rows.get(key) ?? { severity: item.severity, issue: item.issue, pages: 0 };
		row.pages += 1;
		rows.set(key, row);
	}
	return [...rows.values()].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.pages - a.pages || a.issue.localeCompare(b.issue));
}

export function countBySeverity(issues: AuditIssue[]): Record<Severity, number> {
	const counts: Record<Severity, number> = { High: 0, Medium: 0, Low: 0 };
	for (const item of issues) counts[item.severity] += 1;
	return counts;
}
