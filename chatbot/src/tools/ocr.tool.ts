import * as dotenv from "dotenv";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getVisionModel } from "../configs/llm.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { extractImgUrl } from "../utils/extractImgUrl.js";

dotenv.config();

const TruongBoSungSchema = z.object({
  nhom: z
    .string()
    .describe("Tên phần/nhóm chứa thông tin, giữ theo tiêu đề trong tài liệu"),
  nhan: z.string().describe("Nhãn trường hoặc tên mục như được ghi trong tài liệu"),
  gia_tri: z.string().describe("Giá trị nguyên văn tương ứng với nhãn"),
  trang: z
    .string()
    .describe("Số trang chứa thông tin nếu xác định được, nếu không thì để trống"),
});

const KetQuaCanLamSangSchema = z.object({
  thoi_gian: z.string().describe("Ngày/giờ thực hiện hoặc trả kết quả"),
  nhom: z
    .string()
    .describe("Nhóm xét nghiệm, chẩn đoán hình ảnh hoặc thăm dò chức năng"),
  ten: z.string().describe("Tên xét nghiệm hoặc thăm dò"),
  ket_qua: z.string().describe("Kết quả nguyên văn, không tự diễn giải"),
  don_vi: z.string().describe("Đơn vị được in trong tài liệu"),
  khoang_tham_chieu: z.string().describe("Khoảng tham chiếu/ngưỡng tham chiếu"),
  nhan_xet: z
    .string()
    .describe("Nhận xét/kết luận do tài liệu ghi, không tự tạo nhận xét mới"),
});

const ThuocSchema = z.object({
  ten: z.string().describe("Tên thuốc"),
  ham_luong: z.string().describe("Hàm lượng/nồng độ"),
  lieu_dung: z.string().describe("Liều dùng mỗi lần hoặc tổng liều"),
  duong_dung: z.string().describe("Đường dùng"),
  tan_suat: z.string().describe("Tần suất và thời điểm dùng"),
  thoi_gian: z.string().describe("Thời gian dùng hoặc số ngày cấp thuốc"),
  ghi_chu: z.string().describe("Chỉ định khi cần, cảnh báo hoặc lưu ý đi kèm"),
});

const BangChungOcrSchema = z.object({
  duong_dan: z
    .string()
    .min(1)
    .describe(
      "Đường dẫn đầy đủ tới một trường giá trị cuối trong JSON, gồm chỉ số mảng khi có",
    ),
  trich_dan: z
    .string()
    .min(1)
    .describe(
      "Đoạn nguyên văn trên tài liệu chứa đầy đủ giá trị đã trích xuất và đủ ngữ cảnh để xác định đúng nhãn/vai trò",
    ),
  trang: z
    .string()
    .min(1)
    .describe("Số trang hoặc số thứ tự ảnh chứa trích dẫn, bắt đầu từ 1"),
});

