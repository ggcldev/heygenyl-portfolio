# heygenyl.com — Project Guide for Claude Code

This file is the project's persistent memory. It is committed to git so the same context loads on
any machine. Read it fully before making changes. Keep it updated when conventions change.

Owner: Genyl (freelance SEO specialist + WordPress designer/developer, Philippines).
Live site: https://heygenyl.com · Repo: https://github.com/ggcldev/heygenyl-portfolio (public)

---

## 1. Stack and commands

- Astro 6 (static output) + Tailwind CSS 4 via the Vite plugin. Node 22.
- Blog is an Astro content collection (`src/content.config.ts`). Services and case studies are
  data-driven from `src/data/site.ts`, rendered by `src/components/ServiceTemplate.astro`.
- `@astrojs/sitemap`, `@astrojs/mdx`, custom `rss.xml` route.

```sh
npm install
npm run dev        # local dev server
npm run check      # astro check (type + template errors)
npm test           # vitest
npm run build      # runs check, then astro build → dist/
npm run preview
```

Always run `npm run build` before pushing content or template changes. It catches broken
frontmatter and missing images.

## 2. Deploy and the cache trap

- Push to `main` triggers `.github/workflows/deploy.yml`: build → FTPS upload of `dist/` to
  Hostinger `public_html/` → purge Cloudflare (`purge_everything`). No manual upload needed.
- The `deploy` branch on origin is an old build-output branch. Ignore it. Never merge it.
- Secrets live in GitHub Actions (FTP creds, Cloudflare token/zone). Locally, `.env` is
  gitignored and only needed for `scripts/purge-cache.sh`.

**The site sits behind TWO CDN layers:** Cloudflare in front, Hostinger's own CDN underneath
(`x-hcdn-cache-status` header). The deploy purges only Cloudflare. Hostinger's CDN caches static
files like `sitemap-0.xml` for ~31 days and Cloudflare refills from that stale copy.

If a public URL looks stale after a successful deploy:

1. Confirm it is cache, not the build: `curl --compressed "https://heygenyl.com/sitemap-0.xml?cb=$(date +%s)"`
   (cache-buster bypasses both CDNs and shows the true origin).
2. Purge Hostinger first: hPanel → Websites → Manage → Advanced → Cache Manager → Purge all.
3. Then purge Cloudflare: `bash scripts/purge-cache.sh` or re-run the deploy workflow.

Use `curl --compressed`; origin serves brotli, so plain curl looks empty.

## 3. Design system (Kudos-inspired)

The visual design follows the Framer template **https://kudos.framer.media/** for theme, colors,
type, and motion, while keeping the site's own structure and content. The design is already
implemented in `src/styles/global.css` and the components; treat the code as the source of truth.

- Fonts: Space Grotesk (headings), IBM Plex Mono (meta, time, eyebrows), Inter (blog body).
- Light theme: ink `#1E1E1E`, paper `#fff`, accent `#2EBAC1`.
- Dark theme ("Kudos palette", dark-first): canvas `#050505`, surface `#0f0f0f`, white text,
  accent mint `#00ffc8`, accent-2 orange `#ff4400`.
- 20-division viewport grid (`--grid-cell`), card radius 24px, site-shell radius 28px,
  `--page-max: 1920px`.
- Big bold left-aligned hero type (clamp to 4.5rem, weight 800, line-height ~0.95). Uppercase
  eyebrow with a rotated-square accent bullet. Arrow-in-circle button hover.
- Service page sections: PageHero → "What I handle" (Kudos "Our focus": sticky left header +
  numbered list with staggered scroll reveal) → Explore children (hubs only) → Best fit (two mint
  checklist columns) → Process (ghosted step numbers) → FAQ accordion → CTA.

A scraped snapshot of the template used to live in `.reference/kudos/` (gitignored, local-only,
not on GitHub). It is optional; the live template URL is enough for reference.

## 4. Services information architecture

Nested under two category hubs. Each page is a thin wrapper that calls
`getServiceBySlug("<nested-slug>")` from `src/data/site.ts`.

| URL | Slug | Note |
|---|---|---|
| `/services/seo/` | `seo` | Hub. The only indexable service page. |
| `/services/seo/local-seo/` | `seo/local-seo` | noindex |
| `/services/seo/technical-seo/` | `seo/technical-seo` | noindex |
| `/services/seo/wordpress-seo/` | `seo/wordpress-seo` | noindex |
| `/services/web-design/` | `web-design` | Hub, starter copy, noindex |
| `/services/web-design/wordpress-web-design/` | `web-design/wordpress-web-design` | noindex |

- 301 redirects for old URLs live in both `public/.htaccess` and `astro.config.mjs` `redirects`.
  Keep them in sync.
- `noIndex: true` on a service renders meta robots noindex and drops it from the sitemap.
- Nav and footer list all six via `navLabel`. Homepage and `/services/` list only the two hubs.
- Helpers in `site.ts`: `activeServiceOrder`, `activeServicePages`, `topLevelServicePages`,
  `getChildServices(slug)`.

## 5. Content briefs

`src/data/content-briefs.md` holds positioning, tone, and internal-linking notes for every
service and case-study page. **Read the matching brief before writing or editing service or
case-study copy.** It is internal: never import it into a component and never paste its
instructional text into rendered fields.

