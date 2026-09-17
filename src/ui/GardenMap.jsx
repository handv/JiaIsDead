import { useEffect, useLayoutEffect, useRef, useState } from "react";
import mapInk from "../assets/daguanyuan-ink.png";
import {
  filledCount,
  hintOf,
  isCourtLocked,
  nameOf,
  optionsForCourt,
} from "../game/garden.js";
import { useMediaQuery } from "./useMediaQuery.js";
import { usePanZoom } from "./usePanZoom.js";

export default function GardenMap({
  garden,
  placements,
  lockedSlotIds = [],
  onChange,
  unlockedOptionIds = null,
  clueNotice = null,
  onOpenArchive,
}) {
  const [openId, setOpenId] = useState(null);
  const openCourt = garden.courts.find((court) => court.id === openId) ?? null;
  const compact = useMediaQuery("(max-width: 800px)");
  const pan = usePanZoom(compact);
  const panRef = useRef(pan);
  panRef.current = pan;
  const sheetRef = useRef(null);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") setOpenId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function fitSheet() {
    const sheet = sheetRef.current;
    if (!sheet) return;
    panRef.current.withIdentity(() => panRef.current.fitOnce(sheet));
  }

  useLayoutEffect(() => {
    if (!compact) return undefined;
    fitSheet();
    return undefined;
  }, [compact]);

  const sheet = (
    <div
      className="garden-sheet"
      ref={sheetRef}
      style={
        compact
          ? {
              width: garden.width,
              aspectRatio: `${garden.width} / ${garden.height}`,
            }
          : undefined
      }
      onClick={() => {
        if (!compact) setOpenId(null);
      }}
    >
      <img
        className="garden-ink"
        src={mapInk}
        alt="大观园图"
        draggable={false}
        onLoad={fitSheet}
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
      {openCourt && !compact ? (
        <CourtPop
          court={openCourt}
          placements={placements}
          lockedSlotIds={lockedSlotIds}
          unlockedOptionIds={unlockedOptionIds}
          onChange={onChange}
          onClose={() => setOpenId(null)}
        />
      ) : null}
    </div>
  );

  return (
    <section className="panel garden-panel">
      <h2>大观园图</h2>
      {compact ? (
        <details className="garden-howto">
          <summary>用法</summary>
          <p className="lede">
            点开白点核此院。每核一院再拆纸。匾额、雅号、丫鬟点进档册核过才入下拉；主人开局可填。
          </p>
        </details>
      ) : (
        <p className="lede">
          点开白点核此院。每核一院再拆纸。匾额、雅号、丫鬟点进档册核过才入下拉；主人开局可填。
        </p>
      )}
      {clueNotice?.text ? (
        <p className={clueNotice.fresh ? "banner ok" : "banner"}>
          {clueNotice.text}
          {onOpenArchive ? (
            <>
              {" "}
              <button className="text-btn" type="button" onClick={onOpenArchive}>
                去书桌
              </button>
            </>
          ) : null}
        </p>
      ) : null}
      {compact ? (
        <div className="garden-tools">
          <button type="button" onClick={pan.zoomOut}>
            缩小
          </button>
          <span>{pan.scaleLabel}</span>
          <button type="button" onClick={pan.zoomIn}>
            放大
          </button>
          <button type="button" onClick={() => pan.fit(sheetRef.current)}>
            适合屏幕
          </button>
          <p className="hint">拖动画布，双指缩放。点白点核院。</p>
        </div>
      ) : null}
      {compact ? (
        <div
          className={
            pan.panning ? "garden-viewport is-panning" : "garden-viewport"
          }
          ref={pan.viewportRef}
        >
          <div className="garden-stage" ref={pan.stageRef}>
            {sheet}
          </div>
        </div>
      ) : (
        sheet
      )}
      {openCourt && compact ? (
        <div className="garden-pop-mask" onClick={() => setOpenId(null)}>
          <CourtPop
            sheet
            court={openCourt}
            placements={placements}
            lockedSlotIds={lockedSlotIds}
            unlockedOptionIds={unlockedOptionIds}
            onChange={onChange}
            onClose={() => setOpenId(null)}
          />
        </div>
      ) : null}
    </section>
  );
}

function CourtPop({
  court,
  placements,
  lockedSlotIds,
  unlockedOptionIds,
  onChange,
  onClose,
  sheet = false,
}) {
  const locked = isCourtLocked(court, lockedSlotIds);
  const side = court.pinX > 58 ? "is-left" : "is-right";
  return (
    <article
      className={sheet ? "garden-pop is-sheet" : `garden-pop ${side}`}
      style={
        sheet
          ? undefined
          : { left: `${court.pinX}%`, top: `${court.pinY}%` }
      }
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
          undefined,
          unlockedOptionIds,
          current ? [current] : [],
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