// 1. Phần Đầu trang (Header)
const HeaderSchema = z.object({
  loai_tai_lieu: z
    .string()
    .describe(
      "Loại tài liệu được ghi trên hồ sơ, ví dụ bệnh án nội trú, phiếu khám, giấy ra viện, đơn thuốc, kết quả xét nghiệm",
    ),
  ngay_lap: z
    .string()
    .describe(
      "Ngày/giờ lập, ký hoặc phát hành tài liệu — chỉ lấy khi có nhãn hoặc câu chữ xác định đúng vai trò này; không dùng ngày nhập viện, ra viện, khám hay xét nghiệm thay thế",
    ),
  so_y_te: z
    .string()
    .describe(
      "Tên Sở Y tế/cơ quan y tế cấp trên — dạng TÊN cơ quan (chữ), KHÔNG phải mã số/ID. Không lấy bất kỳ mã hồ " +
        "sơ, mã bệnh nhân, hay mã định danh nào khác điền vào đây dù không có tên cơ quan y tế nào được ghi.",
    ),
  benh_vien: z
    .string()
    .describe(
      "Tên bệnh viện/cơ sở khám chữa bệnh — chỉ lấy khi có nhãn cơ sở hoặc tên đầy đủ thể hiện rõ đây là đơn vị y tế; logo, thương hiệu hay chữ đầu trang đứng riêng không đủ bằng chứng",
    ),
  khoa: z.string().describe("Tên khoa"),
  giuong: z.string().describe("Số giường"),
  ma_so_benh_an: z
    .string()
    .describe(
      "Mã/số bệnh án của lần khám hoặc đợt điều trị, chỉ lấy khi nhãn nguồn thể hiện rõ là Mã BA, Mã bệnh án hoặc Số bệnh án",
    ),
  ma_ho_so: z
    .string()
    .describe("Mã hồ sơ, chỉ lấy từ trường được ghi rõ là Mã hồ sơ hoặc tương đương"),
  ma_benh_nhan: z
    .string()
    .describe("Mã bệnh nhân/MRN, chỉ lấy từ trường có nhãn tương ứng"),
  so_vao_vien: z.string().describe("Số vào viện/số nhập viện/encounter number"),
  ma_mau_bieu: z.string().describe("Mã hoặc số hiệu mẫu biểu in sẵn"),
  bac_si_phu_trach: z
    .string()
    .describe("Bác sĩ phụ trách, bác sĩ điều trị hoặc người lập tài liệu"),
  so_luu_tru: z
    .string()
    .describe(
      "Số lưu trữ hồ sơ tại kho lưu trữ của bệnh viện — chỉ điền khi tài liệu có ghi riêng mục này, không lấy " +
        "mã hồ sơ/mã bệnh nhân thay thế",
    ),
  ma_yt: z
    .string()
    .describe(
      "Mã Y tế do cơ sở y tế cấp — chỉ điền khi tài liệu có ghi riêng mục này, không lấy mã hồ sơ/mã bệnh nhân " +
        "thay thế",
    ),
});

// 2. Phần I - Hành chính
const HanhChinhSchema = z.object({
  ho_ten: z.string().describe("Họ và tên bệnh nhân (In hoa)"),
  ngay_sinh: z.string().describe("Ngày sinh hoặc tuổi"),
  gioi_tinh: z.string().describe("Giới tính"),
  nghe_nghiep: z.string().describe("Nghề nghiệp"),
  dan_toc: z.string().describe("Dân tộc"),
  ngoai_kieu: z.string().describe("Ngoại kiều (Quốc tịch)"),
  nhom_mau: z.string().describe("Nhóm máu"),
  so_dien_thoai: z.string().describe("Số điện thoại của người bệnh"),
  dia_chi: z.object({
    chi_tiet: z.string().describe("Số nhà, thôn, xóm"),
    huyen_quan: z.string().describe("Huyện (Quận, Tx)"),
    tinh_thanh: z.string().describe("Tỉnh, thành phố"),
  }),
  noi_lam_viec: z.string().describe("Nơi làm việc"),
  doi_tuong: z.string().describe("Đối tượng (1.BHYT, 2.Thu phí, 3.Miễn)"),
  bao_hiem_y_te: z.object({
    gia_tri_den: z.string().describe("BHYT giá trị đến ngày"),
    so_the: z.string().describe("Số thẻ BHYT"),
  }),
  nguoi_bao_tin: z.object({
    ho_ten_dia_chi: z.string().describe("Họ tên, địa chỉ người nhà"),
    so_dien_thoai: z.string().describe("Số điện thoại người nhà"),
  }),
});

