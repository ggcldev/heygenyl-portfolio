# QA Fix TODO

Use this as the implementation checklist before deployment.

## Must Fix Before Launch

- [x] Upgrade Astro and official integrations to the latest verified Astro versions for this repo.
  - Files: `package.json`, `package-lock.json`
  - Verified target versions on March 12, 2026:
    - `astro`: `6.0.3`
    - `@astrojs/mdx`: `5.0.0`
    - `@astrojs/sitemap`: `3.7.1`
  - Current repo versions after upgrade:
    - `astro`: `6.0.3`
    - `@astrojs/mdx`: `5.0.0`
    - `@astrojs/sitemap`: `3.7.1`
  - Keep the Astro core package and official integrations aligned to the same current release generation.
  - Verified: `astro check` passes and `npm run build` passes after the upgrade.

- [x] Add a real TypeScript/Astro typecheck gate.
  - Files: `package.json`
  - Added `typescript` and `@astrojs/check`.
  - Added a `check` script.
  - Updated the release path to run `astro check && astro build`.
  - Note: `npm audit` currently reports 5 moderate advisories in the dev-only `@astrojs/check` language-server chain.

- [x] Replace the `mailto:` contact form flow with a real submission flow.
  - Files: `src/pages/contact.astro`, `src/pages/contact/thanks.astro`, `src/scripts/contact-form.ts`, `tests/contact-form.test.ts`, `public/.htaccess`
  - Defaulted the static-hosting flow to FormSubmit with progressive enhancement and an on-site thank-you page.
  - Direct email remains available as a secondary fallback.
  - CSP now allows the external form endpoint used by the contact page.

- [x] Fix article social sharing images.
  - Files: `src/components/BaseHead.astro`, `src/layouts/BaseLayout.astro`, `src/pages/blog/[slug].astro`, `public/og-default.svg`, `public/og-default.png`
  - Blog posts now pass their hero image into `og:image` and `twitter:image`.
  - Added `og:image:alt` and `twitter:image:alt`.
  - Added a raster PNG fallback and fixed the source SVG markup.

- [x] Finish the `/tools` removal across the whole repo.
  - Files: `astro.config.mjs`, `README.md`, `PRELAUNCH-CHECKLIST.md`, `src/data/site.ts`, `src/pages/index.astro`
  - Removed stale tool references from docs, checklist items, homepage copy, and sitemap config.
  - Deleted dead tool metadata and the unused `homeStats` export.

## Accessibility Fixes

- [x] Make the mobile nav behave like a proper accessible dialog.
  - File: `src/components/Header.astro`
  - Replaced `aria-pressed` with `aria-expanded`.
  - Added `aria-controls`, `aria-haspopup`, and `aria-modal`.
  - Focus now moves into the dialog, stays trapped while open, and restores correctly on close.
  - Background content is marked inert while the mobile dialog is open.

- [x] Preserve native anchor behavior in the blog table of contents.
  - File: `src/components/PostToc.astro`
  - TOC links now update the URL hash.
  - Focus moves to the heading target after navigation.
  - Smooth scrolling is preserved while back/forward hash navigation still works.

## Security Hardening

- [x] Add basic security headers for Apache deployment.
  - File: `public/.htaccess`
  - Added:
    - `Content-Security-Policy`
    - `X-Content-Type-Options`
    - `Referrer-Policy`
    - `X-Frame-Options`
  - CSP is currently rollout-safe for the existing inline scripts and Google Fonts setup.

- [x] Harden JSON-LD rendering.
  - File: `src/components/JsonLd.astro`
  - Serialized JSON-LD now escapes unsafe characters before `set:html`.

## Testing and CI

- [x] Add automated tests for the interactive features.
  - Suggested scope:
    - mobile navigation
    - homepage tab interaction
    - blog TOC interaction
    - contact form submission path
  - Remaining gap:
    - homepage featured-project interaction

- [x] Expand CI beyond Lighthouse-only checks.
  - Files: `.github/workflows/lighthouse-ci.yml`, `package.json`
  - Added an explicit `npm run check` step to CI before the build.
  - Added `npm run test` to CI.

- [x] Expand Lighthouse coverage.
  - Files: `lighthouserc.json`
  - Added:
    - one service detail page
    - one blog detail page

## Code Quality and Maintainability

- [x] Refactor large inline browser scripts into typed modules or islands.
  - Files: `src/pages/index.astro`, `src/components/Header.astro`, `src/components/PostToc.astro`, `src/pages/contact.astro`
  - Moved the inline browser logic into typed modules under `src/scripts/`.

- [x] Tighten TypeScript safety settings where practical.
  - File: `tsconfig.json`
  - Enabled:
    - `noUncheckedIndexedAccess`
    - `exactOptionalPropertyTypes`
    - `noImplicitReturns`
  - Fixed the resulting Astro/TypeScript issues so `astro check` still passes.

- [x] Remove dead or stale code/data now that tools are gone.
  - File: `src/data/site.ts`
  - Removed:
    - `homeStats`
    - `toolPages`
    - `getToolBySlug`

- [x] Clean up tracked QA artifacts that should not live in source control.
  - Paths: `.lighthouseci/`
  - Ignored generated Lighthouse HTML/JSON reports so CI can still run without committing report artifacts.

## CMS and Content Model Cleanup

- [x] Align Pages CMS config with the actual blog schema.
  - Files: `.pages.yml`, `src/content.config.ts`
  - Added support for:
    - `metaTitle`
    - `slug`
    - `image`
    - `imageAlt`
  - Updated the collection to use nested folders, slug-based filenames, tree view, and a markdown code editor that matches the current content layout.

- [ ] Review all current blog posts for final metadata quality.
  - Paths: `src/content/blog/`
  - Left as a manual owner review only.
  - Do not change blog post titles or article copy unless explicitly requested.

## Nice-to-Fix Before or Shortly After Launch

- [x] Keep current social metadata as-is.
  - File: `src/components/BaseHead.astro`
  - No extra social tags are needed beyond the current setup.

- [ ] Split or simplify the homepage interaction script if future changes are planned.
  - File: `src/scripts/homepage.ts`
  - This module is now the largest and most runtime-heavy client-side surface in the repo.

- [x] Keep documentation in sync with the current architecture.
  - Files: `README.md`, `PRELAUNCH-CHECKLIST.md`
  - Removed the stale `/tools` references after the route cleanup.

## Suggested Execution Order

1. Upgrade Astro packages to `astro@6.0.3`, `@astrojs/mdx@5.0.0`, and `@astrojs/sitemap@3.7.1`.
2. Add `astro check` and CI typecheck coverage.
3. Replace the contact form submission flow.
4. Fix social metadata and sharing images.
5. Finish `/tools` cleanup.
6. Fix mobile nav accessibility.
7. Fix TOC hash/focus behavior.
8. Add security headers and JSON-LD hardening.
9. Add automated smoke or E2E coverage.
10. Clean up docs, CMS config, and dead code.
