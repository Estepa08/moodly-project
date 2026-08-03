import { existsSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const link = path.resolve(__dirname, "../node_modules/@moodly/shared");
const target = "../../../shared";
const expected = path.resolve(path.dirname(link), target);

let ok = false;
if (existsSync(link)) {
  try {
    ok = realpathSync(link) === expected;
  } catch {
    ok = false;
  }
}
if (!ok) {
  rmSync(link, { force: true });
  symlinkSync(target, link, "dir");
}