// 3. Phần II - Quản lý người bệnh
const QuanLyNguoiBenhSchema = z.object({
  vao_vien: z.object({
    thoi_gian: z.string().describe("Thời gian vào viện (Giờ, ngày)"),
    truc_tiep_vao: z
      .string()
      .describe("Trực tiếp vào (Cấp cứu/KKB/Khoa điều trị)"),
    noi_gioi_thieu: z.string().describe("Nơi giới thiệu"),
    lan_thu: z.string().describe("Vào viện do bệnh này lần thứ"),
  }),
  vao_khoa: z
    .string()
    .describe(
      "Thời gian vào khoa — CHỈ điền nếu tài liệu có mục 'vào khoa' ghi thời gian riêng biệt với 'vào viện'; " +
        "không tự lấy lại giá trị của 'vào viện' hay 'ra viện' khi không có mục này",
    ),
  chuyen_khoa: z
    .array(
      z.object({
        khoa: z.string().describe("Tên khoa chuyển đến"),
        thoi_gian: z.string().describe("Thời gian chuyển khoa"),
      })
    )
    .describe("Lịch sử chuyển khoa"),
  chuyen_vien: z.object({
    loai_chuyen: z.string().describe("Chuyển viện (Tuyến trên/dưới/CK)"),
    noi_den: z.string().describe("Tên nơi chuyển đến"),
  }),
  ra_vien: z.object({
    thoi_gian: z.string().describe("Thời gian ra viện"),
    hinh_thuc: z.string().describe("Ra viện/Xin về/Bỏ về/Đưa về"),
    tong_so_ngay_dieu_tri: z
      .string()
      .describe(
        "Tổng số ngày điều trị — CHỈ điền nếu tài liệu ghi thẳng con số này bằng chữ/số; " +
          "KHÔNG tự tính bằng cách trừ ngày ra viện cho ngày vào viện",
      ),
  }),
});

// 4. Phần III - Chẩn đoán (Bao gồm cả mã ICD)
const ChanDoanSchema = z.object({
  danh_sach_chan_doan: z
    .array(
      z.object({
        giai_doan: z
          .string()
          .describe("Thời điểm/nguồn chẩn đoán: tiếp nhận, sơ bộ, vào khoa, sau thủ thuật, ra viện hoặc khác"),
        vai_tro: z
          .string()
          .describe("Vai trò được ghi: chính, kèm theo, phân biệt, biến chứng hoặc khác"),
        ten_benh: z.string().describe("Tên chẩn đoán nguyên văn"),
        ma: z.string().describe("Mã ICD hoặc mã chẩn đoán đi kèm"),
      }),
    )
    .describe(
      "Danh sách đầy đủ các chẩn đoán có nhãn rõ, dùng được cho tài liệu không theo các ô chẩn đoán chuẩn bên dưới",
    ),
  noi_chuyen_den: z.object({
    ten_benh: z.string().describe("Chẩn đoán nơi chuyển đến"),
    ma: z.string().describe("Mã bệnh nơi chuyển đến"),
  }),
  kkb_cap_cuu: z.object({
    ten_benh: z.string().describe("Chẩn đoán KKB, Cấp cứu"),
    ma: z.string().describe("Mã bệnh KKB, Cấp cứu"),
  }),
  khi_vao_khoa: z.object({
    ten_benh: z.string().describe("Chẩn đoán khi vào khoa điều trị"),
    ma: z.string().describe("Mã bệnh khi vào khoa"),
  }),
  ra_vien: z.object({
    benh_chinh: z.object({
      ten_benh: z.string().describe("Bệnh chính ra viện"),
      ma: z.string().describe("Mã bệnh chính"),
    }),
    benh_kem_theo: z.object({
      ten_benh: z.string().describe("Bệnh kèm theo"),
      ma: z.string().describe("Mã bệnh kèm theo"),
    }),
    tai_bien: z.string().describe("Tai biến"),
    bien_chung: z.string().describe("Biến chứng"),
  }),
  phau_thuat_thu_thuat: z.string().describe("Thông tin Phẫu thuật/Thủ thuật"),
});

// 5. Phần IV - Tình trạng ra viện
const TinhTrangRaVienSchema = z.object({
  ket_qua_dieu_tri: z
    .string()
    .describe(
      "Kết quả (chỉ chọn 1 trong 5 nhãn: Khỏi/Đỡ/Không đổi/Nặng hơn/Tử vong) — CHỈ chọn khi tài liệu diễn đạt " +
        "đủ rõ để khớp chắc chắn với đúng 1 nhãn (vd tài liệu dùng đúng từ đó, hoặc mô tả không thể hiểu khác " +
        "được); nếu mô tả chung chung/mơ hồ hoặc có thể khớp nhiều hơn 1 nhãn, để trống '' thay vì đoán",
    ),
  giai_phau_benh: z
    .string()
    .describe(
      "Kết quả giải phẫu bệnh (Lành tính/Nghi ngờ/Ác tính) — chỉ lấy từ mục/kết quả giải phẫu bệnh được ghi rõ; không suy ra từ tình trạng ra viện hoặc chẩn đoán",
    ),
  tu_vong: z.object({
    thoi_gian: z.string().describe("Thời gian tử vong"),
    nguyen_nhan_chinh: z.string().describe("Nguyên nhân chính tử vong"),
    kham_nghiem_tu_thi: z.string().describe("Khám nghiệm tử thi (Có/Không)"),
    chan_doan_giai_phau: z.string().describe("Chẩn đoán giải phẫu tử thi"),
  }),
});

