// Minimal .xlsx writer: an .xlsx file is a zip of XML parts. Supports text and
// number cells, a few cell styles, column widths, a frozen header row and
// filters. Files are stored uncompressed; audit reports stay small.

export type CellStyle = "header" | "title" | "bold" | "muted" | "wrap" | "high" | "medium" | "low" | "link";

export type CellValue = string | number | null;
export interface StyledCell {
	value: CellValue;
	style: CellStyle;
}
export type Cell = CellValue | StyledCell;

export interface Column {
	width: number;
	/** Default style for this column's body cells. */
	style?: CellStyle;
}

export interface SheetSpec {
	name: string;
	columns: Column[];
	rows: Cell[][];
	/** Freeze the first row and add filters to it. */
	headerRow?: boolean;
}

const STYLE_INDEX: Record<CellStyle, number> = {
	header: 1,
	title: 2,
	bold: 3,
	muted: 4,
	wrap: 5,
	high: 6,
	medium: 7,
	low: 8,
	link: 9,
};

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="8">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="18"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><sz val="11"/><color rgb="FF6B7280"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF9B1C1C"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF92400E"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><color rgb="FF374151"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="6">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF111111"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFDE2E1"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFEF3C7"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="10">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="6" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="7" fillId="5" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const MAX_CELL_TEXT = 32_000;

/** Escapes text for XML and removes characters XML cannot hold. */
export function xmlText(value: string): string {
	return value
		.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/** 0 → "A", 25 → "Z", 26 → "AA". */
export function columnName(index: number): string {
	let name = "";
	let n = index + 1;
	while (n > 0) {
		const rem = (n - 1) % 26;
		name = String.fromCharCode(65 + rem) + name;
		n = Math.floor((n - 1) / 26);
	}
	return name;
}

/** Excel sheet names: 31 characters max, none of []:*?/\ . */
export function safeSheetName(name: string): string {
	return name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31) || "Sheet";
}

function cellXml(cell: Cell, ref: string, fallback: CellStyle | undefined): string {
	const isStyled = cell !== null && typeof cell === "object";
	const value = isStyled ? cell.value : cell;
	const style = isStyled ? cell.style : fallback;
	const s = style ? ` s="${STYLE_INDEX[style]}"` : "";
	if (value === null || value === "") return style ? `<c r="${ref}"${s}/>` : "";
	if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${s}><v>${value}</v></c>`;
	const text = xmlText(String(value).slice(0, MAX_CELL_TEXT));
	const space = /^\s|\s$/.test(text) ? ' xml:space="preserve"' : "";
	return `<c r="${ref}"${s} t="inlineStr"><is><t${space}>${text}</t></is></c>`;
}

function sheetXml(sheet: SheetSpec): string {
	const lastCol = columnName(Math.max(sheet.columns.length, 1) - 1);
	const lastRow = Math.max(sheet.rows.length, 1);
	const view = sheet.headerRow
		? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>`
		: `<sheetViews><sheetView workbookViewId="0"/></sheetViews>`;
	const cols = sheet.columns.length
		? `<cols>${sheet.columns.map((col, i) => `<col min="${i + 1}" max="${i + 1}" width="${col.width}" customWidth="1"/>`).join("")}</cols>`
		: "";
	const rows = sheet.rows
		.map((row, r) => {
			const cells = row
				.map((cell, c) => {
					const isHeader = sheet.headerRow && r === 0;
					const fallback = isHeader ? "header" : sheet.columns[c]?.style;
					return cellXml(cell, `${columnName(c)}${r + 1}`, fallback);
				})
				.join("");
			const height = sheet.headerRow && r === 0 ? ' ht="22" customHeight="1"' : "";
			return `<row r="${r + 1}"${height}>${cells}</row>`;
		})
		.join("");
	const filter = sheet.headerRow && sheet.rows.length > 0 ? `<autoFilter ref="A1:${lastCol}${lastRow}"/>` : "";
	return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">${view}<sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${rows}</sheetData>${filter}</worksheet>`;
}

