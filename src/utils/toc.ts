import type { MarkdownHeading } from "astro";

export type TocItem = {
  title: string;
  id: string;
};

export type TocSection = TocItem & {
  children: TocItem[];
};

export const buildTocSections = (headings: MarkdownHeading[]): TocSection[] => {
  const tocEntries = headings
    .filter((heading) => heading.depth === 2 || heading.depth === 3)
    .map((heading) => ({
      level: heading.depth,
      title: heading.text,
      id: heading.slug,
    }));

  return tocEntries.reduce<TocSection[]>((sections, entry) => {
    if (entry.level === 2) {
      sections.push({ title: entry.title, id: entry.id, children: [] });
      return sections;
    }

    if (entry.level === 3 && sections.length > 0) {
      const currentSection = sections.at(-1);
      if (!currentSection) return sections;
      currentSection.children.push({
        title: entry.title,
        id: entry.id,
      });
    }

    return sections;
  }, []);
};
