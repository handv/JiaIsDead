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
}) {
  const locked = (id) => lockedSlotIds.includes(id);
  const slotProps = { placements, names, roles, roleGloss, onChange };
  const spouse = (id) => byId(batch2.slots, id);
  const child = (id) => byId(batch3.slots, id);
  const extra = (id) => byId(batch4.slots, id);
  const cao = (id) => byId(batch5.slots, id);

  const lede = caseClosed
    ? "全案已核。昭穆已定。"
    : "姓名须点关键词检索入档。职分是身份，不是谁之妻、谁之女。填对的格先不锁。新对满三格才一并核认；核认时发一纸。错的不告哪一格。同房同辈，年长在左。";

  return (
    <section className="panel">
      <h2>贾氏宗谱</h2>
      <p className="lede">{lede}</p>
      <p className="hint">已入档姓名 {names.length} · 已核 {lockedCount} 格</p>
      <ClueBanner notice={clueNotice} onOpenClue={onOpenClue} />
      <div className="role-lexicon-wrap">
        <p className="hint">吏目职分表</p>
        <dl className="role-lexicon">
          {roles.map((role) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{roleGloss[role] ?? ""}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="pedigree-wrap">
        <div className="pedigree">
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
                          <Anchor>
                            <Slot
                              slot={cao("zhen-son")}
                              tone="child"
                              locked={locked("zhen-son")}
                              {...slotProps}
                            />
                            <Kin label="待核">
                              <Slot
                                slot={cao("keqing-pending")}
                                tone="kin"
                                locked={locked("keqing-pending")}
                                {...slotProps}
                              />
                            </Kin>
                          </Anchor>
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
                  <Stem>
                    <Couple>
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
                      <Slot
                        slot={spouse("zheng-wife")}
                        tone="spouse"
                        locked={locked("zheng-wife")}
                        {...slotProps}
                      />
                      <Slot
                        slot={spouse("xue-sister")}
                        tone="kin"
                        locked={locked("xue-sister")}
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
                        slot={byId(batch1.slots, "rong-wen-3")}
                        locked={locked("rong-wen-3")}
                        {...slotProps}
                      />
                      <Slot
                        slot={spouse("min-husband")}
                        tone="spouse"
                        locked={locked("min-husband")}
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

      {names.length === 0 ? (
        <p className="banner">尚未著录姓名。请先读书桌残页，点出人名再检索。</p>
      ) : null}
      <ClueBanner notice={clueNotice} onOpenClue={onOpenClue} />
    </section>
  );
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

function Anchor({ children }) {
  return <div className="tanchor">{children}</div>;
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

function Slot({ slot, value, names, roles, roleGloss = {}, locked, onChange, tone = "blood", placements }) {
  if (!slot) return null;
  const current = value ?? placements?.[slot.id];
  return (
    <div className={`slot ${tone} ${locked ? "locked" : ""}`}>
      <p className="slot-hint">{slot.hint}</p>
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
    </div>
  );
}
