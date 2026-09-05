import { describe, expect, it } from "vitest";
import {
  buildClueNotice,
  clueGrantedExactlyAt,
  cluesForLockCount,
  collectCorrectSlotIds,
  isSlotCorrect,
  latestClueGrant,
  nextVerifiedIds,
  scoreBatch,
} from "./scoreBatch.js";
import batch1 from "../data/batch1.json";
import batch2 from "../data/batch2.json";
import batch3 from "../data/batch3.json";
import batch4 from "../data/batch4.json";
import batch5 from "../data/batch5.json";

const allSlots = [
  ...batch1.slots,
  ...batch2.slots,
  ...batch3.slots,
  ...batch4.slots,
  ...batch5.slots,
];

function fillAll(slots, overrides = {}) {
  const placements = {};
  for (const slot of slots) {
    placements[slot.id] = { personId: slot.personId, role: slot.role };
  }
  return { ...placements, ...overrides };
}

describe("isSlotCorrect", () => {
  it("accepts a matching name and office", () => {
    const slot = batch1.slots[0];
    expect(isSlotCorrect({ personId: slot.personId, role: slot.role }, slot)).toBe(
      true,
    );
  });

  it("rejects the right person with the wrong office", () => {
    expect(
      isSlotCorrect({ personId: "yan", role: "荣国公" }, batch1.slots[0]),
    ).toBe(false);
  });

  it("does not count an empty slot", () => {
    expect(isSlotCorrect({ personId: "", role: "" }, batch1.slots[0])).toBe(
      false,
    );
  });
});

describe("cluesForLockCount", () => {
  it("gives no paper before three locks", () => {
    expect(cluesForLockCount(0)).toEqual([]);
    expect(cluesForLockCount(2)).toEqual([]);
  });

  it("opens one paper every three locks", () => {
    expect(cluesForLockCount(3)).toEqual(["E05"]);
    expect(cluesForLockCount(6)).toEqual(["E05", "E07"]);
    expect(cluesForLockCount(9)).toEqual(["E05", "E07", "E31"]);
    expect(cluesForLockCount(12)).toEqual(["E05", "E07", "E31", "E45"]);
    expect(cluesForLockCount(34)).toEqual(["E05", "E07", "E31", "E45"]);
  });

  it("names the paper issued at each third lock", () => {
    expect(clueGrantedExactlyAt(3)?.evidenceId).toBe("E05");
    expect(clueGrantedExactlyAt(4)).toBeNull();
    expect(latestClueGrant(5)?.evidenceId).toBe("E05");
    expect(latestClueGrant(6)?.evidenceId).toBe("E07");
  });

  it("writes a hint that names the new scrap", () => {
    const titles = {
      E05: "寿礼正席",
      E07: "宫花回条",
      E31: "账房另册总目",
      E45: "草字总目",
    };
    expect(
      buildClueNotice({
        lockedCount: 3,
        titleById: titles,
        archiveTitles: ["荣府账房", "外亲来函"],
      }),
    ).toMatchObject({
      kind: "fresh",
      evidenceId: "E05",
      title: "寿礼正席",
      text: "对满三格。新发下：寿礼正席。档册新开荣府账房、外亲来函。",
    });
    expect(
      buildClueNotice({ lockedCount: 4, titleById: titles }).text,
    ).toBe("已核 4 格。已发：寿礼正席。");
    expect(
      buildClueNotice({ lockedCount: 2, titleById: titles }).text,
    ).toBe("已核 2 格。再凑满三格一并核认。");
  });
});

describe("collectCorrectSlotIds", () => {
  it("counts only matching slots", () => {
    const placements = fillAll(batch1.slots, {
      "rong-wen-1": { personId: "zheng", role: "工部员外郎" },
    });
    const ids = collectCorrectSlotIds(placements, batch1.slots);
    expect(ids).toHaveLength(8);
    expect(ids).not.toContain("rong-wen-1");
  });

  it("does not count a wrong office as a lock", () => {
    const placements = {
      "ning-gong": { personId: "yan", role: "荣国公" },
    };
    expect(collectCorrectSlotIds(placements, allSlots)).toEqual([]);
  });
});

describe("nextVerifiedIds", () => {
  const three = batch1.slots.slice(0, 3);
  const placements = fillAll(three);

  it("does not verify one or two correct slots", () => {
    expect(
      nextVerifiedIds(
        { [three[0].id]: placements[three[0].id] },
        three,
        [],
      ),
    ).toEqual([]);
    expect(
      nextVerifiedIds(
        {
          [three[0].id]: placements[three[0].id],
          [three[1].id]: placements[three[1].id],
        },
        three,
        [],
      ),
    ).toEqual([]);
  });

  it("verifies three new correct slots together", () => {
    expect(nextVerifiedIds(placements, three, [])).toEqual([
      three[0].id,
      three[1].id,
      three[2].id,
    ]);
  });

  it("does not add already locked slots", () => {
    expect(nextVerifiedIds(placements, allSlots, [three[0].id])).toEqual([]);
  });

  it("locks the last leftover slots when the rest are already verified", () => {
    const slice = batch1.slots.slice(0, 5);
    const locked = slice.slice(0, 3).map((slot) => slot.id);
    expect(nextVerifiedIds(fillAll(slice), slice, locked)).toEqual([
      slice[3].id,
      slice[4].id,
    ]);
  });
});

describe("scoreBatch", () => {
  it("still reports a full matching set", () => {
    expect(scoreBatch(fillAll(batch1.slots), batch1.slots)).toEqual({
      ok: true,
      reason: "lock",
    });
  });

  it("rejects an incomplete tree", () => {
    const placements = fillAll(batch1.slots);
    delete placements["ning-wen-1"];
    expect(scoreBatch(placements, batch1.slots)).toEqual({
      ok: false,
      reason: "incomplete",
    });
  });
});
