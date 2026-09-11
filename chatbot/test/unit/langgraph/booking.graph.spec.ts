import assert from "node:assert/strict";
import test from "node:test";
import bookingGraph from "../../../src/langgraph/booking.graph.js";
import { AnalyzeRelativeTool } from "../../../src/tools/relative_analyzer.tool.js";
import { AnalyzeSpecialtyTool } from "../../../src/tools/specialty_name_analyzer.tool.js";
import { AnalyzeTimeTool } from "../../../src/tools/time_analyzer.tool.js";

const FULL_TIME = {
  appointment_date: "2026-09-10",
  day_of_week: "Thu",
  start_time: "08:00",
  end_time: "09:00",
};
const ONE_SPECIALTY = [{ id: 7, name: "Nội tổng quát" }];

function mockRelative(t: import("node:test").TestContext, result: unknown) {
  return t.mock.method(AnalyzeRelativeTool, "invoke", async () => result);
}
function mockSpecialty(t: import("node:test").TestContext, result: unknown) {
  return t.mock.method(AnalyzeSpecialtyTool, "invoke", async () => result);
}
function mockTime(t: import("node:test").TestContext, result: unknown) {
  return t.mock.method(AnalyzeTimeTool, "invoke", async () => result);
}

test("bookingGraph module imports cleanly and exposes an invokable compiled graph", () => {
  assert.equal(typeof bookingGraph, "object");
  assert.equal(typeof bookingGraph.invoke, "function");
});

test("reaches booking_appointment and reports UNAUTHENTICATED (no network call) once every field resolves and no token is supplied", async (t) => {
  mockRelative(t, { relatives: [{ id: 1, fullname: "Nguyen Van A", dob: "2010-01-01" }], relationship_code: "ban_than" });
  mockSpecialty(t, { candidate_specialties: ONE_SPECIALTY });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich kham", token: "" });

  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.selected_relative_id, 1);
  assert.equal(result.selected_specialty_id, 7);
  // bookingAppointmentNode short-circuits on a missing token before ever
  // calling axios, so this proves the full fan-out -> checker ->
  // booking_appointment path ran without any real network request.
  assert.equal(result.booking_result, null);
  assert.equal(result.booking_error?.code, "UNAUTHENTICATED");
});

test("stays not-ready and never runs booking_appointment when the specialty tool resolves nothing", async (t) => {
  mockRelative(t, { relatives: [{ id: 1, fullname: "Nguyen Van A", dob: "2010-01-01" }], relationship_code: "ban_than" });
  mockSpecialty(t, { candidate_specialties: [] });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich kham", token: "" });

  assert.equal(result.ready, false);
  assert.ok(result.missing.includes("selected_specialty_name"));
  assert.equal(result.selected_specialty_id, null);
  // checker_node routed to __end__, so booking_appointment never ran.
  assert.equal(result.booking_result, undefined);
  assert.equal(result.booking_error, undefined);
});

test("flags ambiguous_relatives and asks the caller to disambiguate when more than one relative matches", async (t) => {
  mockRelative(t, {
    relatives: [
      { id: 1, fullname: "Nguyen Van A", dob: "2010-01-01" },
      { id: 2, fullname: "Nguyen Van B", dob: "2015-05-05" },
    ],
    relationship_code: "con_trai",
  });
  mockSpecialty(t, { candidate_specialties: ONE_SPECIALTY });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich cho con", token: "" });

  assert.equal(result.ambiguous_relatives, true);
  assert.equal(result.ready, false);
  assert.equal(result.selected_relative_id, null);
  // ambiguity must never leave "selected_relative_id" missing — the intent
  // is a distinct question ("which one?"), not "you told me nothing".
  assert.ok(!result.missing.includes("selected_relative_id"));
});

test("degrades to a 'missing' field (not a lookup error) when a tool legitimately has nothing to report", async (t) => {
  mockRelative(t, { relatives: [], relationship_code: "ban_than" });
  mockSpecialty(t, { candidate_specialties: [] });
  mockTime(t, { appointment_date: "", day_of_week: "", start_time: "", end_time: "" });

  const result = await bookingGraph.invoke({ text_input: "xin chao", token: "" });

  assert.equal(result.relative_lookup_error, false);
  assert.equal(result.specialty_resolve_error, false);
  assert.ok(result.missing.includes("selected_relative_id"));
  assert.ok(result.missing.includes("selected_specialty_name"));
  assert.ok(result.missing.includes("appointment_date"));
  assert.ok(result.missing.includes("start_time"));
  assert.equal(result.ready, false);
});

