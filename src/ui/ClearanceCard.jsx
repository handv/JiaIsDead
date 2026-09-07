export default function ClearanceCard({ verdict, onClose }) {
  if (!verdict) return null;
  return (
    <div className="clearance-mask">
      <article className="clearance-card">
        <p className="clearance-name">贾宝玉一家被抄了</p>
        <p className="clearance-kicker">你对红楼梦的熟悉度</p>
        <p className="clearance-score">{verdict.familiarity}%</p>
        <p className="clearance-title">{verdict.title}</p>
        <p className="clearance-stats">
          检索 {verdict.searchCount} 次 · 案卷 {verdict.paperCount}/{verdict.paperTotal} · 改格{" "}
          {verdict.reviseCount} 次
        </p>
        {verdict.weakness ? <p className="clearance-weak">{verdict.weakness}</p> : null}
        <p className="clearance-seal">已核</p>
        <p className="clearance-foot">评论区报数。你能超过吗？</p>
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
