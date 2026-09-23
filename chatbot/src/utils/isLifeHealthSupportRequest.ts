const SUPPORT_INTENT =
  /(hotline|e-?mail|liên hệ|hỗ trợ|contact|support|số điện thoại|địa chỉ|giờ làm việc|phí|chính sách)/i;
const PRODUCT_REFERENCE =
  /(life\s*health|nền tảng|trang web|website|ứng dụng|tài khoản|dịch vụ)/i;

export function isLifeHealthSupportRequest(message: string, context = ""): boolean {
  return SUPPORT_INTENT.test(message) && PRODUCT_REFERENCE.test(`${message} ${context}`);
}
