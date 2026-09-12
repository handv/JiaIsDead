import { useEffect, useRef, useState } from "react";

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

export default function ClearanceCard({ verdict, onClose }) {
  const [open, setOpen] = useState(false);
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
                <p className="clearance-name">贾宝玉一家被抄了</p>
                <p className="clearance-kicker">锦衣卫叙功札</p>
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
                检索 {verdict.searchCount} 次 · 案卷 {verdict.paperCount}/{verdict.paperTotal} · 改格{" "}
                {verdict.reviseCount} 次
              </p>
              <p className="clearance-foot">你叙的是哪一职？</p>
            </div>
          </article>
          <ScrollRod />
        </div>
        <p className="hint clearance-hint">截图转发</p>
        {onClose ? (
          <button className="text-btn clearance-close" onClick={onClose} type="button">
            收起
          </button>
        ) : null}
      </div>
    </div>
  );
}
