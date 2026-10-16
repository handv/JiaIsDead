import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const zipPath = join(root, process.env.XHS_ZIP_NAME || "jia-clan-xhs-tool.zip");

const html = readFileSync(join(dist, "index.html"), "utf8");
const banned = [
  /<script(?![^>]*\bsrc=)[^>]*>/i,
  /\son\w+\s*=/,
  /javascript:/i,
  /https?:\/\//i,
  /<base\s/i,
  /<iframe/i,
  /<object/i,
  /type=["']module["']/,
  /modulepreload/,
];

const packed = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <title>贾氏两府清查案</title>
  <link rel="stylesheet" href="./assets/style.css" />
</head>
<body>
  <div id="root"></div>
  <script src="./assets/main.js"></script>
</body>
</html>
`;

const jsPath = join(dist, "assets/main.js");
writeFileSync(
  jsPath,
  readFileSync(jsPath, "utf8").replaceAll("https://react.dev/errors/", "./react-errors/"),
);
writeFileSync(join(dist, "index.html"), packed);

for (const name of readdirSync(dist, { recursive: true })) {
  if (name.endsWith(".map") || name === ".DS_Store") {
    unlinkSync(join(dist, name));
  }
}

const files = [
  packed,
  readFileSync(join(dist, "assets/main.js"), "utf8"),
  readFileSync(join(dist, "assets/style.css"), "utf8"),
].join("\n");

for (const pattern of banned) {
  if (pattern.test(packed) && pattern.source !== "https?:\\/\\/") {
    throw new Error(`打包失败：入口 HTML 命中 ${pattern}`);
  }
}

if (/<script src="https?:/.test(files) || /url\(\s*https?:/.test(files)) {
  throw new Error("打包失败：仍有外部资源引用");
}
if (/\beval\s*\(|new Function\s*\(/.test(files)) {
  throw new Error("打包失败：含 eval / new Function");
}

try {
  unlinkSync(zipPath);
} catch {
  /* first build */
}

execFileSync("zip", ["-r", zipPath, "index.html", "assets", "-x", "*.DS_Store"], { cwd: dist });

const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
if (!listing.includes("index.html") || listing.includes("dist/index.html")) {
  throw new Error("打包失败：zip 根目录没有 index.html");
}

const bytes = Number(execFileSync("stat", ["-f", "%z", zipPath], { encoding: "utf8" }).trim());
const kb = (bytes / 1024).toFixed(1);
console.log(`已生成 ${zipPath}（${kb} KB）`);
if (bytes > 2 * 1024 * 1024) {
  console.warn("体积超过推荐 2MB，上传前请再压一压。");
}