// 6. Phần A - Bệnh án (Lâm sàng)
const LamSangSchema = z.object({
  ly_do_vao_vien: z.string().describe("Lý do vào viện"),
  hoi_benh: z.object({
    qua_trinh_benh_ly: z.string().describe("Quá trình bệnh lý"),
    tien_su: z.object({
      ban_than: z
        .string()
        .describe("Tiền sử bệnh lý nền của bản thân (nếu tài liệu có ghi)"),
      thuoc_dang_dung_truoc_nhap_vien: z
        .string()
        .describe(
          "Thuốc đang dùng trước khi nhập viện: tên thuốc, liều dùng, mức độ tuân thủ nếu tài liệu có ghi",
        ),
      tien_su_phau_thuat: z
        .string()
        .describe(
          "Tiền sử phẫu thuật/thủ thuật đã thực hiện TRƯỚC lần nhập viện này (khác với mục phẫu thuật/thủ thuật " +
            "trong lần điều trị hiện tại ở phần chẩn đoán), kèm thời gian nếu tài liệu có ghi",
        ),
      dac_diem_lien_quan: z.object({
        di_ung: z
          .string()
          .describe(
            "Dị ứng, kèm mô tả thời gian/mức độ nếu tài liệu có ghi (giữ nguyên văn, không phải bắt buộc là một ngày tháng cụ thể)",
          ),
        ma_tuy: z
          .string()
          .describe(
            "Sử dụng ma túy, kèm tần suất/thời lượng nếu tài liệu có ghi (vd: '3-4 lần/tuần', '10 năm') — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        ruou_bia: z
          .string()
          .describe(
            "Uống rượu bia, kèm tần suất/thời lượng nếu tài liệu có ghi (vd: '3-4 lần/tuần') — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        thuoc_la: z
          .string()
          .describe(
            "Hút thuốc lá, kèm tần suất/thời lượng nếu tài liệu có ghi (vd: '10 điếu/ngày trong 25 năm') — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        thuoc_lao: z
          .string()
          .describe(
            "Hút thuốc lào, kèm tần suất/thời lượng nếu tài liệu có ghi — không phải bắt buộc là một ngày tháng cụ thể",
          ),
        khac: z
          .string()
          .describe(
            "Đặc điểm khác (vd: chế độ ăn, mức độ vận động, các yếu tố nguy cơ khác nếu tài liệu có ghi)",
          ),
      }),
      gia_dinh: z.string().describe("Tiền sử gia đình"),
    }),
  }),
  kham_benh: z.object({
    toan_than: z.object({
      mach: z.string().describe("Mạch (lần/ph)"),
      nhiet_do: z.string().describe("Nhiệt độ (độ C)"),
      huyet_ap: z.string().describe("Huyết áp (mmHg)"),
      nhip_tho: z.string().describe("Nhịp thở (lần/ph)"),
      can_nang: z.string().describe("Cân nặng (kg)"),
      chieu_cao: z.string().describe("Chiều cao"),
      bmi: z.string().describe("Chỉ số BMI"),
      spo2: z.string().describe("SpO2/độ bão hòa oxy"),
      muc_do_dau: z.string().describe("Mức độ đau hoặc thang điểm đau"),
      mo_ta_chung: z.string().describe("Mô tả khám toàn thân"),
    }),
    cac_co_quan: z.object({
      tuan_hoan: z.string().describe("Khám tuần hoàn"),
      ho_hap: z.string().describe("Khám hô hấp"),
      tieu_hoa: z.string().describe("Khám tiêu hóa"),
      than_tiet_nieu: z.string().describe("Khám Thận - Tiết niệu - Sinh dục"),
      than_kinh: z.string().describe("Khám Thần kinh"),
      co_xuong_khop: z.string().describe("Khám Cơ - Xương - Khớp"),
      tai_mui_hong: z.string().describe("Khám Tai - Mũi - Họng"),
      rang_ham_mat: z.string().describe("Khám Răng - Hàm - Mặt"),
      mat: z.string().describe("Khám Mắt"),
      noi_tiet_khac: z.string().describe("Khám Nội tiết và các bệnh lý khác"),
    }),
  }),
  can_lam_sang: z.string().describe("Các xét nghiệm cận lâm sàng cần làm"),
  ket_qua_can_lam_sang: z
    .array(KetQuaCanLamSangSchema)
    .describe(
      "Tất cả kết quả xét nghiệm, chẩn đoán hình ảnh và thăm dò chức năng có trong tài liệu; mỗi kết quả là một phần tử riêng",
    ),
  tom_tat_benh_an: z.string().describe("Tóm tắt bệnh án"),
  chan_doan_so_bo: z.object({
    benh_chinh: z.string().describe("Chẩn đoán bệnh chính"),
    benh_kem_theo: z.string().describe("Chẩn đoán bệnh kèm theo"),
    phan_biet: z.string().describe("Chẩn đoán phân biệt"),
  }),
  tien_luong: z.string().describe("Tiên lượng"),
  huong_dieu_tri: z.string().describe("Hướng điều trị"),
});

// 7. Phần B - Tổng kết bệnh án
const TongKetSchema = z.object({
  qua_trinh_dien_bien: z
    .string()
    .describe("Quá trình bệnh lý và diễn biến lâm sàng"),
  tom_tat_kq_xet_nghiem: z
    .string()
    .describe(
      "Tóm tắt các kết quả xét nghiệm/cận lâm sàng có giá trị (số liệu, chỉ số, hình ảnh, kết luận thăm dò chức " +
        "năng...) — CHỈ chứa kết quả xét nghiệm, KHÔNG chứa tên chẩn đoán/bệnh (chẩn đoán đã có ở phần chan_doan " +
        "riêng, không lặp lại ở đây)",
    ),
  phuong_phap_dieu_tri: z.string().describe("Phương pháp điều trị"),
  tinh_trang_ra_vien: z.string().describe("Tình trạng người bệnh ra viện"),
  huong_dieu_tri_tiep: z
    .string()
    .describe("Hướng điều trị và chế độ tiếp theo"),
  ho_so_luu: z.object({
    x_quang: z.string().describe("Số tờ X-quang"),
    ct_scanner: z.string().describe("Số tờ CT Scanner"),
    sieu_am: z.string().describe("Số tờ Siêu âm"),
    xet_nghiem: z.string().describe("Số tờ Xét nghiệm"),
    khac: z.string().describe("Số tờ Khác"),
    toan_bo_ho_so: z.string().describe("Tổng số tờ hồ sơ"),
  }),
  nguoi_giao_ho_so: z.string().describe("Họ tên người giao hồ sơ"),
  nguoi_nhan_ho_so: z.string().describe("Họ tên người nhận hồ sơ"),
  bac_si_dieu_tri: z.string().describe("Họ tên bác sĩ điều trị ký tên"),
});

const DieuTriSchema = z.object({
  thuoc_trong_dot_dieu_tri: z
    .array(ThuocSchema)
    .describe("Thuốc đã dùng trong lần khám/đợt điều trị hiện tại"),
  thuoc_ra_vien: z
    .array(ThuocSchema)
    .describe("Thuốc kê khi ra viện hoặc thuốc tiếp tục dùng tại nhà"),
  phau_thuat_thu_thuat: z
    .array(
      z.object({
        thoi_gian: z.string().describe("Ngày/giờ thực hiện"),
        ten: z.string().describe("Tên phẫu thuật, thủ thuật hoặc can thiệp"),
        ket_qua: z.string().describe("Kết quả hoặc ghi chú được tài liệu ghi"),
      }),
    )
    .describe("Các phẫu thuật, thủ thuật và can thiệp trong đợt hiện tại"),
  dieu_tri_khac: z
    .string()
    .describe("Điều trị không dùng thuốc, chăm sóc, tư vấn và can thiệp khác"),
});

const KeHoachTheoDoiSchema = z.object({
  tai_kham: z.string().describe("Lịch và nơi tái khám"),
  xet_nghiem_theo_doi: z.string().describe("Xét nghiệm/thăm dò cần theo dõi"),
  thuoc_va_tuan_thu: z.string().describe("Hướng dẫn sử dụng thuốc và tuân thủ"),
  che_do_sinh_hoat: z.string().describe("Chế độ ăn, vận động và sinh hoạt"),
  dau_hieu_canh_bao: z
    .string()
    .describe("Dấu hiệu phải khám sớm hoặc cấp cứu và cách xử trí được dặn"),
});

export const BenhAnSchema = z.object({
  thong_tin_chung: HeaderSchema,
  hanh_chinh: HanhChinhSchema,
  quan_ly_nguoi_benh: QuanLyNguoiBenhSchema,
  chan_doan: ChanDoanSchema,
  tinh_trang_ra_vien: TinhTrangRaVienSchema,
  benh_an: LamSangSchema,
  tong_ket: TongKetSchema,
  dieu_tri_chi_tiet: DieuTriSchema,
  ke_hoach_theo_doi: KeHoachTheoDoiSchema,
  thong_tin_bo_sung: z
    .array(TruongBoSungSchema)
    .describe(
      "Các thông tin có ý nghĩa trong tài liệu nhưng không có trường chuyên biệt ở schema; không lặp lại dữ liệu đã ánh xạ",
    ),
  bang_chung_ocr: z
    .array(BangChungOcrSchema)
    .describe(
      "Một bằng chứng riêng cho mọi trường giá trị khác rỗng trong JSON; không tạo bằng chứng cho chính mảng này",
    ),
});

export type BenhAn = z.infer<typeof BenhAnSchema>;

const normalizeEvidenceText = (value: string) =>
  value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

const evidenceContainsValue = (quote: string, value: string) => {
  const normalizedQuote = normalizeEvidenceText(quote);
  const normalizedValue = normalizeEvidenceText(value);
  return (
    normalizedQuote.length > 0 &&
    normalizedValue.length > 0 &&
    normalizedQuote.includes(normalizedValue)
  );
};

export const enforceOcrEvidence = (record: BenhAn): BenhAn => {
  const evidenceByPath = new Map<string, BenhAn["bang_chung_ocr"]>();
  for (const evidence of record.bang_chung_ocr) {
    const path = evidence.duong_dan.trim();
    const existing = evidenceByPath.get(path) ?? [];
    existing.push(evidence);
    evidenceByPath.set(path, existing);
  }

  const sanitize = (value: unknown, path: string): unknown => {
    if (typeof value === "string") {
      if (value.trim().length === 0) return "";
      const supported = (evidenceByPath.get(path) ?? []).some((evidence) =>
        evidenceContainsValue(evidence.trich_dan, value),
      );
      return supported ? value : "";
    }
    if (Array.isArray(value)) {
      return value.map((item, index) => sanitize(item, `${path}[${index}]`));
    }
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          sanitize(child, path ? `${path}.${key}` : key),
        ]),
      );
    }
    return value;
  };

  const { bang_chung_ocr: evidence, ...medicalRecord } = record;
  const sanitized = sanitize(medicalRecord, "") as Omit<
    BenhAn,
    "bang_chung_ocr"
  >;
  return BenhAnSchema.parse({
    ...sanitized,
    bang_chung_ocr: evidence.filter((item) => {
      const path = item.duong_dan.trim();
      const segments = path
        .replace(/\[(\d+)\]/g, ".$1")
        .split(".")
        .filter(Boolean);
      let current: unknown = sanitized;
      for (const segment of segments) {
        if (
          current === null ||
          typeof current !== "object" ||
          !Object.prototype.hasOwnProperty.call(current, segment)
        ) {
          return false;
        }
        current = (current as Record<string, unknown>)[segment];
      }
      return (
        typeof current === "string" &&
        current.trim().length > 0 &&
        evidenceContainsValue(item.trich_dan, current)
      );
    }),
  });
};

