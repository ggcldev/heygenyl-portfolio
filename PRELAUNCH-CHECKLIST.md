# Prelaunch Checklist

Use this before uploading the site to Hostinger. These items are based on the current repo state, not a generic Astro checklist.

## 1. Brand and Contact

- [ ] Replace the contact email in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) if `hello@heygenyl.com` is not your final inbox.
- [ ] Confirm `siteConfig.name`, `siteConfig.title`, `siteConfig.description`, and `siteConfig.location` in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) match the exact way you want to present yourself publicly.
- [ ] Decide whether the contact form should stay `mailto:` based or be replaced with a form endpoint such as FormSubmit/Basin in [src/pages/contact.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/contact.astro).

## 2. Metadata and SEO

- [ ] Review the default `<title>`, meta description, canonical, Open Graph, and Twitter card behavior in [src/components/BaseHead.astro](/Users/genylgicalde/heygenyl-portfolio/src/components/BaseHead.astro).
- [ ] Replace the default share image in [public/og-default.svg](/Users/genylgicalde/heygenyl-portfolio/public/og-default.svg). It still contains starter wording.
- [ ] Replace the default favicon in [public/favicon.svg](/Users/genylgicalde/heygenyl-portfolio/public/favicon.svg) if you want a custom personal mark instead of the current template asset.
- [ ] Review every page title and meta description in:
  - [src/pages/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/index.astro)
  - [src/pages/contact.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/contact.astro)
  - [src/pages/services/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/services/index.astro)
  - [src/pages/case-studies/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/case-studies/index.astro)
  - [src/pages/tools/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/tools/index.astro)
  - [src/pages/blog/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/blog/index.astro)
- [ ] Review the service page titles and meta descriptions in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) under `servicePages`.
- [ ] Review the case study page titles and meta descriptions in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) under `caseStudies`.
- [ ] Review the tools page titles and meta descriptions in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) under `toolPages`.
- [ ] Decide whether to add extra social metadata such as `twitter:site`, `twitter:creator`, and `og:locale` in [src/components/BaseHead.astro](/Users/genylgicalde/heygenyl-portfolio/src/components/BaseHead.astro).

## 3. Content and Messaging

- [ ] Replace the starter proof language on the homepage in [src/pages/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/index.astro), especially the “Before launch” card about replacing proof points.
- [ ] Replace the placeholder case study proof with real screenshots, metrics, and outcomes in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) under `caseStudies`.
- [ ] Review all `note`, `summary`, `deliverables`, `outcomes`, and FAQ copy in [src/data/site.ts](/Users/genylgicalde/heygenyl-portfolio/src/data/site.ts) so the service pages reflect your real offer and tone.
- [ ] Decide whether to keep the current tool messaging as-is or soften terms like “starter” where appropriate:
  - [src/pages/tools/index.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/tools/index.astro)
  - [src/pages/tools/schema-generator.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/tools/schema-generator.astro)
  - [src/pages/tools/meta-tag-analyzer.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/tools/meta-tag-analyzer.astro)
  - [src/pages/tools/404-checker.astro](/Users/genylgicalde/heygenyl-portfolio/src/pages/tools/404-checker.astro)

## 4. Blog Readiness

- [ ] Review the 3 current blog posts in [src/content/blog](/Users/genylgicalde/heygenyl-portfolio/src/content/blog) for tone, formatting, and internal links.
- [ ] Confirm every blog post has a strong `title`, `description`, `excerpt`, `pubDate`, and tags in [src/content.config.ts](/Users/genylgicalde/heygenyl-portfolio/src/content.config.ts) compatible frontmatter.
- [ ] Add at least 1-2 more launch-ready posts if you want the blog to feel more established on day one.
- [ ] Check the RSS feed output in [src/pages/rss.xml.js](/Users/genylgicalde/heygenyl-portfolio/src/pages/rss.xml.js) after your final content edits.

## 5. Technical Launch Checks

- [ ] Confirm the canonical site URL remains `https://heygenyl.com` in [astro.config.mjs](/Users/genylgicalde/heygenyl-portfolio/astro.config.mjs).
- [ ] Confirm [public/robots.txt](/Users/genylgicalde/heygenyl-portfolio/public/robots.txt) points to the final sitemap URL.
- [ ] Keep [public/.htaccess](/Users/genylgicalde/heygenyl-portfolio/public/.htaccess) in the uploaded build so `http` and `www` redirect to `https://heygenyl.com`.
- [ ] Run `npm run build` before deployment and upload the `dist` contents, not the `dist` folder itself.
- [ ] Test these live after deployment:
  - `https://heygenyl.com/`
  - `https://heygenyl.com/robots.txt`
  - `https://heygenyl.com/sitemap-index.xml`
  - `https://www.heygenyl.com/` redirecting to non-`www`
  - `http://heygenyl.com/` redirecting to `https`

## 6. Tracking and Search Console

- [ ] Add Google Search Console verification after the site is live.
- [ ] Submit `https://heygenyl.com/sitemap-index.xml` in Google Search Console.
- [ ] Decide whether to add analytics before launch. This is not wired yet.
- [ ] If you want analytics, add GA4 or a privacy-focused option such as Plausible in the shared layout/head:
  - [src/layouts/BaseLayout.astro](/Users/genylgicalde/heygenyl-portfolio/src/layouts/BaseLayout.astro)
  - [src/components/BaseHead.astro](/Users/genylgicalde/heygenyl-portfolio/src/components/BaseHead.astro)

## 7. Final Manual QA

- [ ] Check mobile layout on homepage, service pages, case studies, tools, blog, and contact.
- [ ] Test the schema generator copy button.
- [ ] Test the meta tag analyzer with a real page head snippet.
- [ ] Test the 404 checker on same-origin URLs after deployment.
- [ ] Check for broken internal links across `/services/`, `/case-studies/`, `/tools/`, and `/blog/`.
- [ ] Open page source on a few key URLs and verify:
  - correct title tag
  - correct meta description
  - correct canonical
  - correct Open Graph image
  - JSON-LD present where expected

## Recommended Order

1. Finalize brand/contact info.
2. Replace OG image and favicon.
3. Rewrite service and case study proof content.
4. Review all titles and meta descriptions.
5. QA blog/tool pages.
6. Build locally.
7. Deploy to Hostinger.
8. Verify redirects, sitemap, and Search Console.
