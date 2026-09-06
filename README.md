# Hey Genyl Portfolio

Astro 6 portfolio starter for an SEO specialist and WordPress designer/developer.

## What is included

- Homepage tuned around `freelance SEO specialist`
- Services hub plus three active service-detail pages
- Case studies hub plus three niche-specific case study pages
- Blog hub with collection-based posts and RSS
- Browser-based contact flow for shared hosting
- Sitemap and robots.txt ready for Hostinger-style deployment

## Stack

- Astro `6.0.3`
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

- `src/pages`: routes for homepage, services, case studies, blog, and contact
- `src/content/blog`: blog posts
- `src/data/site.ts`: service and case study metadata
- `src/components`: layout and page-building components
- `public`: static assets, robots.txt, share image, and upload folder

## Visual editor option

This repo includes a `.pages.yml` file for Pages CMS. If you connect the repository to Pages CMS later, you can edit blog posts through a visual interface while still keeping the content in Git.

## Optional contact form overrides

The contact page works out of the box on static hosting by posting to FormSubmit using the email in `src/data/site.ts`. By default it uses FormSubmit's native verification challenge to reduce spam. If you want to swap providers later, copy `.env.example` to `.env` and set:

- `PUBLIC_CONTACT_FORM_PROVIDER`
- `PUBLIC_CONTACT_FORM_ENDPOINT`
- `PUBLIC_CONTACT_FORM_AJAX_ENDPOINT`

Leave `PUBLIC_CONTACT_FORM_AJAX_ENDPOINT` unset if you want FormSubmit's native verification flow. Set it only if you explicitly want AJAX submissions.

## Deployment (automatic on every push to `main`)

You do not upload anything by hand. Every commit pushed to `main` runs
`.github/workflows/deploy.yml`, which:

1. Installs dependencies with `npm ci` on Node 22.
2. Runs `npm run build` (Astro check + build into `dist/`).
3. Uploads `dist/` to Hostinger `public_html/` over FTPS
   (`SamKirkland/FTP-Deploy-Action`).
4. **Purges the Cloudflare cache automatically** (`purge_everything`) so the new build
   is served right away.

The workflow can also be triggered manually from the GitHub Actions tab
(`workflow_dispatch`).

Secrets it needs, stored in GitHub → Settings → Secrets and variables → Actions:

- `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD` (Hostinger FTP account)
- `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` (token needs Zone → Cache Purge permission)
- Variable `PUBLIC_TURNSTILE_SITE_KEY` (contact form Turnstile)

These live on GitHub, not in the repo, so a fresh clone deploys without any local setup.

### Manual Cloudflare purge

`scripts/purge-cache.sh` purges Cloudflare on demand from your machine. It reads
`CLOUDFLARE_ZONE_ID` and `CLOUDFLARE_API_TOKEN` from a local `.env` (copy `.env.example`,
fill in the two values; `.env` is gitignored).

```sh
bash scripts/purge-cache.sh
```

### If the live site still looks stale after a deploy

heygenyl.com sits behind two CDN layers: Cloudflare, and Hostinger's own CDN underneath it.
The deploy purges only Cloudflare. If a page or `sitemap-0.xml` is still old after a green
deploy, purge Hostinger's layer first (hPanel → Websites → Manage → Advanced → Cache Manager →
Purge all), then run the Cloudflare purge script or re-run the deploy workflow. Full notes are in
`CLAUDE.md`.

After deploying, verify:

- `https://heygenyl.com/robots.txt`
- `https://heygenyl.com/sitemap-index.xml`
- blog, service, and case study pages
- contact form submission and `/contact/thanks/`

## Important note

This project tracks the current Astro 6 release line. Re-run `npm run check`, `npm test`, and `npm run build` after future upgrades so template and content changes stay verified.