const visionLLM = getVisionModel({ temperature: 0 });

const structuredOutput = visionLLM.withStructuredOutput(BenhAnSchema);

export const OCR_SYSTEM_PROMPT = `
Bạn là hệ thống trích xuất dữ liệu từ hồ sơ y tế bằng tiếng Việt hoặc ngôn ngữ khác. Tài liệu có thể là bệnh án
nội trú/ngoại trú, phiếu khám, giấy ra viện, đơn thuốc, phiếu xét nghiệm, chẩn đoán hình ảnh, tóm tắt điều trị
hoặc một mẫu riêng của cơ sở y tế. Không giả định tài liệu tuân theo một mẫu bệnh án cố định.

NHIỆM VỤ:
- Đọc toàn bộ ảnh/PDF và trả về duy nhất JSON đúng schema.
- Chỉ chép và phân loại thông tin có bằng chứng trực tiếp trong tài liệu; không chẩn đoán, không tư vấn và không
  tạo dữ kiện mới.

QUY TẮC ÁNH XẠ:
1. Ánh xạ theo ý nghĩa của NHÃN nguồn, không dựa riêng vào vị trí, thứ tự hoặc sự giống nhau của giá trị. Các mã
   định danh chỉ được đưa vào đúng loại mã mà nhãn nguồn thể hiện (mã bệnh án, mã hồ sơ, mã bệnh nhân, số vào
   viện, mã y tế, số lưu trữ, mã mẫu biểu). Không dùng một loại mã thay cho loại khác.
2. Một thông tin chỉ xuất hiện trong đoạn văn tự do được đưa vào trường chuyên biệt khi câu chữ xác định rõ vai
   trò của nó. Nếu vai trò không chắc chắn, giữ nguyên trong thong_tin_bo_sung thay vì đoán trường đích.
3. Chuỗi không có dữ liệu phải là ""; danh sách không có dữ liệu phải là []. Ô trống/không xuất hiện không đồng
   nghĩa với phủ định. Chỉ ghi "không có", "không ghi nhận" hoặc tương đương khi tài liệu khẳng định như vậy.
4. Không tự tính tuổi, BMI, số ngày điều trị, liều quy đổi, eGFR, khoảng thời gian hoặc bất kỳ giá trị dẫn xuất nào.
   Chỉ lấy giá trị đã được tài liệu ghi rõ.
5. Không dùng giá trị khác đơn vị hoặc khác loại để điền thay: BMI không phải cân nặng; ngày ra viện không phải
   ngày vào khoa; chẩn đoán không phải kết quả xét nghiệm; tiền sử thủ thuật không phải thủ thuật của đợt hiện tại.
6. Giữ nguyên tên, số, ngày giờ, đơn vị, dấu bất thường, mã ICD và cách diễn đạt quan trọng. Không âm thầm sửa
   lỗi chính tả chuyên môn hoặc chuẩn hóa định dạng. Phần không đọc được dùng token "[mờ]" tại đúng vị trí.
7. Với bảng xét nghiệm/thuốc, tạo một phần tử cho từng dòng có dữ liệu và đặt từng giá trị đúng cột. Không ghép
   đơn vị, khoảng tham chiếu hoặc ghi chú của dòng liền kề.
8. Với tài liệu nhiều trang, đọc tất cả trang, ghép đúng các bảng bị ngắt trang và loại bản sao thực sự trùng lặp.
   Nếu hai nguồn mâu thuẫn, không tự chọn một giá trị rồi xóa giá trị còn lại: ưu tiên trường có nhãn rõ ràng và
   ghi phần mâu thuẫn còn lại vào thong_tin_bo_sung.
9. Không tự tổng hợp nội dung mới cho các trường có tên "tóm tắt", "diễn biến", "kết quả" hoặc tương tự. Chỉ
   điền khi tài liệu có chính phần/đoạn tương ứng để chép lại. Kết quả cận lâm sàng chỉ chứa số liệu/kết luận
   thăm dò; chẩn đoán chỉ chứa chẩn đoán được người lập hồ sơ ghi nhận.
10. Thông tin có ý nghĩa nhưng schema chưa có trường chuyên biệt phải được bảo toàn trong thong_tin_bo_sung với
    tiêu đề, nhãn, giá trị và trang nếu xác định được. Không lặp lại thông tin đã ánh xạ thành công.
11. Không thêm khóa ngoài schema, không bỏ khóa bắt buộc và không kèm Markdown hay lời giải thích ngoài JSON.
12. Các trường dễ nhầm phải có bằng chứng nhãn/câu chữ trực tiếp: benh_vien không được suy ra từ logo hoặc tên
    thương hiệu đứng riêng; ngay_lap không được lấy từ ngày nhập viện/ra viện/xét nghiệm; ket_qua_dieu_tri và
    giai_phau_benh không được suy ra từ mô tả ổn định, hết triệu chứng, chẩn đoán hay kế hoạch theo dõi.
13. Với MỌI trường giá trị khác "", tạo đúng một phần tử bang_chung_ocr có duong_dan đầy đủ tới trường cuối,
    trich_dan nguyên văn chứa toàn bộ giá trị và trang/ảnh nguồn. Ví dụ:
    {"duong_dan":"benh_an.kham_benh.toan_than.nhiet_do","trich_dan":"Nhiệt độ: 36,8°C","trang":"1"}.
    Trường trong object/mảng phải có bằng chứng riêng cho từng giá trị cuối; không dùng đường dẫn tới cả object,
    cả mảng hoặc một bằng chứng chung cho nhiều trường. Nếu không thể trích dẫn thì để trường dữ liệu đó rỗng.

TỰ KIỂM TRA TRƯỚC KHI TRẢ KẾT QUẢ:
- Đã đọc hết các trang và các phần tiếp nối của bảng.
- Mỗi mã, mốc thời gian, thuốc, xét nghiệm và chẩn đoán nằm đúng loại trường.
- Không có giá trị suy diễn từ kiến thức y khoa hoặc phép tính.
- Mọi trường khác rỗng, không riêng trường nhạy cảm, đều có bang_chung_ocr đúng đường dẫn, nguyên văn và trang;
  nếu không thì đã để trống.
- Không làm mất dữ liệu quan trọng chỉ vì mẫu tài liệu khác schema chuẩn.
`;

