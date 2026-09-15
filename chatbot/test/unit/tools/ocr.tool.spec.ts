import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import {
  BenhAnSchema,
  OCR_SYSTEM_PROMPT,
  buildOcrFilePart,
  buildOcrImageParts,
  ocrTool,
} from "../../../src/tools/ocr.tool.js";

// BenhAnSchema is a large, fully-required nested object (every leaf is a
// required z.string(), per the "empty field => \"\"" contract documented in
// ocr.tool.ts's own system prompt) — rather than hand-typing every one of its
// ~60 leaf fields, walk the schema itself to build a minimally-valid fixture
// (every string leaf "", every array leaf []). This exercises the *real*
// exported schema (so it breaks if the schema shape changes) without
// duplicating its structure by hand.
function buildValidFixture(schema: z.ZodTypeAny): unknown {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodTypeAny>;
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) {
      result[key] = buildValidFixture(shape[key]);
    }
    return result;
  }
  if (schema instanceof z.ZodArray) {
    return [];
  }
  return "";
}

test("ocr_tool is registered with the expected name, a non-empty description, and an array-of-image input schema", () => {
  assert.equal(ocrTool.name, "ocr_tool");
  assert.equal(typeof ocrTool.description, "string");
  assert.ok(ocrTool.description.length > 0);

  const validInput = [{ mimetype: "image/png", base64: "abc123" }];
  assert.equal(ocrTool.schema.safeParse(validInput).success, true);
});

test("ocr_tool's input schema rejects an empty array (min(1) requires at least one file)", () => {
  assert.equal(ocrTool.schema.safeParse([]).success, false);
});

test("ocr_tool's input schema rejects an item missing mimetype/base64", () => {
  assert.equal(
    ocrTool.schema.safeParse([{ mimetype: "image/png" }]).success,
    false,
  );
  assert.equal(
    ocrTool.schema.safeParse([{ base64: "abc123" }]).success,
    false,
  );
});

test("ocr_tool builds OpenAI image parts with image_url as an object", () => {
  assert.deepEqual(
    buildOcrImageParts([{ mimetype: "image/png", base64: "abc123" }]),
    [
      {
        type: "image_url",
        image_url: {
          url: "data:image/png;base64,abc123",
        },
      },
    ],
  );
});

test("ocr_tool's input schema accepts a single PDF file object", () => {
  const validInput = { mimetype: "application/pdf", base64: "abc123" };
  assert.equal(ocrTool.schema.safeParse(validInput).success, true);
});

test("ocr_tool's input schema rejects a PDF object with the wrong mimetype", () => {
  const invalidInput = { mimetype: "application/msword", base64: "abc123" };
  assert.equal(ocrTool.schema.safeParse(invalidInput).success, false);
});

test("ocr_tool builds a LangChain standard file content block for a PDF", () => {
  assert.deepEqual(
    buildOcrFilePart({ mimetype: "application/pdf", base64: "abc123" }),
    {
      type: "file",
      source_type: "base64",
      mime_type: "application/pdf",
      data: "abc123",
      metadata: { filename: "medical-record.pdf" },
    },
  );
});

test("BenhAnSchema accepts a fully-populated record built from its own shape", () => {
  const fixture = buildValidFixture(BenhAnSchema);
  const result = BenhAnSchema.safeParse(fixture);
  assert.equal(result.success, true);
});

test("BenhAnSchema rejects a record missing a required nested field (e.g. hanh_chinh.ho_ten)", () => {
  const fixture = buildValidFixture(BenhAnSchema) as any;
  delete fixture.hanh_chinh.ho_ten;
  const result = BenhAnSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test("BenhAnSchema rejects a record missing a whole top-level section", () => {
  const fixture = buildValidFixture(BenhAnSchema) as any;
  delete fixture.tong_ket;
  const result = BenhAnSchema.safeParse(fixture);
  assert.equal(result.success, false);
});

test("BenhAnSchema preserves identifiers, extended vital signs, medications, follow-up, and unmapped fields", () => {
  const fixture = buildValidFixture(BenhAnSchema) as any;
  fixture.thong_tin_chung.ma_ho_so = "HS-001";
  fixture.thong_tin_chung.ma_benh_nhan = "BN-001";
  fixture.thong_tin_chung.bac_si_phu_trach = "BS. Nguyễn An";
  fixture.chan_doan.danh_sach_chan_doan = [
    {
      giai_doan: "Ra viện",
      vai_tro: "Bệnh chính",
      ten_benh: "Chẩn đoán A",
      ma: "A00",
    },
  ];
  fixture.benh_an.kham_benh.toan_than.spo2 = "98%";
  fixture.benh_an.ket_qua_can_lam_sang = [
    {
      thoi_gian: "01/01/2026",
      nhom: "Huyết học",
      ten: "Hemoglobin",
      ket_qua: "145",
      don_vi: "g/L",
      khoang_tham_chieu: "130-170",
      nhan_xet: "Bình thường",
    },
  ];
  fixture.dieu_tri_chi_tiet.thuoc_ra_vien = [
    {
      ten: "Thuốc A",
      ham_luong: "10 mg",
      lieu_dung: "1 viên",
      duong_dung: "Uống",
      tan_suat: "Mỗi sáng",
      thoi_gian: "7 ngày",
      ghi_chu: "Sau ăn",
    },
  ];
  fixture.ke_hoach_theo_doi.tai_kham = "Sau 7 ngày";
  fixture.thong_tin_bo_sung = [
    { nhom: "Sản khoa", nhan: "PARA", gia_tri: "2002", trang: "2" },
  ];

  assert.equal(BenhAnSchema.safeParse(fixture).success, true);
});

test("OCR prompt is form-agnostic and contains no demo-record patch", () => {
  assert.match(OCR_SYSTEM_PROMPT, /không giả định tài liệu tuân theo một mẫu/i);
  assert.match(OCR_SYSTEM_PROMPT, /thong_tin_bo_sung/);
  assert.doesNotMatch(OCR_SYSTEM_PROMPT, /DEMO-MR|DEMO-PAT/);
});
