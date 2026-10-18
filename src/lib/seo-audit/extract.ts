// Reads on-page SEO signals from raw HTML. Plain string parsing, so it runs the
// same in the Cloudflare Worker and in tests, with no HTML library.

import type { PageSignals } from "./types";

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	nbsp: " ",
	ndash: "–",
	mdash: "—",
	lsquo: "‘",
	rsquo: "’",
	ldquo: "“",
	rdquo: "”",
	hellip: "…",
	copy: "©",
	reg: "®",
	trade: "™",
	bull: "•",
	middot: "·",
	laquo: "«",
	raquo: "»",
};

export function decodeEntities(text: string): string {
	return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, code: string) => {
		if (code[0] === "#") {
			const value = code[1] === "x" || code[1] === "X" ? parseInt(code.slice(2), 16) : Number(code.slice(1));
			return Number.isFinite(value) && value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : whole;
		}
		return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
	});
}

/** Attributes of a tag's inner text, e.g. ` name="description" content="Hi"`. Keys are lowercase. */
export function parseAttributes(source: string): Map<string, string> {
	const attrs = new Map<string, string>();
	for (const match of source.matchAll(/([^\s=/"'<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
		const name = (match[1] ?? "").toLowerCase();
		if (!name || attrs.has(name)) continue;
		attrs.set(name, decodeEntities(match[2] ?? match[3] ?? match[4] ?? ""));
	}
	return attrs;
}

const collapse = (text: string) => text.replace(/\s+/g, " ").trim();

/** Visible text of an HTML fragment; images count as their alt text. */
function textOf(fragment: string): string {
	const withAlt = fragment.replace(/<img\b([^>]*)>/gi, (_, attrs: string) => ` ${parseAttributes(attrs).get("alt") ?? ""} `);
	return collapse(decodeEntities(withAlt.replace(/<[^>]+>/g, " ")));
}

/** @type values from one JSON-LD block (top level, arrays and @graph). */
function schemaTypesOf(data: unknown): string[] {
	const types: string[] = [];
	const visit = (node: unknown, depth: number) => {
		if (depth > 2 || !node || typeof node !== "object") return;
		if (Array.isArray(node)) {
			for (const item of node) visit(item, depth);
			return;
		}
		const record = node as Record<string, unknown>;
		const type = record["@type"];
		if (typeof type === "string") types.push(type);
		else if (Array.isArray(type)) types.push(...type.filter((value): value is string => typeof value === "string"));
		if (record["@graph"]) visit(record["@graph"], depth + 1);
	};
	visit(data, 0);
	return types;
}

export function extractSignals(rawHtml: string, pageUrl: string): PageSignals {
	const html = rawHtml.replace(/<!--[\s\S]*?-->/g, "");

	const schemaTypes: string[] = [];
	let schemaErrors = 0;
	for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
		const type = parseAttributes(match[1] ?? "").get("type") ?? "";
		if (!/application\/ld\+json/i.test(type)) continue;
		try {
			schemaTypes.push(...schemaTypesOf(JSON.parse((match[2] ?? "").trim())));
		} catch {
			schemaErrors += 1;
		}
	}

	// Drop code and templates so tags inside scripts never count.
	const doc = html.replace(/<(script|style|noscript|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ");
	const headEnd = doc.search(/<\/head\s*>|<body[\s>]/i);
	const head = headEnd > 0 ? doc.slice(0, headEnd) : doc;
	const bodyStart = doc.search(/<body[\s>]/i);
	const body = bodyStart >= 0 ? doc.slice(bodyStart) : doc;

	// Title from the head first: SVG icons in the body can carry their own <title>.
	const titleMatch = head.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i) ?? doc.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i);
	const title = titleMatch ? collapse(decodeEntities((titleMatch[1] ?? "").replace(/<[^>]+>/g, ""))) : null;

	let metaDescription: string | null = null;
	let metaRobots: string | null = null;
	let viewport = false;
	let ogTitle = false;
	let ogDescription = false;
	let ogImage = false;
	let canonical: string | null = null;

	for (const match of doc.matchAll(/<(meta|link)\b([^>]*)>/gi)) {
		const tag = (match[1] ?? "").toLowerCase();
		const attrs = parseAttributes(match[2] ?? "");
		if (tag === "meta") {
			const name = (attrs.get("name") ?? "").toLowerCase();
			const property = (attrs.get("property") ?? "").toLowerCase();
			const content = collapse(attrs.get("content") ?? "");
			if (name === "description" && metaDescription === null) metaDescription = content;
			else if (name === "robots" || name === "googlebot") metaRobots = metaRobots ? `${metaRobots}, ${content}` : content;
			else if (name === "viewport") viewport = true;
			const key = property || name;
			if (key === "og:title" && content) ogTitle = true;
			if (key === "og:description" && content) ogDescription = true;
			if (key === "og:image" && content) ogImage = true;
		} else if (canonical === null) {
			const rel = (attrs.get("rel") ?? "").toLowerCase().split(/\s+/);
			const href = attrs.get("href");
			if (rel.includes("canonical") && href) {
				try {
					canonical = new URL(href.trim(), pageUrl).href;
				} catch {
					canonical = href.trim();
				}
			}
		}
	}

	const htmlTag = doc.match(/<html\b([^>]*)>/i);
	const lang = htmlTag ? (parseAttributes(htmlTag[1] ?? "").get("lang") ?? "").trim() || null : null;

	const h1 = [...doc.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1\s*>/gi)].map((match) => textOf(match[1] ?? ""));
	const h2Count = (doc.match(/<h2\b/gi) ?? []).length;

	let images = 0;
	let imagesMissingAlt = 0;
	for (const match of doc.matchAll(/<img\b([^>]*)>/gi)) {
		images += 1;
		if (!parseAttributes(match[1] ?? "").has("alt")) imagesMissingAlt += 1;
	}

	const microdata = /\bitemtype\s*=/i.test(doc);
	const text = decodeEntities(body.replace(/<[^>]+>/g, " "));
	const words = (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;

	return {
		title,
		metaDescription,
		h1,
		h2Count,
		canonical,
		metaRobots,
		lang,
		viewport,
		ogTitle,
		ogDescription,
		ogImage,
		schemaTypes: [...new Set(schemaTypes)],
		schemaErrors,
		microdata,
		images,
		imagesMissingAlt,
		words,
	};
}
