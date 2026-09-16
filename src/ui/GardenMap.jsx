import mapInk from "../assets/daguanyuan-ink.png";

export default function GardenMap() {
  return (
    <section className="panel garden-panel">
      <h2>大观园图</h2>
      <p className="lede">园中另案。先看全图，院落题额稍后在图上填。</p>
      <div className="garden-sheet">
        <img
          className="garden-ink"
          src={mapInk}
          alt="大观园水墨设色图"
          draggable={false}
        />
      </div>
    </section>
  );
}
