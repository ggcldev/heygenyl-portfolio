import { describe, expect, it } from "vitest";
import { extractSignals } from "../src/lib/seo-audit/extract";
import { createReport, reportFileName, reportSheets } from "../src/lib/seo-audit/report";
import { auditIssues } from "../src/lib/seo-audit/rules";
import { chooseUrls, crawlDelayMs, linksFromHtml, orderChildSitemaps, parseSitemap, sitemapsFromRobots } from "../src/lib/seo-audit/sitemap";
import type { AuditSite, PageData, PageSignals } from "../src/lib/seo-audit/types";
import { isPublicHostname, isValidEmail, normalizeSiteInput, urlKey, visitorKey } from "../src/lib/seo-audit/url";
import { buildXlsx, columnName, crc32, xmlText } from "../src/lib/seo-audit/xlsx";

describe("site address checks", () => {
	it("turns typed addresses into the site root", () => {
		expect(normalizeSiteInput("example.com")?.href).toBe("https://example.com/");
		expect(normalizeSiteInput("  https://www.Example.com/blog/post?x=1 ")?.href).toBe("https://www.example.com/");
		expect(normalizeSiteInput("http://example.co.uk")?.href).toBe("http://example.co.uk/");
	});

	it("refuses anything that is not a public website", () => {
		for (const bad of ["", "localhost", "http://localhost:3000", "127.0.0.1", "http://10.0.0.5", "http://[::1]/", "http://169.254.169.254/latest", "ftp://example.com", "https://user:pw@example.com", "https://example.com:8080", "intranet", "printer.local", "https://2130706433/", "https://0x7f000001/", "exa mple.com"]) {
			expect(normalizeSiteInput(bad), bad).toBeNull();
		}
		expect(isPublicHostname("my-shop.com.au")).toBe(true);
		expect(isPublicHostname("xn--mnchen-3ya.de")).toBe(true);
		expect(isPublicHostname("site.test")).toBe(false);
	});

	it("groups visitors by IPv4 address or IPv6 /64 network for the daily limit", () => {
		expect(visitorKey("203.0.113.7")).toBe("203.0.113.7");
		expect(visitorKey("2001:db8:85a3:12:8a2e:370:7334:1")).toBe("2001:db8:85a3:12::/64");
		expect(visitorKey("2001:0DB8:85A3:0012:ffff::9")).toBe("2001:db8:85a3:12::/64");
		expect(visitorKey("2001:db8::1")).toBe("2001:db8:0:0::/64");
		expect(visitorKey("::1")).toBe("0:0:0:0::/64");
	});

	it("checks emails loosely", () => {
		expect(isValidEmail("owner@shop.com")).toBe(true);
		expect(isValidEmail("owner@shop")).toBe(false);
		expect(isValidEmail("not an email")).toBe(false);
	});

	it("compares page URLs without trailing slashes or hashes", () => {
		expect(urlKey("https://Example.com/about/#team")).toBe(urlKey("https://example.com/about"));
		expect(urlKey("https://example.com/")).toBe("https://example.com/");
	});
});

