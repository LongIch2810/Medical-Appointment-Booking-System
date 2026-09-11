import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSelectOnlyQuery,
  UnsafeSqlQueryError,
} from "../../../src/utils/assertSelectOnlyQuery.js";

test("accepts a plain SELECT and strips the trailing semicolon", () => {
  const result = assertSelectOnlyQuery("SELECT * FROM users;");
  assert.equal(result, "SELECT * FROM users");
});

test("accepts a SELECT wrapped in a CTE (WITH ... SELECT)", () => {
  const query =
    "WITH totals AS (SELECT COUNT(*) AS c FROM appointments) SELECT c FROM totals";
  assert.equal(assertSelectOnlyQuery(query), query);
});

test("rejects an empty or non-string query", () => {
  assert.throws(() => assertSelectOnlyQuery(""), UnsafeSqlQueryError);
  assert.throws(() => assertSelectOnlyQuery("   "), UnsafeSqlQueryError);
  assert.throws(() => assertSelectOnlyQuery(undefined), UnsafeSqlQueryError);
  assert.throws(() => assertSelectOnlyQuery(null), UnsafeSqlQueryError);
});

test("rejects stacked statements even when the first one is a SELECT", () => {
  assert.throws(
    () => assertSelectOnlyQuery("SELECT 1; DROP TABLE users;"),
    UnsafeSqlQueryError,
  );
});

test("rejects statements that do not start with SELECT or WITH", () => {
  for (const query of [
    "INSERT INTO users (email) VALUES ('a@b.com')",
    "UPDATE users SET is_active = false",
    "DELETE FROM users",
    "DROP TABLE users",
  ]) {
    assert.throws(() => assertSelectOnlyQuery(query), UnsafeSqlQueryError);
  }
});

test("rejects a CTE that hides a DML statement behind a SELECT wrapper", () => {
  const query = "WITH x AS (DELETE FROM users RETURNING *) SELECT * FROM x";
  assert.throws(() => assertSelectOnlyQuery(query), UnsafeSqlQueryError);
});

test("rejects queries touching sensitive columns/tables even when syntactically a SELECT", () => {
  for (const query of [
    "SELECT password FROM users",
    "SELECT otp_code FROM otps",
    "SELECT refresh_token FROM sessions",
    "SELECT * FROM otps",
  ]) {
    assert.throws(() => assertSelectOnlyQuery(query), UnsafeSqlQueryError);
  }
});

test("is case-insensitive when detecting forbidden/sensitive keywords", () => {
  assert.throws(
    () => assertSelectOnlyQuery("select * from users; drop table users;"),
    UnsafeSqlQueryError,
  );
  assert.throws(
    () => assertSelectOnlyQuery("SELECT Password FROM Users"),
    UnsafeSqlQueryError,
  );
});

test("rejects PostgreSQL system access and non-allowlisted functions", () => {
  for (const query of [
    "SELECT pg_read_file('/etc/passwd')",
    "SELECT pg_sleep(60)",
    "SELECT lo_export(1, '/tmp/output')",
    "SELECT custom_side_effect()",
  ]) {
    assert.throws(() => assertSelectOnlyQuery(query), UnsafeSqlQueryError);
  }
});

test("enforces an allowlist of tables", () => {
  assert.throws(
    () =>
      assertSelectOnlyQuery("SELECT * FROM users", {
        allowedTables: ["doctors_view"],
      }),
    UnsafeSqlQueryError,
  );
  assert.equal(
    assertSelectOnlyQuery("SELECT * FROM doctors_view", {
      allowedTables: ["doctors_view"],
    }),
    "SELECT * FROM doctors_view",
  );
});

test("accepts a query with an inline single-line comment", () => {
  const query = [
    "SELECT",
    "  status,",
    "  -- breakdown by status",
    "  jsonb_agg(jsonb_build_object('status', status)) AS counts_by_status",
    "FROM appointments_view",
    "GROUP BY status",
  ].join("\n");
  assert.equal(assertSelectOnlyQuery(query), query);
});

test("still rejects a single-line comment hiding a stacked statement", () => {
  assert.throws(
    () => assertSelectOnlyQuery("SELECT 1 -- ; DROP TABLE users;\n; DROP TABLE users;"),
    UnsafeSqlQueryError,
  );
});

test("rejects block comments", () => {
  assert.throws(
    () => assertSelectOnlyQuery("SELECT 1 /* comment */"),
    UnsafeSqlQueryError,
  );
});

test("accepts a derived subquery in FROM/JOIN without flagging the keyword as a function call", () => {
  const query = [
    "SELECT d.doctor_name, s.total_slots",
    "FROM (",
    "  SELECT id, doctor_name FROM chatbot_report_doctors_view",
    ") d",
    "LEFT JOIN (",
    "  SELECT doctor_id, COUNT(*) AS total_slots",
    "  FROM chatbot_report_doctor_schedules_view",
    "  WHERE is_active = true",
    "  GROUP BY doctor_id",
    ") s ON s.doctor_id = d.id",
  ].join("\n");
  assert.equal(assertSelectOnlyQuery(query), query);
});

test("still rejects an actual disallowed function call even when it looks like a keyword prefix", () => {
  assert.throws(
    () => assertSelectOnlyQuery("SELECT formatted_output() FROM doctors_view"),
    UnsafeSqlQueryError,
  );
});

test("adds and caps a top-level row limit", () => {
  assert.equal(
    assertSelectOnlyQuery("SELECT * FROM doctors_view", { maxRows: 200 }),
    "SELECT * FROM doctors_view LIMIT 200",
  );
  assert.throws(
    () =>
      assertSelectOnlyQuery("SELECT * FROM doctors_view LIMIT 201", {
        maxRows: 200,
      }),
    UnsafeSqlQueryError,
  );
});
