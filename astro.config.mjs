import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const allowedServicePaths = new Set([
  "/services/seo-specialist/",
  "/services/local-seo/",
  "/services/wordpress-seo-expert/",
]);
const allowedToolPaths = new Set(["/tools/"]);

export default defineConfig({
  site: "https://heygenyl.com",
  output: "static",
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
        if (path.startsWith("/tools/")) {
          return allowedToolPaths.has(path);
        }
        return true;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
