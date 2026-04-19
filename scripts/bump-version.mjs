import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pkgPath = join(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

const parts = String(pkg.version)
  .split(".")
  .map((part) => Number.parseInt(part, 10));

if (
  parts.length !== 3 ||
  parts.some((part) => Number.isNaN(part) || part < 0)
) {
  throw new Error(
    `Unsupported version format "${pkg.version}". Expected semver like 0.0.2.`
  );
}

parts[2] += 1;
pkg.version = parts.join(".");

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Version updated to: ${pkg.version}`);
