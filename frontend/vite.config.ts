import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { reactClickToComponent } from "vite-plugin-react-click-to-component";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [[require.resolve("@locator/babel-jsx"), { env: "development" }]],
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      srcDir: "src",
      filename: "sw.ts",
      strategies: "injectManifest",
      devOptions: {
        enabled: false,
      },
      includeAssets: ["icons/*.svg", "icons/*.png"],
      manifest: {
        name: "Moodly — дневник настроения",
        short_name: "Moodly",
        description: "Простой дневник настроения и практик ментального здоровья",
        theme_color: "#8B5CF6",
        background_color: "#f5f0ff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "ru",
        icons: [
          {
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/icons/icon-180.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
        categories: ["health", "lifestyle", "productivity"],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
    reactClickToComponent(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@moodly/shared": path.resolve(__dirname, "../shared/dist/index.js"),
      // lottie-react: Vite резолвит поле `browser` (UMD-сборку), где default-экспорт —
      // объект, а не компонент → «Element type is invalid». Направляем на ESM-сборку.
      "lottie-react": path.resolve(__dirname, "node_modules/lottie-react/build/index.es.js"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("@nivo/")) return "vendor-charts";
          if (id.includes("lottie-react")) return "vendor-anim";
          if (id.includes("clsx") || id.includes("tailwind-merge")) return "vendor-ui";
          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("@tanstack/react-query")
          ) {
            return "vendor-react";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
