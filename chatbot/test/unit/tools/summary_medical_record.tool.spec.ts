import assert from "node:assert/strict";
import test from "node:test";
import {
  MedicalRecordSummarySectionsSchema,
  SUMMARY_SYSTEM_PROMPT,
  renderMedicalRecordSummary,
  summarizeMedicalRecordTool,
  type MedicalRecordSummarySections,
} from "../../../src/tools/summary_medical_record.tool.js";

const emptySections = (): MedicalRecordSummarySections => ({
  thong_tin_tai_lieu_va_nguoi_benh: [],
  dot_kham_dieu_tri: [],
  lam_sang: [],
  can_lam_sang: [],
  chan_doan: [],
  dieu_tri: [],
  tinh_trang_va_ke_hoach: [],
  diem_can_chu_y: [],
});

test("summary_medical_record_tool is registered with the expected name and input", () => {
  assert.equal(summarizeMedicalRecordTool.name, "summary_medical_record_tool");
  assert.ok(summarizeMedicalRecordTool.description.length > 0);
  assert.equal(
    summarizeMedicalRecordTool.schema.safeParse({ benh_an_json: "{}" })
      .success,
    true,
  );
  assert.equal(summarizeMedicalRecordTool.schema.safeParse({}).success, false);
  assert.equal(
    summarizeMedicalRecordTool.schema.safeParse({ benh_an_json: 123 }).success,
    false,
  );
});

test("structured summary requires evidence paths for every fact", () => {
  const sections = emptySections();
  const valid = {
    ...sections,
    lam_sang: [
      {
        nhan: "Nhiệt độ",
        noi_dung: "36,8°C",
        duong_dan_nguon: ["benh_an.kham_benh.toan_than.nhiet_do"],
      },
    ],
  };
  assert.equal(MedicalRecordSummarySectionsSchema.safeParse(valid).success, true);

  const missingEvidence = {
    ...sections,
    lam_sang: [{ nhan: "Nhiệt độ", noi_dung: "36,8°C" }],
  };
  assert.equal(
    MedicalRecordSummarySectionsSchema.safeParse(missingEvidence).success,
    false,
  );
});

test("renderer guarantees headings and removes unsupported or duplicate facts", () => {
  const sections = emptySections();
  sections.thong_tin_tai_lieu_va_nguoi_benh = [
    {
      nhan: "Họ tên",
      noi_dung: "NGUYỄN VĂN MINH",
      duong_dan_nguon: ["hanh_chinh.ho_ten"],
    },
  ];
  sections.lam_sang = [
    {
      nhan: "Nhiệt độ",
      noi_dung: "36,8°C",
      duong_dan_nguon: ["benh_an.kham_benh.toan_than.nhiet_do"],
    },
    {
      nhan: "Họ tên",
      noi_dung: "NGUYỄN VĂN MINH",
      duong_dan_nguon: ["hanh_chinh.ho_ten"],
    },
    {
      nhan: "Bệnh viện",
      noi_dung: "LIFEHEALTH",
      duong_dan_nguon: ["thong_tin_chung.benh_vien"],
    },
    {
      nhan: "Nhiệt độ sai",
      noi_dung: "38,5°C",
      duong_dan_nguon: ["benh_an.kham_benh.toan_than.nhiet_do"],
    },
  ];

  const markdown = renderMedicalRecordSummary(sections, {
    hanh_chinh: { ho_ten: "NGUYỄN VĂN MINH" },
    benh_an: { kham_benh: { toan_than: { nhiet_do: "36,8°C" } } },
    thong_tin_chung: { benh_vien: "LIFEHEALTH" },
    bang_chung_ocr: [
      {
        duong_dan: "hanh_chinh.ho_ten",
        trich_dan: "Họ tên: NGUYỄN VĂN MINH",
        trang: "1",
      },
      {
        duong_dan: "benh_an.kham_benh.toan_than.nhiet_do",
        trich_dan: "Nhiệt độ: 36,8°C",
        trang: "1",
      },
    ],
  });

  const headings = [
    "# Tóm tắt bệnh án",
    "## Thông tin tài liệu và người bệnh",
    "## Đợt khám/điều trị",
    "## Lâm sàng",
    "## Cận lâm sàng",
    "## Chẩn đoán",
    "## Điều trị",
    "## Tình trạng và kế hoạch tiếp theo",
    "## Điểm cần chú ý",
  ];
  let previousIndex = -1;
  for (const heading of headings) {
    const index = markdown.indexOf(heading);
    assert.ok(index > previousIndex, `${heading} must be rendered in order`);
    previousIndex = index;
  }

  assert.match(markdown, /- Nhiệt độ: 36,8°C/);
  assert.equal(markdown.match(/NGUYỄN VĂN MINH/g)?.length, 1);
  assert.doesNotMatch(markdown, /LIFEHEALTH/);
  assert.doesNotMatch(markdown, /38,5°C/);
  assert.match(markdown, /- Không có dữ liệu trong tài liệu/);

  sections.lam_sang = [
    {
      nhan: "Sinh hiệu",
      noi_dung: "Đã ghi nhận sinh hiệu",
      duong_dan_nguon: ["benh_an.kham_benh.toan_than"],
    },
  ];
  assert.doesNotMatch(
    renderMedicalRecordSummary(sections, {
      benh_an: { kham_benh: { toan_than: { nhiet_do: "36,8°C" } } },
      bang_chung_ocr: [
        {
          duong_dan: "benh_an.kham_benh.toan_than",
          trich_dan: "Nhiệt độ: 36,8°C",
          trang: "1",
        },
      ],
    }),
    /Đã ghi nhận sinh hiệu/,
  );
});

test("summary prompt is form-agnostic, complete and conservative", () => {
  assert.match(SUMMARY_SYSTEM_PROMPT, /nhiều loại tài liệu/i);
  assert.match(SUMMARY_SYSTEM_PROMPT, /duong_dan_nguon/);
  assert.match(SUMMARY_SYSTEM_PROMPT, /toàn bộ sinh hiệu/i);
  assert.match(SUMMARY_SYSTEM_PROMPT, /Chưa nghe âm thổi/);
  assert.match(SUMMARY_SYSTEM_PROMPT, /logo, thương hiệu/i);
  assert.match(SUMMARY_SYSTEM_PROMPT, /thuốc ra viện/i);
  assert.match(SUMMARY_SYSTEM_PROMPT, /thong_tin_bo_sung/);
  assert.doesNotMatch(SUMMARY_SYSTEM_PROMPT, /DEMO-MR|DEMO-PAT/);
});
