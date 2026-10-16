import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appPath = join(root, "src/App.jsx");
const storagePath = join(root, "src/game/storage.js");

if (!existsSync(appPath) || !existsSync(storagePath)) {
  throw new Error("找不到 App.jsx 或 storage.js，请先 npm run sync");
}

let app = readFileSync(appPath, "utf8");
if (!app.includes("./xhs/seedClosed.js")) {
  app = app.replace(
    '} from "./game/storage.js";\n',
    '} from "./game/storage.js";\nimport { seedClosedCase } from "./xhs/seedClosed.js";\n',
  );
}
if (!app.includes("seedClosedCase()")) {
  app = app.replace(
    "const saved = useMemo(() => loadState(), []);",
    "const saved = useMemo(() => loadState() ?? seedClosedCase(), []);",
  );
}
if (!app.includes("seedClosedCase()")) {
  throw new Error("未能写入已结案种子");
}
writeFileSync(appPath, app);

let storage = readFileSync(storagePath, "utf8");
storage = storage.replace(
  'const KEY = "jia-clan-v17";',
  'const KEY = "jia-clan-v18-inspect";',
);
if (!storage.includes("jia-clan-v18-inspect")) {
  throw new Error("未能改检验包存档键");
}
writeFileSync(storagePath, storage);

console.log("已写入检验用已结案进度（空档时自动满谱）");
