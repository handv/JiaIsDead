export default function Desk({
  items,
  onOpen,
  caseClosed = false,
  clueNotice = null,
  closedText = "",
}) {
  const lede = caseClosed
    ? closedText || "谱齐了。抄家的单子也对上了。"
    : "人名须检索入档才会出现。职分对案卷里的事迹，不必等人名入档。新对满三格才一并核认，核认时发一纸。";

  return (
    <section className="panel">
      <h2>公案桌</h2>
      <p className="lede">{lede}</p>
      {clueNotice?.text ? (
        <p className={clueNotice.fresh || caseClosed ? "banner ok" : "banner"}>
          {clueNotice.text}
        </p>
      ) : null}
      <div className="desk-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className={
              clueNotice?.fresh && item.id === clueNotice.evidenceId
                ? "paper-card fresh"
                : "paper-card"
            }
            onClick={() => onOpen(item.id)}
            type="button"
          >
            <span className="kind">
              {clueNotice?.fresh && item.id === clueNotice.evidenceId
                ? "新发"
                : item.kind}
            </span>
            <strong>{item.title}</strong>
            <span className="card-foot">{item.body[0]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