Case-study metrics are anonymized until the owner supplies real numbers. Do not invent figures.

## 6. Blog: how posts are created (follow exactly)

### File layout

One folder per post under `src/content/blog/`, named with the URL slug. The markdown file and
all images sit inside that folder. Images are `.webp`, referenced with relative paths.

```
src/content/blog/why-duplicate-content-is-an-seo-issue/
  why-duplicate-content-is-an-seo-issue.md
  why_duplicate_content_is_an_seo_issue_featured_image.webp
  1_how_duplicate_content_damages_your_seo.webp
  2_how_to_fix_it.webp
```

Body images are numbered by section (`1_…`, `2_…`) and named after the H2 they illustrate.
Reference them with angle brackets so spaces survive: `![alt](<./1_section_name.webp>)`.

### Frontmatter (schema in `src/content.config.ts`)

```yaml
---
title: "Why Duplicate Content Is an SEO Issue"          # H1, Title Case
metaTitle: "Why Having Duplicate Content Is an Issue for Your SEO"   # optional SERP title override
slug: "why-duplicate-content-is-an-seo-issue"           # URL, lowercase-hyphenated
description: "…"        # 140–160 chars, meta description, ends with a soft CTA where natural
excerpt: "…"            # one sentence shown on the blog index
image: "./…_featured_image.webp"
imageAlt: "Descriptive alt text of the featured image"
pubDate: 2026-03-04     # YYYY-MM-DD
updatedDate: 2026-03-04 # optional, only when materially revised
tags:                   # exactly 3, pick from the existing set
  - SEO
  - Technical SEO
  - On-Page SEO
---
```

Existing tags (reuse these, add new ones sparingly): SEO, Technical SEO, SEO Audit, SEO Strategy,
Local SEO, Content Strategy, AI Search, On-Page SEO, Keyword Research, Landing Pages, Site
Architecture, Site Migration, Website Redesign, Business Growth.

For step-by-step "How to" posts add `howToSteps` (name, text, anchor) and optionally
`howToTotalTime` (ISO 8601 duration such as `PT2H30M`). The site turns these into HowTo
structured data. Anchors must match the generated heading ids, e.g. `step-1-crawl-your-site-first`.
See `how-to-conduct-a-technical-seo-site-audit.md` for the canonical example.

### Post structure (in order)

1. **Opening**: 2–3 short paragraphs that answer the title question directly. No throat-clearing,
   no "In today's digital landscape".
2. **`**Key Takeaways**`** bold label followed by 4–6 bullets. One line each.
3. **Body H2 sections** (typically 6–12). H2s are statements or questions, Title Case. Each
   section gets a real explanation, not a listicle stub. Use bullets for genuine lists,
   markdown tables for comparisons, and one illustrative image per major section where useful.
4. **Closing section** that reframes the takeaway, ending with the CTA paragraph (see below).
5. **`## Frequently Asked Questions`** with 4–6 `###` questions and 1–3 sentence answers.
   The FAQ is always the last section.

Length: 1,300–3,500 words for standard posts, up to ~5,000 for checklists and audits.

### Voice and style

- First person singular ("I", "my service"), speaking directly to a business owner ("you").
- Plain, confident, practical. Short sentences. Short paragraphs, often one to three sentences.
- Explain the mechanism, then the consequence. "Google picks one and ignores the other. You lose
  visibility. There is no notice."
- Spell out contractions in most cases ("does not", "that is", "it is"). Sparing use of
  "let's" in CTAs is fine.
- No hype, no filler, no emoji, no em-dash-heavy prose. No "In conclusion".
- Show real tool names and concrete examples (Screaming Frog, Search Console, Semrush).

### Links

- External links use raw HTML so they open in a new tab:
  `<a href="https://…" target="_blank" rel="noopener">Google Search Console</a>`.
  Link to authoritative sources and tools, 2–7 per post.
- Internal links to service pages use the same HTML form and point at the live nested URLs:
  `/services/seo/` (primary) or `/services/seo/local-seo/` when the topic is local.
- Every post ends with a "free SEO audit" CTA before the FAQ. Two accepted shapes:
  - Plain: "Get your free SEO audit and find out which pages on your site are working against
    each other right now."
  - Linked: "If you want a second set of eyes on your site, book a free audit through my
    <a href="/services/seo/" …>SEO specialist service</a> and I will help you find the issues
    that are actually worth fixing first."

### Publishing checklist

1. Folder + `.md` + `.webp` images in place, featured image present.
2. Frontmatter validates: exactly 3 tags, dates in `YYYY-MM-DD`, alt text on every image.
3. Key Takeaways present, FAQ last, CTA before FAQ, at least one internal service link.
4. `npm run build` passes.
5. Commit on `main` with a message like `Add <post title> blog post`. Push. Deploy runs itself.
6. If the sitemap or post looks stale after deploy, follow §2.

## 7. Working conventions for Claude

- Do not rewrite existing posts' voice or structure when editing; match what is there.
- Do not invent client metrics, testimonials, or results.
- Do not add new dependencies without asking.
- Keep `.htaccess` and `astro.config.mjs` redirects in sync when URLs change.
- Ask before changing the services IA, the design system tokens, or anything in `deploy.yml`.
- When conventions change, update this file in the same commit.
