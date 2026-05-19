import * as crypto from 'crypto';
import 'dotenv/config';
const algorithm = 'aes-256-cbc';
const secretKey = crypto
  .createHash('sha256')
  .update(process.env.SECRET_KEY || 'secretKey')
  .digest();
const ivLength = 16;

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ]);
  // 👉 Gắn IV + dữ liệu đã mã hóa lại thành chuỗi base64 để lưu
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (hash: string | null | undefined) => {
  if (!hash || typeof hash !== 'string' || !hash.includes(':')) {
    return '';
  }
  const [ivHex, encryptedHex] = hash.split(':');
  if (!ivHex || !encryptedHex) {
    return '';
  }
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
};
