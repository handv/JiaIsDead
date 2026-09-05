export default function Desk({
  items,
  onOpen,
  caseClosed = false,
  clueNotice = null,
}) {
  const lede = caseClosed
    ? "全案已核。昭穆已定。"
    : "人名须检索入档才会出现。职分是吏目职分表，开局就有，要用案卷里的事迹去对。新对满三格才一并核认，核认时发一纸。";

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
