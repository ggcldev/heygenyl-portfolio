import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const allowedServicePaths = new Set([
  "/services/seo-specialist/",
  "/services/local-seo/",
  "/services/wordpress-seo-expert/",
]);

export default defineConfig({
  site: "https://heygenyl.com",
  output: "static",
  trailingSlash: "always",
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