test("runToolSafe falls back and flags lookup_error distinctly when a tool throws instead of resolving", async (t) => {
  t.mock.method(AnalyzeRelativeTool, "invoke", async () => {
    throw new Error("LLM gateway timeout");
  });
  t.mock.method(AnalyzeSpecialtyTool, "invoke", async () => {
    throw new Error("LLM gateway timeout");
  });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich kham", token: "" });

  assert.equal(result.relative_lookup_error, true);
  assert.equal(result.specialty_resolve_error, true);
  assert.equal(result.relatives.length, 0);
  assert.equal(result.ready, false);
  // checker_node itself doesn't special-case relative_lookup_error — it
  // still lists "selected_relative_id" as missing either way. It's
  // booking_appointment.tool.ts's formatBookingResult (covered by its own
  // spec) that reads relative_lookup_error to phrase a distinct "system is
  // having trouble" message instead of "you didn't tell me". Assert both
  // flags survive the fan-out untouched so that downstream formatting can
  // rely on them.
  assert.ok(result.missing.includes("selected_relative_id"));
});

test("prepares a new_relative_candidate and asks only for the fields the user did not already supply", async (t) => {
  mockRelative(t, {
    relatives: [],
    relationship_code: "con_gai",
    name: null,
    dob: "2016-02-02",
    gender: null,
  });
  mockSpecialty(t, { candidate_specialties: ONE_SPECIALTY });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich cho con gai toi", token: "" });

  assert.equal(result.relative_not_found_label, "con gái");
  assert.ok(result.new_relative_candidate);
  // gender is inferable from relationship_code=con_gai (GENDER_BY_RELATIONSHIP_CODE),
  // so only fullname should still be reported missing.
  assert.equal(result.new_relative_candidate.gender, false);
  assert.equal(result.new_relative_candidate.dob, "2016-02-02");
  assert.ok(result.missing.includes("new_relative_fullname"));
  assert.ok(!result.missing.includes("new_relative_gender"));
  assert.equal(result.ready, false);
});

test("books for a brand-new relative profile once fullname/dob/gender are all known, still without any network call", async (t) => {
  mockRelative(t, {
    relatives: [],
    relationship_code: "con_trai",
    name: "Be Nam",
    dob: "2018-03-01",
    gender: null,
  });
  mockSpecialty(t, { candidate_specialties: ONE_SPECIALTY });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich cho con trai toi ten Be Nam sinh 2018-03-01", token: "" });

  assert.equal(result.ready, true);
  assert.deepEqual(result.missing, []);
  const candidate = result.new_relative_candidate;
  assert.ok(candidate);
  assert.equal(candidate.fullname, "Be Nam");
  assert.equal(candidate.dob, "2018-03-01");
  assert.equal(candidate.gender, true);
  assert.equal(result.booking_error?.code, "UNAUTHENTICATED");
});

// dob is intentionally NOT required (product decision: don't make users
// type a birth date just to book — see BodyCreateRelativeDto.dob's
// @IsOptional(), and relatives.dob is a nullable DB column already).
test("books for a brand-new relative profile without asking for dob when it's unknown", async (t) => {
  mockRelative(t, {
    relatives: [],
    relationship_code: "con_trai",
    name: "Be Nam",
    dob: null,
    gender: null,
  });
  mockSpecialty(t, { candidate_specialties: ONE_SPECIALTY });
  mockTime(t, FULL_TIME);

  const result = await bookingGraph.invoke({ text_input: "dat lich cho con trai toi ten Be Nam", token: "" });

  assert.equal(result.ready, true);
  assert.ok(!result.missing.includes("new_relative_dob"));
  assert.deepEqual(result.missing, []);
  const candidate = result.new_relative_candidate;
  assert.ok(candidate);
  assert.equal(candidate.dob, null);
  assert.equal(result.booking_error?.code, "UNAUTHENTICATED");
});
