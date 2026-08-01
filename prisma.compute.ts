import { defineComputeConfig } from "@prisma/compute-sdk/config";

export default defineComputeConfig({
  app: {
    name: "moodly",
    root: "backend",
    framework: "custom",
    httpPort: 3002,
    build: {
      command: "npm ci && npx prisma generate && npm run build",
      outputDirectory: "dist",
      entrypoint: "index.js",
    },
  },
});
