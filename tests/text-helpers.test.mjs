import assert from "node:assert/strict";
import { test } from "node:test";
import { lineDiff, parseTimeInput } from "../src/lib/text-helpers.ts";

test("line diff recognizes additions and removals", () => {
  const out = lineDiff("alpha\nbeta\nend", "alpha\ngamma\nend");
  assert.deepEqual(out.map(x=>x.type), ["same", "added", "removed", "same"]);
  assert.throws(() => lineDiff(Array(302).fill("x").join("\n"), ""));
});
test("timestamps handle seconds, milliseconds and UTC strings", () => {
  assert.equal(parseTimeInput("0").toISOString(), "1970-01-01T00:00:00.000Z");
  assert.equal(parseTimeInput("1000").getTime(), 1000000);
  assert.equal(parseTimeInput("1700000000000").getTime(), 1700000000000);
  assert.equal(parseTimeInput("2026-10-16T10:00:00Z").getUTCFullYear(), 2026);
  assert.throws(() => parseTimeInput("2026-10-16"));
});
