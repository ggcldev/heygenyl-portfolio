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

- **Deploy is fully automatic. Every push to `main` deploys the site and purges Cloudflare.**
  `.github/workflows/deploy.yml` runs: `npm ci` (Node 22) → `npm run build` → FTPS upload of
  `dist/` to Hostinger `public_html/` (`SamKirkland/FTP-Deploy-Action@v4.3.5`) → a final step
  that POSTs `{"purge_everything":true}` to
  `https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache` with a Bearer
  token. Never upload by hand and never add a manual "purge after deploy" step; it already exists.
  The workflow also supports `workflow_dispatch` for manual re-runs.
- Secrets live in GitHub Actions, not the repo: `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`,
  `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`, plus the variable `PUBLIC_TURNSTILE_SITE_KEY`.
  A fresh clone deploys with zero local setup.
- `scripts/purge-cache.sh` (tracked in git) is the on-demand local Cloudflare purge. It sources
  `.env` from the repo root and requires `CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN`
  (see `.env.example`). `.env` is gitignored, so on a new machine copy `.env.example` to `.env`
  and fill those two values before running it. Same API call as the workflow's final step.
- The `deploy` branch on origin is an old build-output branch. Ignore it. Never merge it.

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
- Light theme (Kudos light bands): ink `#050505`, paper `#EDEDED` (Kudos greyish-white,
  sampled from the template), surface `#FAFAFA`.
- Dark theme ("Kudos palette", dark-first): canvas `#050505`, surface `#0f0f0f`, white text,
  accent-2 orange `#ff4400`.
- **Universal accent green: `#43d39e`** (deeper seafoam; the owner found raw `#00ffc8` harsh).
  Same value in both themes and both bands — always use `var(--color-accent)`, never a
  hard-coded green.
- **No theme toggle.** The site is hard-coded dark (`<html data-theme="dark">` in
  `BaseLayout.astro`). Light appears only as Kudos-style alternating full-bleed section bands:
  add class `band-light` to a homepage section to re-scope tokens to the light palette
  (`.band-light` in `global.css`). Homepage also has a sticky-hero "curtain reveal"
  (`.home-page .hero-shell` in `home.css`) and `+` eyebrow glyphs via `.section-eyebrow`.
- Smooth scrolling: Lenis (`src/scripts/smooth-scroll.ts`, loaded in `BaseLayout.astro`).
  Desktop fine-pointer only; disabled for `prefers-reduced-motion`; touch stays native.
  Glide feel is tuned by `duration` there.
- 20-division viewport grid (`--grid-cell`), card radius 24px, site-shell radius 28px,
  `--page-max: 1920px`.
- Big bold left-aligned hero type (clamp to 4.5rem, weight 800, line-height ~0.95). Uppercase
  eyebrow with a rotated-square accent bullet. Arrow-in-circle button hover.
- Service page sections: PageHero → "What I handle" (Kudos "Our focus": sticky left header +
  numbered list with staggered scroll reveal) → Explore children (hubs only) → Best fit (two mint
  checklist columns) → Process (ghosted step numbers) → FAQ accordion → CTA.

A scraped snapshot of the template used to live in `.reference/kudos/` (gitignored, local-only,
not on GitHub). It is optional; the live template URL is enough for reference.

## 3.5 Kudos redesign status (as of 2026-10-17, session work — read before continuing)

Homepage was rebuilt section-by-section to mirror https://kudos.framer.media/. All of this is
in 40+ LOCAL commits on `main`, **deliberately not pushed yet** (push = live deploy). Done:

- Hard-coded dark-first, theme toggle deleted; light appears via `.band-light` full-bleed bands.
- Sticky hero curtain reveal; Lenis smooth scroll (desktop only); dashed column guides + grain
  backdrop on body; universal h2 scale (64px, blog exempt); universal accent `#43d39e`.