describe("sitemaps", () => {
	it("reads Sitemap lines from robots.txt", () => {
		const robots = "User-agent: *\nDisallow: /wp-admin/\nSitemap: https://example.com/sitemap_index.xml\nsitemap: /news.xml\n";
		expect(sitemapsFromRobots(robots, "https://example.com")).toEqual(["https://example.com/sitemap_index.xml", "https://example.com/news.xml"]);
	});

	it("reads page and index sitemaps, ignoring image locations", () => {
		const urlset = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
			<url><loc>https://example.com/</loc><image:image><image:loc>https://example.com/a.jpg</image:loc></image:image></url>
			<url><loc><![CDATA[https://example.com/a?x=1&amp;y=2]]></loc></url>
			<url><loc> https://example.com/b?x=1&amp;y=2 </loc></url></urlset>`;
		expect(parseSitemap(urlset)).toEqual({
			kind: "urlset",
			locs: ["https://example.com/", "https://example.com/a?x=1&y=2", "https://example.com/b?x=1&y=2"],
			total: 3,
		});
		const index = `<sitemapindex><sitemap><loc>https://example.com/category-sitemap.xml</loc></sitemap><sitemap><loc>https://example.com/post-sitemap.xml</loc></sitemap><sitemap><loc>https://example.com/page-sitemap.xml</loc></sitemap><sitemap><loc>https://other.com/page-sitemap.xml</loc></sitemap></sitemapindex>`;
		const parsed = parseSitemap(index);
		expect(parsed.kind).toBe("index");
		expect(orderChildSitemaps(parsed.locs, "www.example.com")).toEqual([
			"https://example.com/page-sitemap.xml",
			"https://example.com/post-sitemap.xml",
			"https://example.com/category-sitemap.xml",
		]);
	});

	it("reads the Crawl-delay that applies to all crawlers", () => {
		expect(crawlDelayMs("User-agent: *\nCrawl-delay: 2\n", 5000)).toBe(2000);
		expect(crawlDelayMs("User-agent: Googlebot\nUser-agent: *\nCrawl-delay: 1.5 # slow\n", 5000)).toBe(1500);
		expect(crawlDelayMs("User-agent: Bingbot\nCrawl-delay: 10\n\nUser-agent: *\nDisallow: /tmp/\n", 5000)).toBe(0);
		expect(crawlDelayMs("User-agent: *\nCrawl-delay: 30\n", 5000)).toBe(5000);
		expect(crawlDelayMs("Sitemap: https://example.com/sitemap.xml\n", 5000)).toBe(0);
	});

	it("parses only the first entries of a big sitemap but counts them all", () => {
		const xml = `<urlset>${Array.from({ length: 1000 }, (_, i) => `<url><loc>https://example.com/p${i}/</loc></url>`).join("")}</urlset>`;
		const parsed = parseSitemap(xml, 400);
		expect(parsed.locs).toHaveLength(400);
		expect(parsed.locs[399]).toBe("https://example.com/p399/");
		expect(parsed.total).toBe(1000);
	});

	it("chooses pages: same site, no files, no duplicates, homepage first, capped", () => {
		const locs = [
			"https://example.com/about/",
			"https://example.com/about",
			"https://www.example.com/contact/",
			"https://other.com/page/",
			"https://example.com/brochure.pdf",
			"https://example.com/",
			...Array.from({ length: 60 }, (_, i) => `https://example.com/p${i}/`),
		];
		const chosen = chooseUrls(locs, "https://example.com", 50);
		expect(chosen.urls[0]).toBe("https://example.com/");
		expect(chosen.urls).toHaveLength(50);
		expect(chosen.urls).toContain("https://www.example.com/contact/");
		expect(chosen.urls.filter((url) => url.includes("about"))).toHaveLength(1);
		expect(chosen.urls.some((url) => url.includes("other.com") || url.endsWith(".pdf"))).toBe(false);
		expect(chosen.total).toBe(63);
	});

	it("adds the homepage when the list has none", () => {
		expect(chooseUrls(["https://example.com/a"], "https://example.com", 50)).toEqual({ urls: ["https://example.com/", "https://example.com/a"], total: 2 });
	});

	it("collects homepage links for sites without a sitemap", () => {
		const html = `<a href="/services/">S</a><a href='https://example.com/about'>A</a><a href=#top>T</a><a href="mailto:x@y.com">M</a><!-- <a href="/hidden"> -->`;
		expect(linksFromHtml(html, "https://example.com/")).toEqual(["https://example.com/services/", "https://example.com/about"]);
	});
});

const PAGE_HTML = `<!doctype html><html lang="en-US"><head>
<meta charset="utf-8"><title> Plumber in Austin &amp; Round Rock | Acme </title>
<meta name='description' content="Fast, licensed plumbers.">
<meta name="robots" content="index, follow">
<meta name=viewport content="width=device-width">
<meta property="og:title" content="Acme"><meta property="og:image" content="/og.jpg">
<link rel="stylesheet" href="/a.css"><link rel="canonical" href="/plumbing/">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"LocalBusiness"},{"@type":["WebPage","FAQPage"]}]}</script>
<script type="application/ld+json">{ broken json </script>
<script>document.write("<h1>not a heading</h1><img src=x>")</script>
</head><body>
<svg><title>Menu icon</title></svg>
<h1>Emergency <em>plumbing</em> <img src="/logo.png" alt="Acme"></h1>
<h2>Why us</h2><h2>Areas</h2>
<p>We fix leaks fast &mdash; day or night. Call today.</p>
<img src="/a.jpg" alt=""><img src="/b.jpg">
<div itemscope itemtype="https://schema.org/Review"></div>
<!-- <h1>old heading</h1> -->
</body></html>`;

describe("page signals", () => {
	it("reads the SEO tags a crawler would", () => {
		const signals = extractSignals(PAGE_HTML, "https://acme.com/plumbing/");
		expect(signals.title).toBe("Plumber in Austin & Round Rock | Acme");
		expect(signals.metaDescription).toBe("Fast, licensed plumbers.");
		expect(signals.metaRobots).toBe("index, follow");
		expect(signals.viewport).toBe(true);
		expect(signals.canonical).toBe("https://acme.com/plumbing/");
		expect(signals.lang).toBe("en-US");
		expect(signals.h1).toEqual(["Emergency plumbing Acme"]);
		expect(signals.h2Count).toBe(2);
		expect(signals.schemaTypes).toEqual(["LocalBusiness", "WebPage", "FAQPage"]);
		expect(signals.schemaErrors).toBe(1);
		expect(signals.microdata).toBe(true);
		expect(signals.images).toBe(3);
		expect(signals.imagesMissingAlt).toBe(1);
		expect(signals.ogTitle && signals.ogImage && !signals.ogDescription).toBe(true);
		expect(signals.words).toBeGreaterThan(10);
		expect(signals.words).toBeLessThan(25);
	});

	it("handles a bare page", () => {
		const signals = extractSignals("<p>Hello world</p>", "https://acme.com/");
		expect(signals).toMatchObject({ title: null, metaDescription: null, h1: [], canonical: null, lang: null, viewport: false, schemaTypes: [], words: 2 });
	});
});

const SITE: AuditSite = {
	origin: "https://acme.com",
	host: "acme.com",
	homepageStatus: 200,
	robotsTxtFound: true,
	sitemaps: ["https://acme.com/sitemap.xml"],
	sitemapMissingFromRobots: false,
	source: "sitemap",
	totalUrls: 4,
};

const GOOD_SIGNALS: PageSignals = {
	title: "Emergency Plumber in Austin, TX | Acme Plumbing Co",
	metaDescription: "Licensed Austin plumbers for leaks, water heaters and drains. Same-day service, upfront prices. Call Acme Plumbing today.",
	h1: ["Emergency plumber in Austin"],
	h2Count: 3,
	canonical: "https://acme.com/",
	metaRobots: null,
	lang: "en",
	viewport: true,
	ogTitle: true,
	ogDescription: true,
	ogImage: true,
	schemaTypes: ["LocalBusiness"],
	schemaErrors: 0,
	microdata: false,
	images: 2,
	imagesMissingAlt: 0,
	words: 800,
};

const page = (url: string, overrides: Partial<PageData> = {}, html: Partial<PageSignals> | null = {}): PageData => ({
	url,
	status: 200,
	error: null,
	redirectTo: null,
	contentType: "text/html",
	ms: 300,
	bytes: 1000,
	truncated: false,
	xRobotsTag: null,
	html: html === null ? null : { ...GOOD_SIGNALS, canonical: url, ...html },
	...overrides,
});

describe("issue rules", () => {
	it("finds nothing on a healthy page", () => {
		expect(auditIssues(SITE, [page("https://acme.com/")])).toEqual([]);
	});

	it("flags the common problems with the right severity", () => {
		const pages = [
			page("https://acme.com/", {}, { title: null, h1: [], metaDescription: null, schemaTypes: [], viewport: false }),
			page("https://acme.com/a/", {}, { title: "Same title for both pages here ok", canonical: "https://acme.com/" }),
			page("https://acme.com/b/", {}, { title: "Same title for both pages here ok", metaRobots: "noindex, follow" }),
			page("https://acme.com/old/", { status: 301, redirectTo: "https://acme.com/new/" }, null),
			page("https://acme.com/gone/", { status: 404 }, null),
			page("https://acme.com/busy/", { status: 429 }, null),
			page("https://acme.com/slow/", { status: 0, error: "No response after 12 seconds." }, null),
		];
		const issues = auditIssues(SITE, pages);
		const find = (name: string, url: string) => issues.find((item) => item.issue === name && item.url === url);
		expect(find("Missing meta title", "https://acme.com/")?.severity).toBe("High");
		expect(find("Missing H1 heading", "https://acme.com/")?.severity).toBe("High");
		expect(find("Missing meta description", "https://acme.com/")?.severity).toBe("Medium");
		expect(find("No structured data", "https://acme.com/")?.severity).toBe("Medium");
		expect(find("Not set up for mobile", "https://acme.com/")?.severity).toBe("High");
		expect(find("Canonical points to another page", "https://acme.com/a/")?.severity).toBe("Medium");
		expect(find("Duplicate meta title", "https://acme.com/a/")).toBeTruthy();
		expect(find("Duplicate meta title", "https://acme.com/b/")).toBeTruthy();
		expect(find("Page is set to noindex", "https://acme.com/b/")?.severity).toBe("High");
		expect(find("Redirect listed in sitemap", "https://acme.com/old/")?.detail).toContain("https://acme.com/new/");
		expect(find("Broken page (404)", "https://acme.com/gone/")?.severity).toBe("High");
		expect(find("Page not checked (site limits fast checks)", "https://acme.com/busy/")?.severity).toBe("Low");
		expect(find("Page could not be loaded", "https://acme.com/slow/")?.detail).toContain("12 seconds");
		// Worst first.
		expect(issues[0]?.severity).toBe("High");
		expect(issues[issues.length - 1]?.severity).not.toBe("High");
	});

	it("flags a missing sitemap", () => {
		const issues = auditIssues({ ...SITE, source: "homepage-links", sitemaps: [], robotsTxtFound: false }, [page("https://acme.com/")]);
		expect(issues.map((item) => item.issue)).toEqual(["No XML sitemap found", "No robots.txt file"]);
	});
});

/** Reads a stored (uncompressed) zip: file name -> text. */
function unzipStored(bytes: Uint8Array): Map<string, string> {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const files = new Map<string, string>();
	const eocd = bytes.length - 22;
	expect(view.getUint32(eocd, true)).toBe(0x06054b50);
	const count = view.getUint16(eocd + 10, true);
	let at = view.getUint32(eocd + 16, true);
	for (let i = 0; i < count; i++) {
		expect(view.getUint32(at, true)).toBe(0x02014b50);
		const crc = view.getUint32(at + 16, true);
		const size = view.getUint32(at + 24, true);
		const nameLength = view.getUint16(at + 28, true);
		const localOffset = view.getUint32(at + 42, true);
		const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
		const localNameLength = view.getUint16(localOffset + 26, true);
		const data = bytes.subarray(localOffset + 30 + localNameLength, localOffset + 30 + localNameLength + size);
		expect(crc32(data)).toBe(crc);
		files.set(name, new TextDecoder().decode(data));
		at += 46 + nameLength;
	}
	return files;
}

describe("Excel writer", () => {
	it("names columns like Excel", () => {
		expect([0, 25, 26, 27, 701, 702].map(columnName)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
	});

	it("escapes text and drops characters XML cannot hold", () => {
		expect(xmlText('a & b < c > "d"\u0001')).toBe("a &amp; b &lt; c &gt; &quot;d&quot;");
	});

	it("writes a valid workbook zip with all parts", () => {
		const bytes = buildXlsx([
			{ name: "Summary", columns: [{ width: 20 }], rows: [[{ value: "Title", style: "title" }], ["Pages", 12]] },
			{ name: "Issues [all]", headerRow: true, columns: [{ width: 10 }, { width: 30, style: "wrap" }], rows: [["Severity", "Issue"], [{ value: "High", style: "high" }, "Tom & Jerry <b>"]] },
		]);
		const files = unzipStored(bytes);
		expect([...files.keys()]).toEqual([
			"[Content_Types].xml",
			"_rels/.rels",
			"xl/workbook.xml",
			"xl/_rels/workbook.xml.rels",
			"xl/styles.xml",
			"xl/worksheets/sheet1.xml",
			"xl/worksheets/sheet2.xml",
		]);
		expect(files.get("xl/workbook.xml")).toContain('<sheet name="Issues  all" sheetId="2" r:id="rId2"/>');
		const sheet2 = files.get("xl/worksheets/sheet2.xml") ?? "";
		expect(sheet2).toContain('state="frozen"');
		expect(sheet2).toContain('<autoFilter ref="A1:B2"/>');
		expect(sheet2).toContain("Tom &amp; Jerry &lt;b&gt;");
		expect(files.get("xl/worksheets/sheet1.xml")).toContain('<c r="B2" s="0"><v>12</v></c>'.replace(' s="0"', ""));
	});
});

describe("audit report", () => {
	it("builds Summary, Issues and Pages sheets and a file name", () => {
		const report = createReport(SITE, [page("https://acme.com/"), page("https://acme.com/gone/", { status: 404 }, null)], new Date(2026, 9, 18));
		const sheets = reportSheets(report, { name: "Hey Genyl", email: "hi@heygenyl.com", website: "https://heygenyl.com" });
		expect(sheets.map((sheet) => sheet.name)).toEqual(["Summary", "Issues", "Pages"]);
		expect(sheets[1]?.rows).toHaveLength(1 + report.issues.length);
		expect(sheets[2]?.rows).toHaveLength(3);
		expect(reportFileName(report)).toBe("seo-audit-acme-com-2026-10-18.xlsx");
	});
});
