import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Hash nhanh, tất định cho các secret có đủ entropy để không cần bcrypt
 * (mã OTP 6 chữ số được bảo vệ bằng attempts/expiry/rate-limit chứ không
 * phải bằng độ chậm của hàm hash; reset token 256-bit random thì entropy tự
 * nó đã đủ an toàn) — cho phép lookup bằng SQL equality thay vì phải quét
 * và bcrypt.compare từng dòng.
 */
export function hashSecret(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** So sánh hai hex digest cùng độ dài bằng thời gian không đổi. */
export function safeCompareHash(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Token ngẫu nhiên an toàn (CSPRNG), dạng hex. */
export function generateRawToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}
