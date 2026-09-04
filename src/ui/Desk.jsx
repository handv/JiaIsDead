export default function Desk({ items, onOpen, batch1Locked, batch2Locked }) {
  const lede = batch2Locked
    ? "宁荣骨架与联姻入口都已核。玉字辈尚未开档。"
    : batch1Locked
      ? "人名须检索入档才会出现。职分是吏目职分表，开局就有。骨架已钤，内眷座次已发下。联姻只核嫡妻、林家、史家、王薛，不填玉字宗子。"
      : "人名须检索入档才会出现。职分是吏目职分表，开局就有，要用案卷里的事迹去对，材料不会照着表念。第一批只核国公、代字、文字三层。";

  return (
    <section className="panel">
      <h2>公案桌</h2>
      <p className="lede">{lede}</p>
      {batch1Locked && !batch2Locked ? (
        <p className="banner ok">宁荣骨架已核。联姻档已开，请看寿筵座次。</p>
      ) : null}
      {batch2Locked ? (
        <p className="banner ok">联姻入口已核。玉字辈尚未开档。</p>
      ) : null}
      <div className="desk-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className="paper-card"
            onClick={() => onOpen(item.id)}
            type="button"
          >
            <span className="kind">{item.kind}</span>
            <strong>{item.title}</strong>
            <span className="card-foot">{item.body[0]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
