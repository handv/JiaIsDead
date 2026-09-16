import { useEffect, useState } from "react";
import mapInk from "../assets/daguanyuan-ink.png";
import {
  filledCount,
  hintOf,
  isCourtLocked,
  nameOf,
  optionsForCourt,
} from "../game/garden.js";

export default function GardenMap({
  garden,
  placements,
  lockedSlotIds = [],
  onChange,
}) {
  const [openId, setOpenId] = useState(null);
  const openCourt = garden.courts.find((court) => court.id === openId) ?? null;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="panel garden-panel">
      <h2>大观园图</h2>
      <p className="lede">点开白点核此院。角标为已填格，全对后点变绿。</p>
      <div className="garden-sheet" onClick={() => setOpenId(null)}>
        <img
          className="garden-ink"
          src={mapInk}
          alt="大观园图"
          draggable={false}
        />
        {(garden.labels ?? []).map((label) => (
          <span
            key={label.name}
            className="garden-scene-tag"
            style={{ left: `${label.pinX}%`, top: `${label.pinY}%` }}
          >
            {label.name}
          </span>
        ))}
        {garden.courts.map((court) => {
          const total = court.slots.length;
          const filled = filledCount(court, placements);
          const locked = isCourtLocked(court, lockedSlotIds);
          const open = openId === court.id;
          return (
            <button
              key={court.id}
              type="button"
              className={[
                "garden-pin",
                locked ? "is-done" : "",
                open ? "is-open" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${court.pinX}%`, top: `${court.pinY}%` }}
              aria-label={`此院 ${filled}/${total}${locked ? " 已核" : ""}`}
              onClick={(event) => {
                event.stopPropagation();
                setOpenId((current) => (current === court.id ? null : court.id));
              }}
            >
              <span className="garden-pin-dot" />
              <span className="garden-pin-count">
                {filled}/{total}
              </span>
            </button>
          );
        })}
        {openCourt ? (
          <CourtPop
            court={openCourt}
            placements={placements}
            lockedSlotIds={lockedSlotIds}
            onChange={onChange}
            onClose={() => setOpenId(null)}
          />
        ) : null}
      </div>
    </section>
  );
}

function CourtPop({ court, placements, lockedSlotIds, onChange, onClose }) {
  const locked = isCourtLocked(court, lockedSlotIds);
  const side = court.pinX > 58 ? "is-left" : "is-right";
  return (
    <article
      className={`garden-pop ${side}`}
      style={{ left: `${court.pinX}%`, top: `${court.pinY}%` }}
      role="dialog"
      aria-label="此院"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="garden-pop-kicker">{locked ? "此院 · 已核" : "此院"}</p>
      {court.slots.map((slot) => {
        const current = placements[slot.id]?.personId ?? "";
        const options = optionsForCourt(
          slot.kind,
          court.id,
          placements,
          lockedSlotIds,
        );
        return (
          <label key={slot.id}>
            {hintOf(slot.kind)}
            {locked ? (
              <strong>{nameOf(current) || "未填"}</strong>
            ) : (
              <select
                value={current}
                onChange={(event) => onChange(slot.id, event.target.value)}
              >
                <option value="">未填</option>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </label>
        );
      })}
      <button type="button" onClick={onClose}>
        {locked ? "收起" : "著录"}
      </button>
    </article>
  );
}
