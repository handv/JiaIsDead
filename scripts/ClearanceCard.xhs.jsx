import { useEffect, useRef, useState } from "react";
import { postClearanceNote, saveClearanceToAlbum } from "../xhs/saveClearance.js";

function ScrollRod() {
  return (
    <div className="clearance-roller" aria-hidden="true">
      <i className="clearance-ring clearance-ring-a" />
      <i className="clearance-ring clearance-ring-b" />
      <div className="clearance-tassel">
        <div className="clearance-knot" />
        <div className="clearance-threads">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="clearance-bead" />
      </div>
    </div>
  );
}

function reduceMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
}

export default function ClearanceCard({
  verdict,
  onClose,
  onOpenGarden,
  caseName = "贾宝玉一家被抄了",
  kicker = "锦衣卫叙功札",
  foot = "你叙的是哪一职？",
}) {
  const [open, setOpen] = useState(false);
  const [saveHint, setSaveHint] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    if (reduceMotion()) {
      setOpen(true);
      return undefined;
    }
    const id = window.setTimeout(() => setOpen(true), 360);
    return () => window.clearTimeout(id);
  }, []);

  if (!verdict) return null;

  function replay(event) {
    event.stopPropagation();
    if (busyRef.current || reduceMotion()) return;
    busyRef.current = true;
    setOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpen(true);
        window.setTimeout(() => {
          busyRef.current = false;
        }, 2100);
      });
    });
  }

  async function run(task, pending) {
    if (busy) return;
    setBusy(true);
    setSaveHint(pending);
    try {
      const result = await task(verdict);
      setSaveHint(result.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="clearance-mask"
      role="dialog"
      aria-modal="true"
      aria-labelledby="clearance-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && onClose) onClose();
      }}
    >
      <div className="clearance-stage">
        <div
          className={open ? "clearance-scroll is-open" : "clearance-scroll"}
          onClick={replay}
          title="点卷轴，再看一遍"
        >
          <ScrollRod />
          <article className="clearance-card">
            <div className="clearance-face">
              <header className="clearance-head">
                <p className="clearance-name">{caseName}</p>
                <p className="clearance-kicker">{kicker}</p>
              </header>
              <div className="clearance-cols">
                {verdict.roast ? <p className="clearance-col clearance-roast">{verdict.roast}</p> : null}
                <p className="clearance-col clearance-score" id="clearance-title">
                  <span>{verdict.title}</span>
                </p>
                {verdict.praise ? <p className="clearance-col clearance-praise">{verdict.praise}</p> : null}
                <p className="clearance-seal">已核</p>
              </div>
              <p className="clearance-stats">
                检索 {verdict.searchCount} 次 · 案卷 {verdict.paperCount}/{verdict.paperTotal}
                {verdict.reviseCount == null ? "" : ` · 改格 ${verdict.reviseCount} 次`}
              </p>
              <p className="clearance-foot">{foot}</p>
            </div>
          </article>
          <ScrollRod />
        </div>
        {saveHint ? <p className="hint clearance-hint">{saveHint}</p> : null}
        <div className="clearance-actions">
          {onOpenGarden ? (
            <button className="primary" onClick={onOpenGarden} type="button">
              开匣看园
            </button>
          ) : null}
          <button
            className="text-btn clearance-close"
            disabled={busy}
            onClick={() => run(saveClearanceToAlbum, "正在保存…")}
            type="button"
          >
            保存到相册
          </button>
          <button
            className="text-btn clearance-close"
            disabled={busy}
            onClick={() => run(postClearanceNote, "正在打开笔记…")}
            type="button"
          >
            发笔记
          </button>
          {onClose ? (
            <button className="text-btn clearance-close" onClick={onClose} type="button">
              收起
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
