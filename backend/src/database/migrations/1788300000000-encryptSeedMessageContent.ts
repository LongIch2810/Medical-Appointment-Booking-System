import { MigrationInterface, QueryRunner } from 'typeorm';
import { encrypt } from '../../utils/encryption';

/**
 * 1787000000000-seedTransactionalData.ts chèn thẳng nội dung tin nhắn dạng
 * plaintext qua raw SQL, trong khi messages.service.ts luôn gọi decrypt()
 * khi đọc — decrypt() trả về '' một cách âm thầm cho bất kỳ chuỗi nào không
 * đúng định dạng "ivHex:cipherHex" (xem utils/encryption.ts), nên toàn bộ
 * hội thoại được seed hiển thị rỗng dù DB có dữ liệu thật. Migration này mã
 * hoá lại phần content chưa đúng định dạng để khớp với dữ liệu do
 * saveMessage() tạo ra (đã encrypt từ đầu).
 */
export class EncryptSeedMessageContent1788300000000 implements MigrationInterface {
  name = 'EncryptSeedMessageContent1788300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const messages: { id: number; content: string }[] =
      await queryRunner.query(`
        SELECT id, content FROM "messages"
        WHERE content IS NOT NULL
          AND content !~ '^[0-9a-f]{32}:[0-9a-f]+$'
      `);
    for (const message of messages) {
      await queryRunner.query(
        `UPDATE "messages" SET content = $1 WHERE id = $2`,
        [encrypt(message.content), message.id],
      );
    }
  }

  public async down(): Promise<void> {
    // Data-fix migration duy nhất theo 1 chiều: bản plaintext gốc không còn
    // được lưu lại nên không thể khôi phục nguyên trạng.
  }
}
