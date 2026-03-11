export type TocItem = {
  title: string;
  id: string;
};

export type TocSection = TocItem & {
  children: TocItem[];
};

const slugifyHeading = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const buildTocSections = (markdownBody: string): TocSection[] => {
  const headingCounts = new Map<string, number>();
  const tocEntries = markdownBody
    .split("\n")
    .map((line) => line.trim())
    .map((line) => /^(##|###)\s+(.+)$/.exec(line))
    .filter((match): match is RegExpExecArray => Boolean(match))
    .map((match) => {
      const level = match[1].length;
      const title = match[2].trim();
      const baseSlug = slugifyHeading(title);
      const count = headingCounts.get(baseSlug) ?? 0;
      headingCounts.set(baseSlug, count + 1);
      return {
        level,
        title,
        id: count === 0 ? baseSlug : `${baseSlug}-${count}`,
      };
    });

  return tocEntries.reduce<TocSection[]>((sections, entry) => {
    if (entry.level === 2) {
      sections.push({ title: entry.title, id: entry.id, children: [] });
      return sections;
    }

    if (entry.level === 3 && sections.length > 0) {
      sections[sections.length - 1].children.push({
        title: entry.title,
        id: entry.id,
      });
    }

    return sections;
  }, []);
};
