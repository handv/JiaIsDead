import { describe, expect, it } from "vitest";
import { scoreBatch } from "./scoreBatch.js";
import batch1 from "../data/batch1.json";
import batch2 from "../data/batch2.json";

function fillAll(slots, overrides = {}) {
  const placements = {};
  for (const slot of slots) {
    placements[slot.id] = { personId: slot.personId, role: slot.role };
  }
  return { ...placements, ...overrides };
}

describe("scoreBatch", () => {
  it("locks when every slot matches", () => {
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

  it("rejects a single swapped pair without naming the slot", () => {
    const result = scoreBatch(
      fillAll(batch1.slots, {
        "rong-wen-1": { personId: "zheng", role: "工部员外郎" },
        "rong-wen-2": { personId: "she", role: "袭一等将军" },
      }),
      batch1.slots,
    );
    expect(result).toEqual({ ok: false, reason: "mismatch" });
    expect(JSON.stringify(result)).not.toMatch(/rong-wen/);
  });

  it("rejects a correct person with the wrong title", () => {
    const result = scoreBatch(
      fillAll(batch1.slots, {
        "ning-gong": { personId: "yan", role: "荣国公" },
      }),
      batch1.slots,
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("mismatch");
  });
});

describe("scoreBatch batch2", () => {
  it("locks the marriage batch when every slot matches", () => {
    expect(scoreBatch(fillAll(batch2.slots), batch2.slots)).toEqual({
      ok: true,
      reason: "lock",
    });
  });

  it("rejects putting 黛玉 in the wrong role without naming the slot", () => {
    const result = scoreBatch(
      fillAll(batch2.slots, {
        "min-daughter": { personId: "daiyu", role: "政嫡妻" },
      }),
      batch2.slots,
    );
    expect(result).toEqual({ ok: false, reason: "mismatch" });
    expect(JSON.stringify(result)).not.toMatch(/min-daughter|daiyu/);
  });
});
