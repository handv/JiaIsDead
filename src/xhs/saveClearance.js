const W = 1080;
const H = 1440;
const FONT = '"Songti SC", "STSong", "Noto Serif CJK SC", "PingFang SC", "Hiragino Sans GB", serif';
const EDICT = '"Cover Xingkai", "Xingkai SC", "STXingkai", "华文行楷", "KaiTi", "STKaiti", "楷体", serif';
const MUTED = "#5a4630";
const CINNABAR = "#8f2d2a";
const INK = "#1a140e";
const GOLD = "#e8c56a";

function fillSpaced(ctx, text, cx, y, spacing) {
  const chars = [...text];
  const widths = chars.map((ch) => ctx.measureText(ch).width);
  const total = widths.reduce((sum, w) => sum + w, 0) + spacing * Math.max(chars.length - 1, 0);
  let x = cx - total / 2;
  const align = ctx.textAlign;
  ctx.textAlign = "left";
  for (let i = 0; i < chars.length; i += 1) {
    ctx.fillText(chars[i], x, y);
    x += widths[i] + spacing;
  }
  ctx.textAlign = align;
}

function fillVertical(ctx, text, x, y, maxH, size, letterEm = 0, lineEm = 1.45) {
  const step = size * (1 + letterEm);
  const colShift = size * lineEm;
  let cx = x;
  let cy = y;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const ch of [...String(text ?? "")]) {
    if (cy !== y && cy + size > y + maxH) {
      cx -= colShift;
      cy = y;
    }
    ctx.fillText(ch, cx, cy);
    cy += step;
  }
}

function strokeClouds(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(8, 58);
  ctx.bezierCurveTo(18, 40, 36, 40, 46, 58);
  ctx.bezierCurveTo(56, 38, 76, 38, 86, 58);
  ctx.bezierCurveTo(94, 46, 108, 46, 116, 58);
  ctx.bezierCurveTo(122, 50, 132, 50, 138, 60);
  ctx.moveTo(18, 62);
  ctx.bezierCurveTo(26, 54, 36, 54, 44, 62);
  ctx.bezierCurveTo(52, 52, 66, 52, 74, 62);
  ctx.bezierCurveTo(81, 55, 90, 55, 96, 63);
  ctx.moveTo(88, 22);
  ctx.bezierCurveTo(96, 8, 112, 8, 122, 22);
  ctx.bezierCurveTo(130, 10, 144, 10, 152, 24);
  ctx.stroke();
  ctx.restore();
}

function drawSilkGround(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const silk = ctx.createLinearGradient(x, y, x, y + h);
  silk.addColorStop(0, "#f0d078");
  silk.addColorStop(0.46, "#e0b84a");
  silk.addColorStop(1, "#d0a03c");
  ctx.fillStyle = silk;
  ctx.fillRect(x, y, w, h);

  const side = ctx.createLinearGradient(x, y, x + w, y);
  side.addColorStop(0, "rgba(143, 45, 42, 0.1)");
  side.addColorStop(0.1, "rgba(143, 45, 42, 0)");
  side.addColorStop(0.9, "rgba(47, 74, 68, 0)");
  side.addColorStop(1, "rgba(47, 74, 68, 0.1)");
  ctx.fillStyle = side;
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = "rgba(255, 244, 210, 0.14)";
  ctx.lineWidth = 1;
  const step = 4;
  for (let i = -h; i < w + h; i += step) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i - h, y + h);
    ctx.stroke();
  }

  const scale = w / 340;
  const tileW = 160 * scale;
  const tileH = 96 * scale;
  ctx.strokeStyle = "rgba(143, 45, 42, 0.16)";
  ctx.lineWidth = 1.1 * scale;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let ty = y - tileH * 0.2; ty < y + h; ty += tileH) {
    for (let tx = x - tileW * 0.1; tx < x + w; tx += tileW) {
      strokeClouds(ctx, tx, ty, scale);
    }
  }
  ctx.restore();
}

function pathRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.rect(x, y, w, h);
}

function drawRoller(ctx, x, y, w, h) {
  ctx.save();
  const wood = ctx.createLinearGradient(x, y, x + w, y);
  wood.addColorStop(0, "#1c120a");
  wood.addColorStop(0.45, "#3b2716");
  wood.addColorStop(1, "#120b06");
  ctx.fillStyle = wood;
  pathRoundRect(ctx, x, y, w, h, w / 2);
  ctx.fill();
  ctx.fillStyle = "#c9a24a";
  pathRoundRect(ctx, x + 4, y - 10, w - 8, 22, 8);
  ctx.fill();
  pathRoundRect(ctx, x + 4, y + h - 12, w - 8, 22, 8);
  ctx.fill();
  ctx.fillRect(x + 3, y + h * 0.18, w - 6, 8);
  ctx.fillRect(x + 3, y + h * 0.82, w - 6, 8);
  ctx.restore();
}

