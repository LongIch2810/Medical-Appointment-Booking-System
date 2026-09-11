import assert from "node:assert/strict";
import test from "node:test";
import { detectExplicitRelationship } from "../../../src/utils/explicitRelationship.js";

test("returns null when no relationship word is present", () => {
  assert.equal(
    detectExplicitRelationship("Tôi muốn đặt lịch khám sáng mai"),
    null,
  );
});

test("detects 'cha' via 'bố'/'cha'/'ba'", () => {
  assert.equal(detectExplicitRelationship("Đặt lịch cho bố tôi"), "cha");
  assert.equal(detectExplicitRelationship("Đặt lịch cho cha tôi"), "cha");
  assert.equal(detectExplicitRelationship("Đặt lịch cho ba tôi"), "cha");
});

test("regression: 'ba' followed by a time/quantity unit is NOT read as 'cha' (the number 3, not the father)", () => {
  // This is the exact bug fixed in an earlier review pass: "ba giờ chiều"
  // (three PM) was previously misread as a reference to the patient's father.
  assert.equal(
    detectExplicitRelationship("Đặt khám lúc ba giờ chiều"),
    null,
  );
  assert.equal(
    detectExplicitRelationship("Trong vòng ba ngày nữa"),
    null,
  );
  assert.equal(detectExplicitRelationship("Khoảng ba tuần tới"), null);
  assert.equal(detectExplicitRelationship("Chờ ba phút nhé"), null);
});

test("still detects 'ba' as father when NOT followed by a time/quantity unit", () => {
  assert.equal(
    detectExplicitRelationship("Cho ba tôi đặt lịch khám"),
    "cha",
  );
  assert.equal(detectExplicitRelationship("ba của tôi bị đau bụng"), "cha");
});

test("detects 'me' via 'mẹ'/'má'", () => {
  assert.equal(detectExplicitRelationship("Đặt lịch cho mẹ tôi"), "me");
  assert.equal(detectExplicitRelationship("Đặt lịch cho má tôi"), "me");
});

test("detects 'ba' (grandmother, 'bà') distinctly from the father-matcher's 'ba'", () => {
  assert.equal(detectExplicitRelationship("Đặt lịch cho bà tôi"), "ba");
});

test("does not confuse 'ba' (grandmother) with 'bác' (aunt/uncle-in-law, unrecognized)", () => {
  // Word-boundary regex must not partially match "bác" as "ba".
  assert.equal(detectExplicitRelationship("Đặt lịch cho bác tôi"), null);
});

test("detects 'con gái'/'con trai' as multi-word phrases, not standalone 'con'", () => {
  assert.equal(
    detectExplicitRelationship("Đặt lịch cho con gái tôi"),
    "con_gai",
  );
  assert.equal(
    detectExplicitRelationship("Đặt lịch cho con trai tôi"),
    "con_trai",
  );
});

test("detects 'vợ'/'chồng' including the 'bà xã'/'ông xã' colloquialisms", () => {
  assert.equal(detectExplicitRelationship("Đặt lịch cho vợ tôi"), "vo_chong");
  assert.equal(
    detectExplicitRelationship("Đặt lịch cho bà xã tôi"),
    "vo_chong",
  );
  assert.equal(
    detectExplicitRelationship("Đặt lịch cho ông xã tôi"),
    "vo_chong",
  );
});

test("'bà xã' is read as spouse, not as the standalone grandmother match 'bà'", () => {
  // Matcher order matters: vo_chong's multi-word phrase must win over the
  // later, more general "bà" (grandmother) single-word matcher.
  assert.equal(detectExplicitRelationship("cho bà xã anh đi khám"), "vo_chong");
});

test("detects 'ông' (grandfather)", () => {
  assert.equal(detectExplicitRelationship("Đặt lịch cho ông tôi"), "ong");
});

test("detects other relatives (dượng, dì, cậu, chú, thím) as nguoi_than_khac", () => {
  for (const word of ["dượng", "dì", "cậu", "chú", "thím"]) {
    assert.equal(
      detectExplicitRelationship(`Đặt lịch cho ${word} tôi`),
      "nguoi_than_khac",
      `expected "${word}" to resolve to nguoi_than_khac`,
    );
  }
});

test("does not recognize bác/cô/anh/chị/em as a relative reference (reserved for addressing the doctor/bot)", () => {
  for (const word of ["bác", "cô", "anh", "chị", "em"]) {
    assert.equal(
      detectExplicitRelationship(`${word} ơi cho tôi hỏi`),
      null,
      `expected "${word}" to NOT resolve to a relationship`,
    );
  }
});

test("is case-insensitive and diacritics-preserving (normalizes before matching)", () => {
  assert.equal(detectExplicitRelationship("ĐẶT LỊCH CHO MẸ TÔI"), "me");
});
