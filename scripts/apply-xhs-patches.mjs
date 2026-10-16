import { copyFileSync, existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const mainPath = join(root, "src/main.jsx");
const searchPath = join(root, "src/ui/SearchApp.jsx");
const cardPatch = join(root, "scripts/ClearanceCard.xhs.jsx");
const cardDest = join(root, "src/ui/ClearanceCard.jsx");
const telemetryPath = join(root, "src/telemetry.js");
const inkPath = join(root, "src/styles/ink-theme.css");
const interactionPath = join(root, "src/enhancements/interaction.js");

function silenceTelemetry(file) {
  let src = readFileSync(file, "utf8");
  const start = src.indexOf("export function track(");
  const end = src.indexOf("export function trackSessionStart(");
  if (start < 0 || end < 0) throw new Error("telemetry 结构变了，无法去掉联网");
  src = `${src.slice(0, start)}export function track() {}\n\n${src.slice(end)}`;
  if (/\bfetch\s*\(|sendBeacon/.test(src)) throw new Error("telemetry 仍有联网");
  writeFileSync(file, src);
}

function dropBundledFonts(file) {
  let css = readFileSync(file, "utf8");
  css = css.replace(/@font-face\s*\{[^}]*\.(?:ttf|otf)[^}]*\}\s*/g, "");
  writeFileSync(file, css);
  for (const name of ["NotoSerifSC.ttf", "MaShanZheng.ttf"]) {
    const font = join(root, "src/styles/fonts", name);
    if (existsSync(font)) unlinkSync(font);
  }
}

function dropClipboard(file) {
  let src = readFileSync(file, "utf8");
  src = src
    .replaceAll("await navigator.clipboard.writeText(text); copied=true;", "copied=false;")
    .replaceAll("copied=document.execCommand('copy');", "copied=false;");
  if (/navigator\.clipboard|execCommand\(\s*['"]copy['"]/.test(src)) {
    throw new Error("笔记复制仍调用了剪贴板");
  }
  writeFileSync(file, src);
}

if (existsSync(mainPath)) {
  let main = readFileSync(mainPath, "utf8");
  if (!main.includes("./styles/xhs.css")) {
    main = main.replace(
      'import "./styles/paper.css";',
      'import "./styles/paper.css";\nimport "./styles/xhs.css";',
    );
    writeFileSync(mainPath, main);
  }
}

if (existsSync(searchPath)) {
  let search = readFileSync(searchPath, "utf8");
  search = search
    .replaceAll('addEventListener("mousedown", hide)', 'addEventListener("pointerdown", hide)')
    .replaceAll(
      'removeEventListener("mousedown", hide)',
      'removeEventListener("pointerdown", hide)',
    );
  writeFileSync(searchPath, search);
}

if (existsSync(cardPatch) && existsSync(cardDest)) {
  copyFileSync(cardPatch, cardDest);
}

if (existsSync(telemetryPath)) silenceTelemetry(telemetryPath);
if (existsSync(inkPath)) dropBundledFonts(inkPath);
if (existsSync(interactionPath)) dropClipboard(interactionPath);
