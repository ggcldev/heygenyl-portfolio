// Builds the free SEO audit Excel report: Summary, Issues and Pages sheets.

import { auditIssues, countBySeverity, isAuditable, isNoindex, summarizeIssues } from "./rules";
import type { AuditIssue, AuditSite, PageData, Severity } from "./types";
import { buildXlsx, type Cell, type SheetSpec } from "./xlsx";

export interface AuditReport {
	site: AuditSite;
	pages: PageData[];
	issues: AuditIssue[];
	counts: Record<Severity, number>;
	createdAt: Date;
}

export function createReport(site: AuditSite, pages: PageData[], createdAt = new Date()): AuditReport {
	const issues = auditIssues(site, pages);
	return { site, pages, issues, counts: countBySeverity(issues), createdAt };
}

const severityCell = (severity: Severity): Cell => ({ value: severity, style: severity === "High" ? "high" : severity === "Medium" ? "medium" : "low" });

function pageListSource(site: AuditSite): string {
	if (site.source !== "sitemap") return "Homepage links (no sitemap found)";
	const [first, ...rest] = site.sitemaps;
	if (!first) return "Sitemap";
	return rest.length ? `${first} (+${rest.length} more sitemap file${rest.length > 1 ? "s" : ""})` : first;
}

function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function reportSheets(report: AuditReport, contact: { name: string; email: string; website: string }): SheetSpec[] {
	const { site, pages, issues, counts } = report;
	const checked = pages.length;
	const working = pages.filter(isAuditable).length;
	const typeRows = summarizeIssues(issues);

	const summaryRows: Cell[][] = [
		[{ value: `Free SEO audit: ${site.host}`, style: "title" }],
		[{ value: `Prepared by ${contact.name} (${contact.website}) on ${formatDate(report.createdAt)}`, style: "muted" }],
		[],
		[{ value: "Website", style: "bold" }, site.origin],
		[{ value: "Page list from", style: "bold" }, pageListSource(site)],
		[{ value: "Pages found", style: "bold" }, site.totalUrls],
		[{ value: "Pages checked", style: "bold" }, checked],
		[{ value: "Pages that loaded", style: "bold" }, working],
		[],
		[{ value: "Issues found", style: "bold" }, issues.length],
		[severityCell("High"), counts.High],
		[severityCell("Medium"), counts.Medium],
		[severityCell("Low"), counts.Low],
		[],
		[{ value: "Issue", style: "header" }, { value: "Pages", style: "header" }, { value: "Severity", style: "header" }],
		...typeRows.map((row): Cell[] => [row.issue, row.pages, severityCell(row.severity)]),
		[],
		[{ value: "What the severities mean", style: "bold" }],
		[{ value: "High: stops pages from ranking or being found. Fix first.", style: "muted" }],
		[{ value: "Medium: holds rankings or clicks back. Fix next.", style: "muted" }],
		[{ value: "Low: good practice and polish.", style: "muted" }],
		[],
		[
			{
				value:
					site.totalUrls > checked
						? `This free audit checked the first ${checked} of ${site.totalUrls} pages. A full audit also covers speed, backlinks, Google Search Console data and content.`
						: "A full audit also covers speed, backlinks, Google Search Console data and content.",
				style: "muted",
			},
		],
		[{ value: `Want help fixing these? Email ${contact.email} or visit ${contact.website}/contact/`, style: "bold" }],
	];

	const issueRows: Cell[][] = [
		["Severity", "Issue", "Page", "Details", "How to fix"],
		...issues.map((item): Cell[] => [severityCell(item.severity), item.issue, item.url, item.detail, item.fix]),
	];

	const pageRows: Cell[][] = [
		[
			"Page",
			"Status",
			"Meta title",
			"Title length",
			"Meta description",
			"Description length",
			"H1",
			"H1 count",
			"Canonical",
			"Indexable",
			"Structured data",
			"Words",
			"Images without alt",
			"Response (ms)",
		],
		...pages.map((page): Cell[] => {
			const html = page.html;
			const status = page.status === 0 ? `Failed: ${page.error ?? "no response"}` : page.redirectTo ? `${page.status} → ${page.redirectTo}` : page.status;
			if (!html) return [page.url, status, null, null, null, null, null, null, null, null, null, null, null, page.ms || null];
			return [
				page.url,
				status,
				html.title,
				html.title?.length ?? 0,
				html.metaDescription,
				html.metaDescription?.length ?? 0,
				html.h1.filter(Boolean).join(" | ") || null,
				html.h1.length,
				html.canonical,
				isNoindex(page) ? "No (noindex)" : "Yes",
				html.schemaTypes.join(", ") || (html.microdata ? "Microdata" : "None"),
				html.words,
				html.imagesMissingAlt,
				page.ms,
			];
		}),
	];

	return [
		// Narrow value columns keep numbers next to their labels; long text runs across empty cells.
		{ name: "Summary", columns: [{ width: 44 }, { width: 12 }, { width: 12 }], rows: summaryRows },
		{
			name: "Issues",
			headerRow: true,
			columns: [{ width: 11 }, { width: 34 }, { width: 50 }, { width: 60, style: "wrap" }, { width: 60, style: "wrap" }],
			rows: issueRows,
		},
		{
			name: "Pages",
			headerRow: true,
			columns: [
				{ width: 50 },
				{ width: 10 },
				{ width: 45, style: "wrap" },
				{ width: 8 },
				{ width: 60, style: "wrap" },
				{ width: 8 },
				{ width: 40, style: "wrap" },
				{ width: 8 },
				{ width: 45 },
				{ width: 12 },
				{ width: 28, style: "wrap" },
				{ width: 8 },
				{ width: 10 },
				{ width: 10 },
			],
			rows: pageRows,
		},
	];
}

export function buildReportXlsx(report: AuditReport, contact: { name: string; email: string; website: string }): Uint8Array {
	return buildXlsx(reportSheets(report, contact));
}

/** "seo-audit-example-com-2026-10-18.xlsx" */
export function reportFileName(report: AuditReport): string {
	const host = report.site.host.replace(/^www\./, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
	const d = report.createdAt;
	const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	return `seo-audit-${host}-${date}.xlsx`;
}
