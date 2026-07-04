import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const allowedServicePaths = new Set([
  "/services/seo/",
  "/services/seo/local-seo/",
  "/services/seo/technical-seo/",
  "/services/seo/wordpress-seo/",
  "/services/web-design/",
  "/services/web-design/wordpress-web-design/",
]);

export default defineConfig({
  site: "https://heygenyl.com",
  output: "static",
  trailingSlash: "always",
  // Legacy service URLs → new /services/seo/ + /services/web-design/ structure.
  // Production 301s are enforced by public/.htaccess; these keep dev/preview in sync.
  redirects: {
    "/services/seo-specialist/": "/services/seo/",
    "/services/local-seo/": "/services/seo/local-seo/",
    "/services/wordpress-seo-expert/": "/services/seo/wordpress-seo/",
  },
  build: {
    inlineStylesheets: "always",
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const path = page.startsWith("http")
          ? new URL(page).pathname
          : page;
        if (path.startsWith("/services/")) {
          return allowedServicePaths.has(path);
        }
        return true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    css: {
      transformer: "lightningcss",
    },
    build: {
      cssMinify: "lightningcss",
      target: "es2022",
      rollupOptions: {
        output: {
          assetFileNames: (info) => {
            const raw = (info.names?.[0] ?? "asset").replace(/@/g, "_");
            const name = raw.replace(/\.[^.]+$/, "");
            return `_astro/${name}.[hash][extname]`;
          },
        },
      },
    },
  },
});
