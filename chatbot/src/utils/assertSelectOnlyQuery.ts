const FORBIDDEN_KEYWORDS =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|GRANT|REVOKE|CREATE|REPLACE|MERGE|CALL|EXEC|EXECUTE|COPY|VACUUM|ATTACH|DETACH|PRAGMA|INTO|DO|SET|RESET|LOCK|ANALYZE|CLUSTER|REFRESH|REINDEX|DISCARD|LISTEN|NOTIFY|UNLISTEN|LOAD|IMPORT)\b/i;

// Chặn SELECT chạm cột/bảng nhạy cảm (mật khẩu, OTP) dù hợp lệ cú pháp
// SELECT-only — AdminQaSqlTool dùng DataSourceRoot (quyền admin đầy đủ,
// không phải role chatbot_readonly), và {input} có thể chứa dữ liệu người
// dùng cuối cung cấp chưa validate (doctor_name, specialty_name).
const SENSITIVE_KEYWORDS = /\b(password|otp_?code|refresh_?token)\b|\botps\b/i;

// Comment dòng đơn ("-- ...") vô hại về mặt thực thi — Postgres bỏ qua toàn
// bộ phần còn lại của dòng, không thể dùng để "che" câu lệnh khác (đã có
// riêng check chặn nhiều câu lệnh/dấu ";" bên dưới). LLM rất hay tự thêm
// loại comment này khi sinh SQL nhiều bước (vd "-- breakdown by status"),
// nên chỉ LOẠI BỎ nó trước khi chạy các kiểm tra còn lại thay vì chặn thẳng,
// tránh chặn oan SQL hợp lệ. Comment khối (/* */) vẫn bị cấm hẳn: Postgres
// cho phép lồng nhau nên bóc tách an toàn phức tạp hơn nhiều và LLM không
// thực sự cần dùng dạng này.
const SQL_LINE_COMMENT = /--[^\n]*/g;
const SQL_BLOCK_COMMENT = /\/\*|\*\//;
const SYSTEM_OBJECTS =
  /\b(pg_catalog|information_schema|pg_[a-z0-9_]*|dblink|lo_export|lo_import|current_setting)\b/i;
const DEFAULT_ALLOWED_FUNCTIONS = new Set([
  "age",
  "array_agg",
  "avg",
  "btrim",
  "cast",
  "coalesce",
  "count",
  "date_part",
  "date_trunc",
  "extract",
  "json_agg",
  "json_build_object",
  "jsonb_agg",
  "jsonb_build_object",
  "lower",
  "max",
  "min",
  "nullif",
  "round",
  "string_agg",
  "sum",
  "to_char",
  "trim",
  "upper",
]);

// Không phải hàm SQL thật — đây là các từ khoá SQL hoàn toàn hợp lệ khi đứng
// ngay trước dấu "(" (mở subquery trong FROM/JOIN, mở điều kiện nhóm trong
// WHERE/AND/OR/ON, CTE...), nhưng regex bên dưới (assertAllowedFunctions)
// không phân biệt được "tên hàm gọi được" với "từ khoá + dấu ngoặc trùng
// hợp" — nếu không liệt kê riêng ở đây thì mọi subquery dạng
// "FROM (\n  SELECT ..." sẽ bị chặn oan là "gọi hàm FROM không được phép".
const SQL_KEYWORDS_BEFORE_PAREN = new Set([
  "and",
  "as",
  "between",
  "by",
  "exists",
  "filter",
  "from",
  "group",
  "having",
  "in",
  "join",
  "not",
  "on",
  "or",
  "order",
  "over",
  "select",
  "when",
  "where",
  "with",
]);

export type SelectQueryOptions = {
  allowedFunctions?: readonly string[];
  allowedTables?: readonly string[];
  maxRows?: number;
};

export class UnsafeSqlQueryError extends Error {
  constructor(_query: string, reason: string) {
    super(`Câu SQL không hợp lệ: ${reason}`);
    this.name = "UnsafeSqlQueryError";
  }
}

/**
 * Chặn mọi câu SQL không phải SELECT đơn (chống LLM sinh nhầm DML/DDL
 * hoặc stacked queries). Đây là lớp phòng thủ bổ sung, không thay thế
 * việc giới hạn quyền của DB user hay includesTables.
 */
