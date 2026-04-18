import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const pkgPath = join(process.cwd(), "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));

// Append build timestamp to version for easy identification
const buildTime = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
pkg.version = `${pkg.version}-build-${buildTime}`;

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`Version updated to: ${pkg.version}`);