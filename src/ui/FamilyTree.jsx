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
  batch1Locked,
  batch2Locked,
  batch3Locked,
  batch4Locked,
  batch5Locked,
  submitResult,
  onChange,
  onSubmit1,
  onSubmit2,
  onSubmit3,
  onSubmit4,
  onSubmit5,
}) {
  const reveal = batch1Locked;
  const jade = batch2Locked;
  const sideBook = batch3Locked;
  const grass = batch4Locked;
  const bloodLocked = batch1Locked;
  const inlawLocked = batch2Locked;
  const jadeLocked = batch3Locked;
  const sideLocked = batch4Locked;
  const grassLocked = batch5Locked;
  const batch1Result = submitResult?.batch === 1 ? submitResult : null;
  const batch2Result = submitResult?.batch === 2 ? submitResult : null;
  const batch3Result = submitResult?.batch === 3 ? submitResult : null;
  const batch4Result = submitResult?.batch === 4 ? submitResult : null;
  const batch5Result = submitResult?.batch === 5 ? submitResult : null;

  const slotProps = { placements, names, roles, roleGloss, onChange };
  const spouse = (id) => byId(batch2.slots, id);
  const child = (id) => byId(batch3.slots, id);
  const extra = (id) => byId(batch4.slots, id);
  const cao = (id) => byId(batch5.slots, id);

  const lede = batch5Locked
    ? "草字已核。全案已结。"
    : grass
      ? "草字格已挂上。谁入昭穆、谁只是待核，案卷里自己核。职分仍对开局的表，材料不念表上的用词。错一格整批驳回。"
    : sideBook
      ? "另册格已挂上。谁入正册、谁入另册，案卷里自己核。职分仍对开局的表，材料不念表上的用词。错一格整批驳回。"
      : jade
      ? "玉字格挂在父母名下。谁挂谁名下，案卷里自己核。职分仍对开局的表，材料不念表上的用词。错一格整批驳回。"
      : reveal
        ? "姻亲格出现在对应的人旁边。谁挂谁名下，案卷里自己核。职分仍对开局的表，材料不念表上的用词。错一格整批驳回。"
        : "姓名须点关键词检索入档。职分是身份，不是谁之妻、谁之女。用演说里的事迹去对（袭了一等、好道、员外郎、出嫁），材料不会写出表上的用词。九格全对才钤印；错一格整批驳回，不告哪一格。";

  return (
    <section className="panel">
      <h2>贾氏宗谱</h2>
      <p className="lede">{lede}</p>
      <p className="hint">已入档姓名 {names.length}</p>
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
                locked={bloodLocked}
                {...slotProps}
              />
              <Kids>
                <Stem>
                  <Slot
                    slot={byId(batch1.slots, "ning-dai")}
                    locked={bloodLocked}
                    {...slotProps}
                  />
                  <Kids>
                    <Slot
                      slot={byId(batch1.slots, "ning-wen-1")}
                      locked={bloodLocked}
                      {...slotProps}
                    />
                    <Stem>
                      <Slot
                        slot={byId(batch1.slots, "ning-wen-2")}
                        locked={bloodLocked}
                        {...slotProps}
                      />
                      {jade ? (
                        <Kids>
                          <Stem>
                            <Couple>
                              <Slot
                                slot={child("jing-son")}
                                tone="child"
                                locked={jadeLocked}
                                {...slotProps}
                              />
                              <Slot
                                slot={child("zhen-wife")}
                                tone="spouse"
                                locked={jadeLocked}
                                {...slotProps}
                              />
                            </Couple>
                            {grass ? (
                              <Kids>
                                <Anchor>
                                  <Slot
                                    slot={cao("zhen-son")}
                                    tone="child"
                                    locked={grassLocked}
                                    {...slotProps}
                                  />
                                  <Kin label="待核">
                                    <Slot
                                      slot={cao("keqing-pending")}
                                      tone="kin"
                                      locked={grassLocked}
                                      {...slotProps}
                                    />
                                  </Kin>
                                </Anchor>
                              </Kids>
                            ) : null}
                          </Stem>
                          <Slot
                            slot={child("jing-daughter")}
                            tone="child"
                            locked={jadeLocked}
                            {...slotProps}
                          />
                        </Kids>
                      ) : null}
                    </Stem>
                  </Kids>
                </Stem>
              </Kids>
            </Stem>
            <Stem>
              <Slot
                slot={byId(batch1.slots, "rong-gong")}
                locked={bloodLocked}
                {...slotProps}
              />
              <Kids>
                <Stem>
                  <Anchor>
                    <Couple>
                      <Slot
                        slot={byId(batch1.slots, "rong-dai")}
                        locked={bloodLocked}
                        {...slotProps}
                      />
                      {reveal ? (
                        <Slot
                          slot={spouse("daishan-wife")}
                          tone="spouse"
                          locked={inlawLocked}
                          {...slotProps}
                        />
                      ) : null}
                    </Couple>
                    {reveal ? (
                      <Kin label="史家">
                        <Slot
                          slot={spouse("jiamu-niece")}
                          tone="child"
                          locked={inlawLocked}
                          {...slotProps}
                        />
                      </Kin>
                    ) : null}
                  </Anchor>
                  <Kids>
                    <Stem>
                      <Couple>
                        <Slot
                          slot={byId(batch1.slots, "rong-wen-1")}
                          locked={bloodLocked}
                          {...slotProps}
                        />
                        {reveal ? (
                          <Slot
                            slot={spouse("she-wife")}
                            tone="spouse"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        ) : null}
                      </Couple>
                      {jade ? (
                        <Kids>
                          <Stem>
                            <Couple>
                              <Slot
                                slot={child("she-son")}
                                tone="child"
                                locked={jadeLocked}
                                {...slotProps}
                              />
                              <Slot
                                slot={child("lian-wife")}
                                tone="spouse"
                                locked={jadeLocked}
                                {...slotProps}
                              />
                            </Couple>
                            {grass ? (
                              <Kids>
                                <Slot
                                  slot={cao("lian-daughter")}
                                  tone="child"
                                  locked={grassLocked}
                                  {...slotProps}
                                />
                              </Kids>
                            ) : null}
                          </Stem>
                          {sideBook ? (
                            <Slot
                              slot={extra("she-yu-girl")}
                              tone="child"
                              locked={sideLocked}
                              {...slotProps}
                            />
                          ) : null}
                        </Kids>
                      ) : null}
                    </Stem>
                    <Stem>
                      <Anchor>
                        <Couple>
                          <Slot
                            slot={byId(batch1.slots, "rong-wen-2")}
                            locked={bloodLocked}
                            {...slotProps}
                          />
                          {reveal ? (
                            <Slot
                              slot={spouse("zheng-wife")}
                              tone="spouse"
                              locked={inlawLocked}
                              {...slotProps}
                            />
                          ) : null}
                        </Couple>
                        {reveal ? (
                          <Kin label="王薛">
                            <Slot
                              slot={spouse("wang-brother")}
                              tone="kin"
                              locked={inlawLocked}
                              {...slotProps}
                            />
                            <Slot
                              slot={spouse("xue-sister")}
                              tone="kin"
                              locked={inlawLocked}
                              {...slotProps}
                            />
                          </Kin>
                        ) : null}
                        {grass ? (
                          <Kin label="议婚">
                            <Slot
                              slot={cao("xue-niece")}
                              tone="kin"
                              locked={grassLocked}
                              {...slotProps}
                            />
                          </Kin>
                        ) : null}
                        {sideBook ? (
                          <Kin label="房里">
                            <Slot
                              slot={extra("zhao-shi")}
                              tone="kin"
                              locked={sideLocked}
                              {...slotProps}
                            />
                          </Kin>
                        ) : null}
                      </Anchor>
                      {jade ? (
                        <Kids>
                          <Stem>
                            <Couple>
                              <Slot
                                slot={child("zheng-heir")}
                                tone="child"
                                locked={jadeLocked}
                                {...slotProps}
                              />
                              <Slot
                                slot={child("zhu-wife")}
                                tone="spouse"
                                locked={jadeLocked}
                                {...slotProps}
                              />
                            </Couple>
                            {grass ? (
                              <Kids>
                                <Slot
                                  slot={cao("zhu-son")}
                                  tone="child"
                                  locked={grassLocked}
                                  {...slotProps}
                                />
                              </Kids>
                            ) : null}
                          </Stem>
                          <Slot
                            slot={child("zheng-daughter")}
                            tone="child"
                            locked={jadeLocked}
                            {...slotProps}
                          />
                          <Slot
                            slot={child("zheng-son")}
                            tone="child"
                            locked={jadeLocked}
                            {...slotProps}
                          />
                          {sideBook ? (
                            <Slot
                              slot={extra("zheng-yu-girl-ce")}
                              tone="child"
                              locked={sideLocked}
                              {...slotProps}
                            />
                          ) : null}
                          {sideBook ? (
                            <Slot
                              slot={extra("zheng-yu-son-ce")}
                              tone="child"
                              locked={sideLocked}
                              {...slotProps}
                            />
                          ) : null}
                        </Kids>
                      ) : null}
                    </Stem>
                    <Stem>
                      <Couple>
                        <Slot
                          slot={byId(batch1.slots, "rong-wen-3")}
                          locked={bloodLocked}
                          {...slotProps}
                        />
                        {reveal ? (
                          <Slot
                            slot={spouse("min-husband")}
                            tone="spouse"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        ) : null}
                      </Couple>
                      {reveal ? (
                        <Kids>
                          <Slot
                            slot={spouse("min-daughter")}
                            tone="child"
                            locked={inlawLocked}
                            {...slotProps}
                          />
                        </Kids>
                      ) : null}
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
      {batch1Result?.reason === "incomplete" ? (
        <p className="banner">还有空格。九格都填了再呈报。</p>
      ) : null}
      {batch1Result?.reason === "mismatch" ? (
        <p className="banner">昭穆未合，整批驳回。请对邸抄、神主、名刺再核。</p>
      ) : null}
      {batch1Locked ? (
        <p className="banner ok">宁荣骨架已钤印。敷虽早夭，仍在谱上。</p>
      ) : null}
      {batch2Result?.reason === "incomplete" ? (
        <p className="banner">姻亲格还有空。都填了再呈报。</p>
      ) : null}
      {batch2Result?.reason === "mismatch" ? (
        <p className="banner">姻娅未合，整批驳回。请对寿礼、会票、来信再核。</p>
      ) : null}
      {batch2Locked ? (
        <p className="banner ok">联姻入口已钤印。</p>
      ) : null}
      {batch3Result?.reason === "incomplete" ? (
        <p className="banner">玉字格还有空。都填了再呈报。</p>
      ) : null}
      {batch3Result?.reason === "mismatch" ? (
        <p className="banner">玉字未合，整批驳回。请对圣旨、旌表、丧榜、素服再核。</p>
      ) : null}
      {batch3Locked ? (
        <p className="banner ok">嫡脉玉字已钤印。</p>
      ) : null}
      {batch4Result?.reason === "incomplete" ? (
        <p className="banner">另册格还有空。都填了再呈报。</p>
      ) : null}
      {batch4Result?.reason === "mismatch" ? (
        <p className="banner">另册未合，整批驳回。请对家书、灯下记、家塾、手札再核。</p>
      ) : null}
      {batch4Locked ? (
        <p className="banner ok">另册已钤印。</p>
      ) : null}
      {batch5Result?.reason === "incomplete" ? (
        <p className="banner">草字格还有空。都填了再呈报。</p>
      ) : null}
      {batch5Result?.reason === "mismatch" ? (
        <p className="banner">草字未合，整批驳回。请对孝子册、仿纸、月钱、夹页、金锁再核。</p>
      ) : null}
      {batch5Locked ? (
        <p className="banner ok">草字已钤印。全案已结。</p>
      ) : null}

      {!batch1Locked ? (
        <button className="submit" onClick={onSubmit1} type="button">
          呈报核验
        </button>
      ) : !batch2Locked ? (
        <button className="submit" onClick={onSubmit2} type="button">
          呈报核验
        </button>
      ) : !batch3Locked ? (
        <button className="submit" onClick={onSubmit3} type="button">
          呈报核验
        </button>
      ) : !batch4Locked ? (
        <button className="submit" onClick={onSubmit4} type="button">
          呈报核验
        </button>
      ) : (
        <button
          className="submit"
          disabled={batch5Locked}
          onClick={onSubmit5}
          type="button"
        >
          {batch5Locked ? "草字已核" : "呈报核验"}
        </button>
      )}
    </section>
  );
}

function Stem({ children }) {
  return <div className="tstem">{children}</div>;
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
