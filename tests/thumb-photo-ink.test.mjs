import { test } from "node:test";
import assert from "node:assert/strict";
import {
  stylizeVisibleThumbDetails, thumbCrop, validateThumbSize, THUMB_INK_RGB,
} from "../src/lib/thumb-photo-ink.ts";

test("ink styles include the requested real black and blue output colors", () => {
  assert.deepEqual(THUMB_INK_RGB.black, [0, 0, 0]);
  assert.deepEqual(THUMB_INK_RGB.blue, [22, 67, 164]);
});

test("uniform photo provides no invented fingerprint detail", () => {
  const pixels = new Uint8ClampedArray(50 * 50 * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 150;
    pixels[i + 3] = 255;
  }
  const result = stylizeVisibleThumbDetails(pixels, 50, 50, "black", 7, 4);
  assert.equal(result.detailFraction, 0);
  for (let i = 0; i < pixels.length; i += 4) {
    assert.deepEqual(Array.from(pixels.subarray(i, i + 4)), [255, 255, 255, 255]);
  }
});

test("existing dark line maps to selected blue or black, not a generated shape", () => {
  for (const ink of ["black", "blue"]) {
    const pixels = new Uint8ClampedArray(50 * 50 * 4);
    for (let i = 0; i < pixels.length; i += 4) pixels.set([255, 255, 255, 255], i);
    for (let x = 8; x < 42; x++) pixels.set([25, 25, 25, 255], (25 * 50 + x) * 4);
    const result = stylizeVisibleThumbDetails(pixels, 50, 50, ink, 7, 4);
    assert.ok(result.detailFraction > 0);
    assert.deepEqual(Array.from(pixels.subarray((25 * 50 + 25) * 4, (25 * 50 + 25) * 4 + 3)), THUMB_INK_RGB[ink]);
    assert.deepEqual(Array.from(pixels.subarray(0, 3)), [255, 255, 255]);
  }
});

test("crop stays inside source and adjusts to target ratio", () => {
  const rect = thumbCrop(800, 1000, 200, 300, 2, 50, 60);
  assert.ok(rect.sx >= 0 && rect.sy >= 0);
  assert.ok(rect.sx + rect.sw <= 800 && rect.sy + rect.sh <= 1000);
  assert.ok(Math.abs(rect.sw / rect.sh - 2 / 3) < 1e-8);
});

test("out-of-range dimensions and malformed buffers reject safely", () => {
  assert.throws(() => validateThumbSize(4000, 4000));
  assert.throws(() => validateThumbSize(0, 500));
  assert.throws(() => thumbCrop(800, 800, 300, 300, 0, 50, 50));
  assert.throws(() => stylizeVisibleThumbDetails(new Uint8ClampedArray(20), 50, 50, "blue", 7, 4));
});
