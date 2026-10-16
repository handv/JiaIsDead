import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const game = join(root, "../jia-clan");
const dist = join(game, "dist");
const zipPath = join(root, process.env.ITCH_ZIP_NAME || "jia-clan-itch.zip");

if (!existsSync(join(game, "package.json"))) {
  throw new Error("找不到 ../jia-clan。itch 包从主项目 Vite 产物打出，不要用小红书 IIFE 包。");
}

execFileSync("npm", ["run", "build"], { cwd: game, stdio: "inherit" });

if (!existsSync(join(dist, "index.html"))) {
  throw new Error("打包失败：jia-clan/dist 没有 index.html");
}

for (const name of readdirSync(dist, { recursive: true })) {
  if (name.endsWith(".map") || name.endsWith(".DS_Store")) {
    unlinkSync(join(dist, name));
  }
}

try {
  unlinkSync(zipPath);
} catch {
  /* first build */
}

execFileSync("zip", ["-r", zipPath, ".", "-x", "*.DS_Store", "*.map"], { cwd: dist });

const listing = execFileSync("unzip", ["-l", zipPath], { encoding: "utf8" });
if (!listing.includes("index.html") || listing.includes("dist/index.html")) {
  throw new Error("打包失败：zip 根目录没有 index.html");
}

const bytes = Number(execFileSync("stat", ["-f", "%z", zipPath], { encoding: "utf8" }).trim());
const mb = (bytes / 1024 / 1024).toFixed(1);
console.log(`已生成 ${zipPath}（${mb} MB）`);
console.log("上传 itch.io：Kind 选 HTML，勾 Embed in page。");
