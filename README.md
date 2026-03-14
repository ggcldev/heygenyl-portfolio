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

## Deployment for Hostinger shared hosting

1. Run `npm run build`.
2. Upload the contents of `dist/` to `public_html/`.
3. Make sure your live domain matches the `site` value in `astro.config.mjs`.
4. If you keep the default FormSubmit integration on the contact page, approve the first live verification email FormSubmit sends to `siteConfig.email`.
5. Verify:
   - `https://yourdomain.com/robots.txt`
   - `https://yourdomain.com/sitemap-index.xml`
   - blog pages
   - service pages
   - case study pages
   - contact form submission and `/contact/thanks/`

## Important note

This project tracks the current Astro 6 release line. Re-run `npm run check`, `npm test`, and `npm run build` after future upgrades so template and content changes stay verified.
