import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const repoRoot = path.resolve(__dirname, '../../../');
const schemaPath = path.join(repoRoot, 'backend/prisma/schema.prisma');
const prismaBin = path.join(repoRoot, 'backend/node_modules/.bin/prisma');

const testDbUrl =
  process.env.TEST_DATABASE_URL ??
  (process.env.DATABASE_URL?.includes('moodly_test')
    ? process.env.DATABASE_URL
    : 'postgresql://evgeniystepanov@localhost:5432/moodly_test');

process.env.DATABASE_URL = testDbUrl;
process.env.DIRECT_URL = process.env.DIRECT_URL ?? testDbUrl;
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

beforeAll(async () => {
  execSync(
    `"${prismaBin}" db push --schema="${schemaPath}" --force-reset --accept-data-loss --skip-generate`,
    {
      cwd: repoRoot,
      env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDbUrl },
      stdio: 'inherit',
    },
  );
});
