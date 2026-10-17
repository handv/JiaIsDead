export default function Desk({
  items,
  onOpen,
  caseClosed = false,
  clueNotice = null,
  onOpenClue,
  lede: ledeProp,
  title = "公案桌",
  onOpenTree,
  readIds = [],
  peopleCompleteIds = [],
}) {
  const read = new Set(readIds);
  const peopleDone = new Set(peopleCompleteIds);
  const lede =
    ledeProp ??
    (caseClosed
      ? "谱齐了。抄家的单子也对上了。"
      : "人名检索入档后才有。职分对事迹填。单击带线的词查档；点「摘」收入摘录。");

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="lede">{lede}</p>
      {onOpenTree ? (
        <p className="lede">
          <button className="text-btn" type="button" onClick={onOpenTree}>
            去族谱
          </button>
        </p>
      ) : null}
      {clueNotice?.fresh &&
      clueNotice.evidenceId &&
      clueNotice.title &&
      onOpenClue ? (
        <p className="banner ok">
          <button
            className="text-btn banner-link"
            type="button"
            onClick={() => onOpenClue(clueNotice.evidenceId)}
          >
            查看：{clueNotice.title}
          </button>
        </p>
      ) : clueNotice?.text ? (
        <p className={caseClosed ? "banner ok" : "banner"}>
          {clueNotice.text}
        </p>
      ) : null}
      <div className="desk-grid">
        {items.map((item) => {
          const isRead = read.has(item.id);
          const done = isRead && peopleDone.has(item.id);
          const classes = [
            "paper-card",
            isRead ? "read" : "",
            done ? "people-done" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={item.id}
              className={classes}
              onClick={() => onOpen(item.id)}
              type="button"
            >
              <span className="kind">{item.kind}</span>
              <strong>{item.title}</strong>
              {done ? (
                <span className="jia-person-plaque">已入档</span>
              ) : null}
              <span className="card-foot">{item.body[0]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
