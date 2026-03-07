# Hey Genyl Portfolio

Astro 6 beta portfolio starter for an SEO specialist and WordPress designer/developer.

## What is included

- Homepage tuned around `freelance SEO specialist`
- Services hub plus six service-detail pages
- Case studies hub plus five niche-specific case study pages
- Tools hub with three starter SEO tools
- Blog hub with collection-based posts and RSS
- Static-friendly contact flow for shared hosting
- Sitemap and robots.txt ready for Hostinger-style deployment

## Stack

- Astro `6.0.0-beta.20`
- Tailwind CSS 4 via the Vite plugin
- Astro content collections for the blog
- `@astrojs/sitemap`
- `@astrojs/mdx`
- custom `rss.xml` route

## Run locally

```sh
npm install
npm run dev
```

Build and preview:

```sh
npm run build
npm run preview
```

## Main folders

- `src/pages`: routes for homepage, services, case studies, tools, blog, and contact
- `src/content/blog`: blog posts
- `src/data/site.ts`: service, case study, and tool metadata
- `src/components`: layout and page-building components
- `public`: static assets, robots.txt, share image, and upload folder

## Visual editor option

This repo includes a `.pages.yml` file for Pages CMS. If you connect the repository to Pages CMS later, you can edit blog posts through a visual interface while still keeping the content in Git.

## Deployment for Hostinger shared hosting

1. Run `npm run build`.
2. Upload the contents of `dist/` to `public_html/`.
3. Make sure your live domain matches the `site` value in `astro.config.mjs`.
4. Verify:
   - `https://yourdomain.com/robots.txt`
   - `https://yourdomain.com/sitemap-index.xml`
   - blog pages
   - service pages
   - tool pages

## Important note

This project uses Astro 6 beta because that was explicitly requested. If you want the safer production path later, the structure is simple enough to migrate back to the current Astro 5 stable line.
