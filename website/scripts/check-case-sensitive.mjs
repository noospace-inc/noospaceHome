import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0").filter(Boolean);
const trackedSet = new Set(tracked);
const errors = [];
const lowercasePaths = new Map();
for (const file of tracked) {
  const key = file.toLowerCase();
  const existing = lowercasePaths.get(key);
  if (existing && existing !== file) errors.push(`Case-only filename collision: '${existing}' and '${file}'`);
  lowercasePaths.set(key, file);
}
const sourceFiles = tracked.filter((file) => /\.(?:[cm]?[jt]sx?|css)$/.test(file));
const extensions = ["", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".json", ".css", ".svg", ".png", ".webp", ".jpg", ".jpeg", ".otf", ".ttf"];

function checkModule(from, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return;
  const base = specifier.startsWith("@/") ? specifier.slice(2) : path.posix.join(path.posix.dirname(from), specifier);
  const candidates = extensions.map((ext) => `${base}${ext}`).concat(extensions.map((ext) => `${base}/index${ext}`));
  if (candidates.some((candidate) => trackedSet.has(candidate))) return;
  const existing = candidates.find((candidate) => existsSync(path.join(root, candidate)));
  errors.push(`${from}: unresolved or untracked import '${specifier}'${existing ? ` (exists but is not tracked: ${existing})` : ""}`);
}

for (const file of sourceFiles) {
  const text = readFileSync(path.join(root, file), "utf8");
  for (const match of text.matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\()\s*["']([^"']+)["']/g)) checkModule(file, match[1]);
  for (const match of text.matchAll(/(?:url\(\s*["']?|(?:src|href)\s*=\s*["'])\/(?!\/)([^"')\s]+)["']?\)?/g)) {
    const asset = `public/${match[1]}`;
    if (!trackedSet.has(asset)) errors.push(`${file}: unresolved or untracked public asset '/${match[1]}'`);
  }
}

const riskyNames = tracked.filter((file) => /^(?:public|app|components)\//.test(file) && /[^a-zA-Z0-9_./-]/.test(file));
for (const file of riskyNames) errors.push(`${file}: filename contains spaces, special, or non-ASCII characters`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Checked ${sourceFiles.length} tracked source files and ${tracked.length} tracked paths for case-sensitive imports and public assets.`);