export function assertSelectOnlyQuery(
  query: string | undefined | null,
  options: SelectQueryOptions = {},
): string {
  if (!query || typeof query !== "string" || !query.trim()) {
    throw new UnsafeSqlQueryError(String(query), "rỗng hoặc không phải chuỗi");
  }

  const trimmed = query.trim();
  const withoutTrailingSemicolon = trimmed.replace(/;\s*$/, "");

  if (withoutTrailingSemicolon.length > 10_000) {
    throw new UnsafeSqlQueryError(query, "vượt quá độ dài tối đa");
  }

  // Mọi kiểm tra an toàn bên dưới chạy trên bản đã loại bỏ comment dòng đơn.
  // Giá trị TRẢ VỀ (câu SQL thực thi) vẫn giữ nguyên comment gốc — vô hại vì
  // Postgres tự bỏ qua khi thực thi. Cùng giới hạn regex-based (không phải
  // parser SQL đầy đủ) như phần còn lại của file này — không phân biệt được
  // "--" bên trong chuỗi ký tự với comment thật, chấp nhận đánh đổi này vì
  // đây chỉ là lớp phòng thủ bổ sung, không thay quyền hạn chế của DB user.
  const checkText = withoutTrailingSemicolon.replace(SQL_LINE_COMMENT, "");

  if (SQL_BLOCK_COMMENT.test(checkText)) {
    throw new UnsafeSqlQueryError(
      query,
      "không cho phép SQL block comment (/* */)",
    );
  }

  if (checkText.includes(";")) {
    throw new UnsafeSqlQueryError(query, "không được chứa nhiều câu lệnh");
  }

  // Cho phép CTE ("WITH ... AS (...) SELECT ...") — vẫn là truy vấn đọc dữ
  // liệu hợp lệ, LLM hay dùng cho các phép tính tổng hợp/tỷ lệ phần trăm
  // nhiều bước. An toàn vì FORBIDDEN_KEYWORDS bên dưới quét toàn bộ chuỗi
  // (không chỉ từ đầu câu), nên chặn được cả CTE "che" DML kiểu
  // "WITH x AS (DELETE FROM ... RETURNING *) SELECT * FROM x".
  if (!/^(SELECT|WITH)\b/i.test(checkText.trim())) {
    throw new UnsafeSqlQueryError(
      query,
      "chỉ cho phép câu lệnh SELECT (có thể kèm CTE WITH)",
    );
  }

  if (FORBIDDEN_KEYWORDS.test(checkText)) {
    throw new UnsafeSqlQueryError(query, "chứa từ khoá bị cấm");
  }

  if (SENSITIVE_KEYWORDS.test(checkText)) {
    throw new UnsafeSqlQueryError(
      query,
      "truy vấn tới cột/bảng chứa dữ liệu nhạy cảm (mật khẩu, OTP...)",
    );
  }

  if (SYSTEM_OBJECTS.test(checkText)) {
    throw new UnsafeSqlQueryError(
      query,
      "không cho phép truy cập đối tượng hoặc hàm hệ thống",
    );
  }

  assertAllowedFunctions(checkText, options.allowedFunctions);
  assertAllowedTables(checkText, options.allowedTables);

  if (options.maxRows !== undefined) {
    if (!Number.isSafeInteger(options.maxRows) || options.maxRows < 1) {
      throw new Error("maxRows must be a positive integer");
    }

    const limitMatch = checkText.match(/\bLIMIT\s+(\d+)\b/i);
    if (limitMatch && Number(limitMatch[1]) > options.maxRows) {
      throw new UnsafeSqlQueryError(
        query,
        `LIMIT không được vượt quá ${options.maxRows}`,
      );
    }
    if (!limitMatch)
      return `${withoutTrailingSemicolon} LIMIT ${options.maxRows}`;
  }

  return withoutTrailingSemicolon;
}

function assertAllowedFunctions(
  query: string,
  extraAllowedFunctions: readonly string[] | undefined,
): void {
  const allowed = new Set(DEFAULT_ALLOWED_FUNCTIONS);
  for (const functionName of extraAllowedFunctions ?? []) {
    allowed.add(functionName.toLowerCase());
  }

  for (const match of query.matchAll(/\b([a-z_][a-z0-9_$]*)\s*\(/gi)) {
    const functionName = match[1].toLowerCase();
    if (SQL_KEYWORDS_BEFORE_PAREN.has(functionName)) continue;
    if (!allowed.has(functionName)) {
      throw new UnsafeSqlQueryError(
        query,
        `hàm SQL không được phép: ${functionName}`,
      );
    }
  }
}

function assertAllowedTables(
  query: string,
  allowedTables: readonly string[] | undefined,
): void {
  if (!allowedTables) return;

  const allowed = new Set(allowedTables.map((table) => table.toLowerCase()));
  const cteNames = new Set(
    [...query.matchAll(/\b([a-z_][a-z0-9_$]*)\s+AS\s*\(/gi)].map((match) =>
      match[1].toLowerCase(),
    ),
  );

  for (const match of query.matchAll(
    /\b(?:FROM|JOIN)\s+(?:"?([a-z_][a-z0-9_$]*)"?\.)?"?([a-z_][a-z0-9_$]*)"?/gi,
  )) {
    const schema = match[1]?.toLowerCase();
    const table = match[2].toLowerCase();
    if (
      (schema && schema !== "public") ||
      (!allowed.has(table) && !cteNames.has(table))
    ) {
      throw new UnsafeSqlQueryError(query, `bảng không được phép: ${table}`);
    }
  }
}