export function buildXlsx(sheets: SheetSpec[]): Uint8Array {
	const names = sheets.map((sheet, i) => {
		let name = safeSheetName(sheet.name);
		while (sheets.slice(0, i).some((other) => safeSheetName(other.name) === name)) name = `${name.slice(0, 28)} ${i + 1}`;
		return name;
	});

	const definedNames = sheets
		.map((sheet, i) =>
			sheet.headerRow && sheet.rows.length > 0
				? `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${xmlText(names[i] ?? "").replace(/'/g, "''")}'!$A$1:$${columnName(Math.max(sheet.columns.length, 1) - 1)}$${sheet.rows.length}</definedName>`
				: "",
		)
		.join("");

	const files: Array<[string, string]> = [
		[
			"[Content_Types].xml",
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
				.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
				.join("")}</Types>`,
		],
		[
			"_rels/.rels",
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
		],
		[
			"xl/workbook.xml",
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names
				.map((name, i) => `<sheet name="${xmlText(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
				.join("")}</sheets>${definedNames ? `<definedNames>${definedNames}</definedNames>` : ""}</workbook>`,
		],
		[
			"xl/_rels/workbook.xml.rels",
			`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
				.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
				.join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
		],
		["xl/styles.xml", STYLES_XML],
		...sheets.map((sheet, i): [string, string] => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet)]),
	];

	return zipStore(files.map(([name, text]) => ({ name, data: new TextEncoder().encode(text) })));
}

// --- Zip (store, no compression) ---

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n++) {
		let c = n;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		table[n] = c >>> 0;
	}
	return table;
})();

export function crc32(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) crc = (CRC_TABLE[(crc ^ (data[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
	return (crc ^ 0xffffffff) >>> 0;
}

export function zipStore(entries: Array<{ name: string; data: Uint8Array }>, date = new Date()): Uint8Array {
	const dosTime = ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | (Math.floor(date.getSeconds() / 2) & 31);
	const dosDate = (((date.getFullYear() - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
	const encoder = new TextEncoder();
	const local: Uint8Array[] = [];
	const central: Uint8Array[] = [];
	let offset = 0;

	for (const entry of entries) {
		const name = encoder.encode(entry.name);
		const crc = crc32(entry.data);
		const size = entry.data.length;

		const header = new Uint8Array(30 + name.length);
		const h = new DataView(header.buffer);
		h.setUint32(0, 0x04034b50, true);
		h.setUint16(4, 20, true);
		h.setUint16(6, 0x0800, true); // UTF-8 names
		h.setUint16(8, 0, true); // stored
		h.setUint16(10, dosTime, true);
		h.setUint16(12, dosDate, true);
		h.setUint32(14, crc, true);
		h.setUint32(18, size, true);
		h.setUint32(22, size, true);
		h.setUint16(26, name.length, true);
		h.setUint16(28, 0, true);
		header.set(name, 30);

		const record = new Uint8Array(46 + name.length);
		const c = new DataView(record.buffer);
		c.setUint32(0, 0x02014b50, true);
		c.setUint16(4, 20, true);
		c.setUint16(6, 20, true);
		c.setUint16(8, 0x0800, true);
		c.setUint16(10, 0, true);
		c.setUint16(12, dosTime, true);
		c.setUint16(14, dosDate, true);
		c.setUint32(16, crc, true);
		c.setUint32(20, size, true);
		c.setUint32(24, size, true);
		c.setUint16(28, name.length, true);
		c.setUint16(30, 0, true);
		c.setUint16(32, 0, true);
		c.setUint16(34, 0, true);
		c.setUint16(36, 0, true);
		c.setUint32(38, 0, true);
		c.setUint32(42, offset, true);
		record.set(name, 46);

		local.push(header, entry.data);
		central.push(record);
		offset += header.length + size;
	}

	const centralSize = central.reduce((sum, part) => sum + part.length, 0);
	const end = new Uint8Array(22);
	const e = new DataView(end.buffer);
	e.setUint32(0, 0x06054b50, true);
	e.setUint16(8, entries.length, true);
	e.setUint16(10, entries.length, true);
	e.setUint32(12, centralSize, true);
	e.setUint32(16, offset, true);

	const parts = [...local, ...central, end];
	const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
	let at = 0;
	for (const part of parts) {
		out.set(part, at);
		at += part.length;
	}
	return out;
}
