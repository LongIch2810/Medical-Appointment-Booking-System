import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessagingIndices1787500000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "idx_messages_channel_id" ON "messages" ("channel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_messages_sender_id" ON "messages" ("sender_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_messages_channel_id_is_read" ON "messages" ("channel_id", "is_read")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_channel_members_participant_id" ON "channel_members" ("participant_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_channel_members_participant_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_messages_channel_id_is_read"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_messages_sender_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_messages_channel_id"`);
  }
}
