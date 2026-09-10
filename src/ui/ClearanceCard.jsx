export default function ClearanceCard({ verdict, onClose }) {
  if (!verdict) return null;
  return (
    <div className="clearance-mask">
      <article className="clearance-card">
        <p className="clearance-name">贾宝玉一家被抄了</p>
        <p className="clearance-kicker">锦衣卫叙功</p>
        <p className="clearance-score">{verdict.title}</p>
        <p className="clearance-stats">
          检索 {verdict.searchCount} 次 · 案卷 {verdict.paperCount}/{verdict.paperTotal} · 改格{" "}
          {verdict.reviseCount} 次
        </p>
        {verdict.praise ? <p className="clearance-praise">{verdict.praise}</p> : null}
        {verdict.roast ? <p className="clearance-roast">{verdict.roast}</p> : null}
        <p className="clearance-seal">已核</p>
        <p className="clearance-foot">你叙的是哪一职？</p>
        <p className="hint">截图转发</p>
        {onClose ? (
          <button className="text-btn" onClick={onClose} type="button">
            收起
          </button>
        ) : null}
      </article>
    </div>
  );
}
