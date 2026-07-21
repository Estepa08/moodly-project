import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://evgeniystepanov@localhost:5432/moodly_test";
process.env.JWT_SECRET = "test-secret";

beforeAll(async () => {
  const schemaPath = path.resolve(__dirname, "../../prisma/schema.prisma");
  execSync(`npx prisma db push --schema=${schemaPath} --force-reset --accept-data-loss --skip-generate`, {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    stdio: "inherit",
  });
});