- Sections done Kudos-style: Featured Projects (pinned bottom-ish horizontal scroll, 5 cards,
  live client-site screenshots, mono numbering; owner KEEPS this own design — a full Kudos
  "Created with clear purpose" rebuild was tried 2026-10-17 and rejected). Cards are dark
  Kudos "studio" cards with the screenshot on a CSS laptop (`.featured-project-device`,
  76% wide, 86% on phones). On desktop the heading pins at 9vh and card width follows
  screen height (`(91vh - 352px) * 1.6`, 600-960px) so the FULL description always fits
  under the pinned card (owner approved on MacBook Air + 27"; don't clamp the text),
  My Approach (black progress bars 25-100% +
  animated tick stripes + scroll-grow), Services (black + seafoam value cards, RANK/BUILD
  watermarks, sub-service chips), What Clients Say (light band, Lifted logo + reset-to-first
  on scroll), Recent Posts ("Insights" 3-col header + 4 top-aligned cards, auto-newest-4;
  cards sit exactly between the dashed guides via `--shell-pad`, image shape per slot
  2:3 / 1.68 / 3:4 / 3:2, phones 4:3), FAQ (grouped categories, continuous numbering,
  dotted-plus, no CTA button — the closing CTA covers it).
- Agency logo strip right after the hero (`AgencyLogos.astro`, logos in
  `src/assets/agencies/`): top of the light band (`band-light`, same #ededed paper as
  Featured Projects, dashed rule under it); Kudos ticker, label in the first guide column, 8 agency logos in their own
  colors, pause on hover, static for reduced motion. Logo prep: 51Blocks' light-grey
  "BLOCKS" darkened to #4a4a4a for the light band, Rock Star JPG keyed to transparent,
  Rock Star + InnoVision taglines cropped, Dig Designs white PNG recolored to their site
  colors (their SVG needs an unembedded font). Lifted + Tech Pro are svgo-optimized SVGs;
  the rest are PNGs (Astro ships small WebP). Dealers United is only a 171px PNG.
- Brand logo (owner's own, 2026-10-18): source files `src/assets/brand/heygenyl-logo.svg`
  (dark) + `-white.svg`, stacked HG mark over "heygenyl". Header uses `Logo.astro`, a
  side-by-side version built from the same paths (wordmark scaled 2x, centered on the mark;
  ink = currentColor, G = `--color-accent`), height `clamp(1.75rem, 2.25vw, 2.4rem)`.
  Initials-only "HG" files (`heygenyl-mark-*initials-only.svg`) → `LogoMark.astro`, shown
  in the footer above the statement (links home, ~52px at 1440).
  Favicon `public/favicon.svg` = HG mark on a #050505 rounded tile; linked as
  `/favicon.svg?v=2` because Hostinger's CDN caches static files ~31 days.
- Scrolled header (`.site-header.is-scrolled`) stays dark: 94% paper, 6% hairline, black
  shadow. Never tint shadows/borders with `--color-ink` there (ink is white on this site, the
  owner called the old white glow "lighted"); padding stays fixed so nothing shifts.
- CtaArrow = 3 dots morphing to arrow on hover (no circle fill) + green underline sweep.
- Perf pass done: external CSS (inlineStylesheets "never"), ~715 lines dead CSS purged,
  blog images downscaled to 1600px cap, 3 font preloads.
- Footer redesigned Kudos-style (`Footer.astro` + `.site-footer__*` in global.css): cropped
  HEYGENYL watermark, two-tone statement, mono meta, huge obfuscated email, big nav with
  dotted leader line, Services/Legal mono columns.
- Closing CTA redesigned: left-aligned two-tone heading + eyebrow + accent green button.
  Colors follow Kudos' newsletter (2026-10-18): light band one step darker than the FAQ
  above, and the footer starts flush under it on the homepage (no 4rem dark gap, no top
  border).
- Darker light band `.band-light.band-shade` (global.css, paper #e8e8e8 vs #ededed; Kudos
  #f5f5f5 vs #fafafa) on Services, What Clients Say and Next Step (owner's pick). Featured,
  My Approach and FAQ stay #ededed.
- Kudos primary buttons (`.button.primary` in global.css): light gray `#e0e0e0` fill, corner
  crop-mark ticks (::before), dotted-colon ornament (::after, auto-hidden via `:has(.cta-dots)`
  when CtaArrow morph markup is embedded), `.accent` variant = seafoam fill. Homepage buttons
  embed `<CtaArrow className="button-cta">` for the dots-to-arrow morph; cookie banner excluded.
- Recent Posts section is now dark (band-light removed).

NOT yet done: inner pages (services, case studies, contact, blog) still old design;
push/deploy. New case studies added: Tink Recruitment
(technical SEO) + LegitFit (SaaS) — proof points are metric-free placeholders awaiting real
numbers. Testimonials 2 & 3 are "Your Name Here" placeholders.

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
