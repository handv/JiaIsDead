import { describe, expect, it } from "vitest";
import { scoreBatch } from "./scoreBatch.js";
import batch1 from "../data/batch1.json";

function fillAll(overrides = {}) {
  const placements = {};
  for (const slot of batch1.slots) {
    placements[slot.id] = { personId: slot.personId, role: slot.role };
  }
  return { ...placements, ...overrides };
}

describe("scoreBatch", () => {
  it("locks when every slot matches", () => {
    expect(scoreBatch(fillAll(), batch1.slots)).toEqual({
      ok: true,
      reason: "lock",
    });
  });

  it("rejects an incomplete tree", () => {
    const placements = fillAll();
    delete placements["ning-wen-1"];
    expect(scoreBatch(placements, batch1.slots)).toEqual({
      ok: false,
      reason: "incomplete",
    });
  });

  it("rejects a single swapped pair without naming the slot", () => {
    const result = scoreBatch(
      fillAll({
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
      fillAll({
        "ning-gong": { personId: "yan", role: "荣国公" },
      }),
      batch1.slots,
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("mismatch");
  });
});