const imageArrSchema = z
  .array(
    z.object({
      mimetype: z.string(),
      base64: z.string(),
    })
  )
  .min(1);
const pdfFileSchema = z.object({
  mimetype: z.literal("application/pdf"),
  base64: z.string(),
});
const normalizedArrSchema = z.union([imageArrSchema, pdfFileSchema]);
type NormalizedArr = z.infer<typeof normalizedArrSchema>;
type PdfFile = z.infer<typeof pdfFileSchema>;

export const buildOcrImageParts = (normalizedArr: z.infer<typeof imageArrSchema>) =>
  normalizedArr.map((file) => ({
    type: "image_url" as const,
    image_url: {
      url: extractImgUrl(file),
    },
  }));

export const buildOcrFilePart = (file: PdfFile) => ({
  type: "file" as const,
  source_type: "base64" as const,
  mime_type: file.mimetype,
  data: file.base64,
  metadata: { filename: "medical-record.pdf" },
});

export const ocrTool = tool(
  async (normalizedArr: NormalizedArr) => {
    const parts = Array.isArray(normalizedArr)
      ? buildOcrImageParts(normalizedArr)
      : [buildOcrFilePart(normalizedArr)];
    const input = [
      new SystemMessage(OCR_SYSTEM_PROMPT),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: "Trích xuất thông tin bệnh án từ các file hình ảnh hoặc file pdf sau:",
          },
          ...parts,
        ],
      }),
    ];
    const result = await structuredOutput.invoke(input);
    return enforceOcrEvidence(result);
  },
  {
    name: "ocr_tool",
    description:
      "Nhận dạng ký tự quang học (OCR)/Trích xuất hồ sơ y tế có cấu trúc từ hình ảnh hoặc tệp PDF bằng Gemini.",
    schema: normalizedArrSchema,
  }
);