function letterEmOf(style) {
  const raw = style.letterSpacing;
  const size = parseFloat(style.fontSize);
  if (!raw || raw === "normal" || !size) return 0;
  return parseFloat(raw) / size;
}

function lineEmOf(style) {
  const raw = style.lineHeight;
  const size = parseFloat(style.fontSize);
  if (!raw || raw === "normal" || !size) return 1.45;
  const n = parseFloat(raw);
  if (!n) return 1.45;
  return raw.endsWith("px") || n > 4 ? n / size : n;
}

function drawLiveCols(ctx, silkX, silkY, silkW, silkH) {
  const face = document.querySelector(".clearance-scroll.is-open .clearance-face");
  if (!face) return false;
  const box = face.getBoundingClientRect();
  if (box.width < 80) return false;
  const sx = silkW / box.width;
  const sy = silkH / box.height;

  const paintCol = (el, color) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const size = parseFloat(style.fontSize) * sx;
    if (!size) return;
    ctx.fillStyle = color;
    ctx.font = `400 ${size}px ${EDICT}`;
    fillVertical(
      ctx,
      el.textContent.trim(),
      silkX + (rect.right - box.left) * sx - size / 2,
      silkY + (rect.top - box.top) * sy,
      rect.height * sy,
      size,
      letterEmOf(style),
      lineEmOf(style),
    );
  };

  paintCol(face.querySelector(".clearance-roast"), CINNABAR);
  paintCol(face.querySelector(".clearance-score span"), INK);
  paintCol(face.querySelector(".clearance-praise"), CINNABAR);

  const seal = face.querySelector(".clearance-seal");
  if (seal) {
    const rect = seal.getBoundingClientRect();
    const size = Math.min(rect.width * sx, rect.height * sy);
    ctx.save();
    ctx.translate(
      silkX + (rect.left - box.left + rect.width / 2) * sx,
      silkY + (rect.top - box.top + rect.height / 2) * sy,
    );
    ctx.rotate((-12 * Math.PI) / 180);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "#b4322a";
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeStyle = "rgba(240, 208, 120, 0.35)";
    ctx.lineWidth = Math.max(3, size * 0.05);
    ctx.strokeRect(-size / 2 + 6, -size / 2 + 6, size - 12, size - 12);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#f0d078";
    ctx.font = `400 ${size * 0.32}px ${EDICT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    fillSpaced(ctx, "已核", 0, 2, size * 0.04);
    ctx.restore();
  }
  return true;
}

function drawFallbackCols(ctx, verdict, silkX, silkY, silkW, silkH) {
  const scale = silkW / 340;
  const colsTop = silkY + 132 + 12 * scale;
  const colH = silkH * 0.48;
  const titleSize = 42 * scale;
  const commentSize = 13 * scale;
  const gap = 12 * scale;
  const cx = silkX + silkW / 2;
  const titleX = cx;
  const roastX = cx - titleSize / 2 - gap - commentSize / 2;
  const praiseX = cx + titleSize / 2 + gap + commentSize / 2;

  ctx.fillStyle = CINNABAR;
  ctx.font = `400 ${commentSize}px ${EDICT}`;
  if (verdict.roast) fillVertical(ctx, verdict.roast, roastX, colsTop, colH, commentSize, 0.1);
  if (verdict.praise) fillVertical(ctx, verdict.praise, praiseX, colsTop, colH, commentSize, 0.1);

  ctx.fillStyle = INK;
  ctx.font = `400 ${titleSize}px ${EDICT}`;
  fillVertical(ctx, verdict.title ?? "", titleX, colsTop, colH, titleSize, 0.24, 1.24);

  const sealSize = 64 * scale;
  ctx.save();
  ctx.translate(silkX + silkW - 28 * scale - sealSize / 2, colsTop + silkH * 0.58 - 8 * scale - sealSize / 2);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "#b4322a";
  ctx.fillRect(-sealSize / 2, -sealSize / 2, sealSize, sealSize);
  ctx.strokeStyle = "rgba(240, 208, 120, 0.35)";
  ctx.lineWidth = 4;
  ctx.strokeRect(-sealSize / 2 + 6, -sealSize / 2 + 6, sealSize - 12, sealSize - 12);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#f0d078";
  ctx.font = `400 ${20 * scale}px ${EDICT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fillSpaced(ctx, "已核", 0, 2, 8);
  ctx.restore();
}

export function drawClearanceCard(verdict) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = "#6e5a3c";
  ctx.fillRect(0, 0, W, H);

  const silkX = 118;
  const silkY = 56;
  const silkW = 844;
  const silkH = 1328;
  const rollerW = 44;

  drawRoller(ctx, silkX - rollerW + 8, silkY - 16, rollerW, silkH + 32);
  drawRoller(ctx, silkX + silkW - 8, silkY - 16, rollerW, silkH + 32);

  drawSilkGround(ctx, silkX, silkY, silkW, silkH);

  ctx.strokeStyle = "rgba(143, 45, 42, 0.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(silkX + 22, silkY + 22, silkW - 44, silkH - 44);

  ctx.fillStyle = "#1a3344";
  ctx.fillRect(silkX, silkY, silkW, 132);
  ctx.fillStyle = GOLD;
  ctx.font = `500 40px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fillSpaced(ctx, "贾宝玉一家被抄了", W / 2, silkY + 48, 10);
  ctx.font = `400 28px ${FONT}`;
  ctx.fillStyle = "#cbb896";
  fillSpaced(ctx, "锦衣卫叙功札", W / 2, silkY + 100, 12);

  if (!drawLiveCols(ctx, silkX, silkY, silkW, silkH)) {
    drawFallbackCols(ctx, verdict, silkX, silkY, silkW, silkH);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = MUTED;
  ctx.font = `400 28px ${FONT}`;
  ctx.fillText(
    `检索 ${verdict.searchCount} 次 · 案卷 ${verdict.paperCount}/${verdict.paperTotal} · 改格 ${verdict.reviseCount} 次`,
    W / 2,
    silkY + silkH - 118,
  );
  ctx.fillText("你叙的是哪一职？", W / 2, silkY + silkH - 64);

  return canvas;
}

function callBridge(api, payload, { timeout = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(value);
    };
    try {
      const ret = api({
        ...payload,
        success: (res) => finish(null, res),
        fail: (err) => finish(err || new Error("bridge-fail")),
      });
      if (ret && typeof ret.then === "function") {
        ret.then(
          (res) => finish(null, res),
          (err) => finish(err),
        );
      }
    } catch (err) {
      finish(err);
    }
    if (timeout > 0) {
      setTimeout(() => finish(new Error("timeout")), timeout);
    }
  });
}

function clip(text, max) {
  const chars = [...String(text ?? "")];
  return chars.length <= max ? chars.join("") : chars.slice(0, max).join("");
}

async function resolveAlbumFilePath(dataUrl) {
  const write = window.xhs?.miniTool?.writeTempFile;
  if (typeof write === "function") {
    const res = await callBridge(write, { data: dataUrl });
    if (res?.filePath) return res.filePath;
  }
  return dataUrl;
}

async function clearanceImageUrl(verdict) {
  if (document.fonts) {
    try {
      await document.fonts.ready;
      await document.fonts.load(`42px "Cover Xingkai"`);
    } catch {
      /* use fallback stack */
    }
  }
  const dataUrl = drawClearanceCard(verdict).toDataURL("image/png");
  return resolveAlbumFilePath(dataUrl);
}

function noteCopy(verdict) {
  const lines = [
    `查完贾府，锦衣卫叙我${verdict.title}。`,
    verdict.praise,
    verdict.roast,
    `检索 ${verdict.searchCount} 次 · 案卷 ${verdict.paperCount}/${verdict.paperTotal} · 改格 ${verdict.reviseCount} 次`,
    "你叙的是哪一职？",
  ];
  return clip(lines.filter(Boolean).join("\n"), 1000);
}

export async function saveClearanceToAlbum(verdict) {
  const save = window.xhs?.miniTool?.saveImageToPhotosAlbum;
  if (typeof save !== "function") {
    return { ok: false, message: "此容器不能直接存相册，请截图保存。" };
  }
  try {
    const filePath = await clearanceImageUrl(verdict);
    await callBridge(save, { filePath });
    return { ok: true, message: "已保存到相册。" };
  } catch (err) {
    if (err?.message === "no-bridge") {
      return { ok: false, message: "此容器不能直接存相册，请截图保存。" };
    }
    return { ok: false, message: "未能保存。请允许保存图片和视频，或截图保存。" };
  }
}

export async function postClearanceNote(verdict) {
  const post = window.xhs?.miniTool?.postNote;
  if (typeof post !== "function") {
    return { ok: false, message: "此容器不能发笔记，请截图后自行发。" };
  }
  try {
    const url = await clearanceImageUrl(verdict);
    await callBridge(
      post,
      {
        title: clip('贾宝玉一家被抄了', 20),
        content: noteCopy(verdict),
        tags: "#贾宝玉一家被抄了",
        mediaInfo: {
          image_resources: [{url}],
        },
      },
      {timeout: 0},
    )
    return { ok: true, message: "已打开发布页，可继续编辑。" };
  } catch {
    return { ok: false, message: "未能发笔记。可改截图发布。" };
  }
}
