import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { alignTreeLayout, groupEdges, linePaths, treeEdges } from "../game/treeLines.js";
import SlotEditor from "./SlotEditor.jsx";
import { useMediaQuery } from "./useMediaQuery.js";
import { usePanZoom } from "./usePanZoom.js";

function byId(slots, id) {
  return slots.find((slot) => slot.id === id);
}

export default function FamilyTree({
  batch1,
  batch2,
  batch3,
  batch4,
  batch5,
  placements,
  names,
  roles,
  roleGloss = {},
  lockedSlotIds = [],
  lockedCount = 0,
  caseClosed = false,
  clueNotice = null,
  onOpenClue,
  onChange,
  verdict = null,
}) {
  const locked = (id) => lockedSlotIds.includes(id);
  const compact = useMediaQuery("(max-width: 800px)");
  const [editingId, setEditingId] = useState(null);
  const slotProps = {
    placements,
    names,
    roles,
    roleGloss,
    onChange,
    compact,
    onEdit: setEditingId,
  };
  const spouse = (id) => byId(batch2.slots, id);
  const child = (id) => byId(batch3.slots, id);
  const extra = (id) => byId(batch4.slots, id);
  const cao = (id) => byId(batch5.slots, id);
  const allSlots = useMemo(
    () => [
      ...batch1.slots,
      ...batch2.slots,
      ...batch3.slots,
      ...batch4.slots,
      ...batch5.slots,
    ],
    [batch1, batch2, batch3, batch4, batch5],
  );
  const pedigreeRef = useRef(null);
  const [drawing, setDrawing] = useState({ width: 0, height: 0, paths: [] });
  const edges = useMemo(() => groupEdges(treeEdges(allSlots)), [allSlots]);
  const editingSlot = editingId ? allSlots.find((slot) => slot.id === editingId) : null;
  const pan = usePanZoom(compact);
  const panRef = useRef(pan);
  panRef.current = pan;

  useEffect(() => {
    if (!compact) setEditingId(null);
  }, [compact]);

  useLayoutEffect(() => {
    const root = pedigreeRef.current;
    if (!root) return undefined;

    function draw() {
      const next = pedigreeRef.current;
      if (!next) return;
      const layout = () => {
        alignTreeLayout(next, edges);
        setDrawing({
          width: next.offsetWidth,
          height: next.offsetHeight,
          paths: linePaths(edges, measureBoxes(next), { slots: allSlots }),
        });
      };
      if (compact) {
        const camera = panRef.current;
        camera.withIdentity(() => {
          layout();
          camera.fitOnce(next);
        });
      } else {
        const stage = panRef.current.stageRef?.current;
        if (stage) stage.style.transform = "";
        layout();
      }
    }

    draw();
    const frame = requestAnimationFrame(draw);
    const observer = new ResizeObserver(draw);
    observer.observe(root);
    window.addEventListener("resize", draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [allSlots, compact, edges]);

  const lede = caseClosed
    ? verdict
      ? `你对红楼梦的熟悉度 ${verdict.familiarity}%。`
      : "谱齐了。抄家的单子也对上了。"
    : "姓名须点关键词检索入档。职分是身份，不是谁之妻、谁之女。填对的格先不锁。新对满三格才一并核认；核认时发一纸。错的不告哪一格。同房同辈，年长在左。";

  return (
    <section className="panel tree-panel">
      <h2>贾氏宗谱</h2>
      {compact && !caseClosed ? (
        <details className="tree-howto">
          <summary>用法</summary>
          <p className="lede">{lede}</p>
        </details>
      ) : (
        <p className="lede">{lede}</p>
      )}
      <p className="hint">已入档姓名 {names.length} · 已核 {lockedCount} 格</p>
      <ClueBanner notice={clueNotice} onOpenClue={onOpenClue} />

      {compact ? (
        <div className="pedigree-tools">
          <button type="button" onClick={pan.zoomOut}>
            缩小
          </button>
          <span>{pan.scaleLabel}</span>
          <button type="button" onClick={pan.zoomIn}>
            放大
          </button>
          <button type="button" onClick={() => pan.fit(pedigreeRef.current)}>
            适合屏幕
          </button>
          <p className="hint">拖动画布，双指缩放。点格填写。</p>
        </div>
      ) : null}
      <div
        className={
          compact
            ? pan.panning
              ? "pedigree-viewport is-panning"
              : "pedigree-viewport"
            : "pedigree-wrap"
        }
        ref={pan.viewportRef}
      >
        <div className="pedigree-stage" ref={pan.stageRef}>
        <div className="pedigree" ref={pedigreeRef}>
          <svg
            className="pedigree-lines"
            width={drawing.width}
            height={drawing.height}
            viewBox={`0 0 ${Math.max(drawing.width, 1)} ${Math.max(drawing.height, 1)}`}
            aria-hidden="true"
          >
            {drawing.paths.map((path) => (
              <path
                key={path.key}
                d={path.d}
                fill="none"
                stroke={path.color ?? "#8f2d2a"}
                strokeWidth="1.25"
              />
            ))}
          </svg>
          <Stem>
            <Slot
              slot={byId(batch1.slots, "ning-gong")}
              locked={locked("ning-gong")}
              {...slotProps}
            />
            <Kids>
              <Stem>
                <Slot
                  slot={byId(batch1.slots, "ning-dai")}
                  locked={locked("ning-dai")}
                  {...slotProps}
                />
                <Kids>
                  <Slot
                    slot={byId(batch1.slots, "ning-wen-1")}
                    locked={locked("ning-wen-1")}
                    {...slotProps}
                  />
                  <Stem>
                    <Slot
                      slot={byId(batch1.slots, "ning-wen-2")}
                      locked={locked("ning-wen-2")}
                      {...slotProps}
                    />
                    <Kids>
                      <Stem>
                        <Couple>
                          <Slot
                            slot={child("jing-son")}
                            tone="child"
                            locked={locked("jing-son")}
                            {...slotProps}
                          />
                          <Slot
                            slot={child("zhen-wife")}
                            tone="spouse"
                            locked={locked("zhen-wife")}
                            {...slotProps}
                          />
                        </Couple>
                        <Kids>
                          <Couple>
                            <Slot
                              slot={cao("zhen-son")}
                              tone="child"
                              locked={locked("zhen-son")}
                              {...slotProps}
                            />
                            <Slot
                              slot={cao("keqing-pending")}
                              tone="spouse"
                              locked={locked("keqing-pending")}
                              {...slotProps}
                            />
                          </Couple>
                        </Kids>
                      </Stem>
                      <Slot
                        slot={child("jing-daughter")}
                        tone="child"
                        locked={locked("jing-daughter")}
                        {...slotProps}
                      />
                    </Kids>
                  </Stem>
                </Kids>
              </Stem>
            </Kids>
          </Stem>
          <Stem>
            <Slot
              slot={byId(batch1.slots, "rong-gong")}
              locked={locked("rong-gong")}
              {...slotProps}
            />
            <Kids>
              <Stem>
                <Couple>
                  <Slot
                    slot={byId(batch1.slots, "rong-dai")}
                    locked={locked("rong-dai")}
                    {...slotProps}
                  />
                  <Slot
                    slot={spouse("daishan-wife")}
                    tone="spouse"
                    locked={locked("daishan-wife")}
                    {...slotProps}
                  />
                </Couple>
                <Kids>
                  <Stem>
                    <Couple>
                      <Slot
                        slot={byId(batch1.slots, "rong-wen-1")}
                        locked={locked("rong-wen-1")}
                        {...slotProps}
                      />
                      <Slot
                        slot={spouse("she-wife")}
                        tone="spouse"
                        locked={locked("she-wife")}
                        {...slotProps}
                      />
                    </Couple>
                    <Kids>
                      <Stem>
                        <Couple>
                          <Slot
                            slot={child("she-son")}
                            tone="child"
                            locked={locked("she-son")}
                            {...slotProps}
                          />
                          <Slot
                            slot={child("lian-wife")}
                            tone="spouse"
                            locked={locked("lian-wife")}
                            {...slotProps}
                          />
                        </Couple>
                        <Kids>
                          <Slot
                            slot={cao("lian-daughter")}
                            tone="child"
                            locked={locked("lian-daughter")}
                            {...slotProps}
                          />
                        </Kids>
                      </Stem>
                      <Slot
                        slot={extra("she-yu-girl")}
                        tone="child"
                        locked={locked("she-yu-girl")}
                        {...slotProps}
                      />
                    </Kids>
                  </Stem>
                  <Stem className="tstem-xue">
                    <Slot
                      slot={spouse("xue-sister")}
                      tone="kin"
                      locked={locked("xue-sister")}
                      {...slotProps}
                    />
                    <Kids>
                      <Kin label="金锁">
                        <Slot
                          slot={cao("xue-niece")}
                          tone="kin"
                          locked={locked("xue-niece")}
                          {...slotProps}
                        />
                      </Kin>
                    </Kids>
                  </Stem>
                  <Stem>
                    <Couple>
                      <Slot
                        slot={spouse("zheng-wife")}
                        tone="spouse"
                        locked={locked("zheng-wife")}
                        {...slotProps}
                      />
                      <Slot
                        slot={byId(batch1.slots, "rong-wen-2")}
                        locked={locked("rong-wen-2")}
                        {...slotProps}
                      />
                      <Slot
                        slot={extra("zhao-shi")}
                        tone="kin"
                        locked={locked("zhao-shi")}
                        {...slotProps}
                      />
                    </Couple>
                    <Kids>
                      <Stem>
                        <Couple>
                          <Slot
                            slot={child("zheng-heir")}
                            tone="child"
                            locked={locked("zheng-heir")}
                            {...slotProps}
                          />
                          <Slot
                            slot={child("zhu-wife")}
                            tone="spouse"
                            locked={locked("zhu-wife")}
                            {...slotProps}
                          />
                        </Couple>
                        <Kids>
                          <Slot
                            slot={cao("zhu-son")}
                            tone="child"
                            locked={locked("zhu-son")}
                            {...slotProps}
                          />
                        </Kids>
                      </Stem>
                      <Slot
                        slot={child("zheng-daughter")}
                        tone="child"
                        locked={locked("zheng-daughter")}
                        {...slotProps}
                      />
                      <Slot
                        slot={child("zheng-son")}
                        tone="child"
                        locked={locked("zheng-son")}
                        {...slotProps}
                      />
                      <Slot
                        slot={extra("zheng-yu-girl-ce")}
                        tone="child"
                        locked={locked("zheng-yu-girl-ce")}
                        {...slotProps}
                      />
                      <Slot
                        slot={extra("zheng-yu-son-ce")}
                        tone="child"
                        locked={locked("zheng-yu-son-ce")}
                        {...slotProps}
                      />
                    </Kids>
                  </Stem>
                  <Stem>
                    <Couple>
                      <Slot
                        slot={spouse("min-husband")}
                        locked={locked("min-husband")}
                        {...slotProps}
                      />
                      <Slot
                        slot={byId(batch1.slots, "rong-wen-3")}
                        tone="spouse"
                        locked={locked("rong-wen-3")}
                        {...slotProps}
                      />
                    </Couple>
                    <Kids>
                      <Slot
                        slot={spouse("min-daughter")}
                        tone="child"
                        locked={locked("min-daughter")}
                        {...slotProps}
                      />
                    </Kids>
                  </Stem>
                  <Stem className="tstem-offset">
                    <GenSpacer />
                    <Kids>
                      <Kin label="史家">
                        <Slot
                          slot={spouse("jiamu-niece")}
                          tone="child"
                          locked={locked("jiamu-niece")}
                          {...slotProps}
                        />
                      </Kin>
                    </Kids>
                  </Stem>
                </Kids>
              </Stem>
            </Kids>
          </Stem>
        </div>
        </div>
      </div>

      {names.length === 0 ? (
        <p className="banner">尚未著录姓名。请先读书桌残页，点出人名再检索。</p>
      ) : null}
      <ClueBanner notice={clueNotice} onOpenClue={onOpenClue} />
      {compact && editingSlot ? (
        <SlotEditor
          slot={editingSlot}
          value={placements?.[editingSlot.id]}
          names={names}
          roles={roles}
          roleGloss={roleGloss}
          locked={locked(editingSlot.id)}
          onChange={onChange}
          onClose={() => setEditingId(null)}
        />
      ) : null}
    </section>
  );
}

function measureBoxes(root) {
  const origin = root.getBoundingClientRect();
  const boxes = {};
  for (const node of root.querySelectorAll("[data-tree-id]")) {
    const rect = node.getBoundingClientRect();
    boxes[node.getAttribute("data-tree-id")] = {
      x: rect.left - origin.left,
      y: rect.top - origin.top,
      w: rect.width,
      h: rect.height,
    };
  }
  return boxes;
}

function ClueBanner({ notice, onOpenClue }) {
  if (!notice?.text) return null;
  return (
    <p className={notice.fresh || notice.kind === "closed" ? "banner ok" : "banner"}>
      {notice.text}
      {notice.fresh && notice.evidenceId && onOpenClue ? (
        <>
          {" "}
          <button
            className="text-btn banner-link"
            onClick={() => onOpenClue(notice.evidenceId)}
            type="button"
          >
            查看{notice.title}
          </button>
        </>
      ) : null}
    </p>
  );
}

function Stem({ children, className = "" }) {
  return <div className={["tstem", className].filter(Boolean).join(" ")}>{children}</div>;
}

function GenSpacer() {
  return (
    <div className="slot tgen-spacer" aria-hidden="true">
      <p className="slot-hint">　</p>
      <label>
        姓名
        <select disabled>
          <option>未填</option>
        </select>
      </label>
      <label>
        职分
        <select disabled>
          <option>未填</option>
        </select>
      </label>
    </div>
  );
}

function Kids({ children }) {
  const items = [].concat(children).flat().filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={`tkids count-${items.length}`}>
      {items.map((item, index) => (
        <div key={item?.key ?? index} className="tkid">
          {item}
        </div>
      ))}
    </div>
  );
}

function Couple({ children }) {
  const items = [].concat(children).flat().filter(Boolean);
  if (items.length === 1) return items[0];
  return <div className="couple">{items}</div>;
}

function Kin({ children, label }) {
  return (
    <div className="tkin">
      {label ? <p className="tkin-label">{label}</p> : null}
      <div className="tkin-row">{children}</div>
    </div>
  );
}

function Slot({
  slot,
  value,
  names,
  roles,
  roleGloss = {},
  locked,
  onChange,
  tone = "blood",
  placements,
  compact = false,
  onEdit,
}) {
  if (!slot) return null;
  const current = value ?? placements?.[slot.id];
  const personName = names.find((person) => person.id === current?.personId)?.name;
  return (
    <div className={`slot ${tone} ${locked ? "locked" : ""}`} data-tree-id={slot.id}>
      <p className="slot-hint">
        {slot.hint}
        {locked ? <span className="slot-seal">已核</span> : <span className="slot-open-mark">待核</span>}
      </p>
      {compact ? (
        <button
          className="slot-open"
          type="button"
          onClick={() => onEdit?.(slot.id)}
        >
          <span className={personName ? "slot-fill" : "slot-empty"}>
            姓名 {personName || "未填"}
          </span>
          <span className={current?.role ? "slot-fill" : "slot-empty"}>
            职分 {current?.role || "未填"}
          </span>
        </button>
      ) : (
        <>
          <label>
            姓名
            <select
              data-slot={slot.id}
              data-field="personId"
              value={current?.personId ?? ""}
              disabled={locked}
              onChange={(event) => onChange(slot.id, "personId", event.target.value)}
            >
              <option value="">未填</option>
              {names.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            职分
            <select
              data-slot={slot.id}
              data-field="role"
              value={current?.role ?? ""}
              disabled={locked}
              onChange={(event) => onChange(slot.id, "role", event.target.value)}
            >
              <option value="">未填</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleGloss[role] ? `${role} · ${roleGloss[role]}` : role}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
