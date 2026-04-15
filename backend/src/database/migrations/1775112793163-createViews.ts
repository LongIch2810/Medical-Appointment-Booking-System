import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateViews1775112793163 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    //1.View:Danh sách bác sĩ
    await queryRunner.query(`
                CREATE OR REPLACE VIEW doctors_view AS
                SELECT
                d.id AS doctor_id,
                u.fullname,
                u.email,
                u.phone,
                u.address,
                u.gender,
                u.picture,
                u.date_of_birth,
                d.experience,
                d.about_me,
                d.workplace,
                s.name AS specialty,
                STRING_AGG(CONCAT(ds.day_of_week, ' ', ds.start_time, '-', ds.end_time), ', ') AS schedules
                FROM users u
                JOIN doctors d ON u.id = d.user_id
                JOIN specialties s ON d.specialty_id = s.id
                LEFT JOIN doctor_schedules ds ON ds.doctor_id = d.id
                GROUP BY
                d.id,
                u.fullname,
                u.email,
                u.phone,
                u.address,
                u.gender,
                u.picture,
                u.date_of_birth,
                d.experience,
                d.about_me,
                d.workplace,
                s.name
        `);

    //2.View:Danh sách bài viết
    await queryRunner.query(`
                CREATE OR REPLACE VIEW articles_view
                AS SELECT
                a.id as article_id,
                a.title,
                a.summary,
                a.slug,
                a.img_urls,
                a.is_approve,
                t.name as topic,
                u.fullname as author,
                STRING_AGG(ta.name, ', ') AS tags
                FROM articles a
                JOIN topics t
                ON a.topic_id = t.id
                JOIN users u
                ON a.author_id = u.id
                JOIN article_tags at
                ON at.article_id = a.id
                JOIN tags ta
                ON at.tag_id = ta.id
                GROUP BY a.id, a.title, a.summary, a.slug, a.img_urls, a."is_approve", t.name, u.fullname
                `);

    //3.View:Danh sách chuyên khoa
    await queryRunner.query(`
                CREATE OR REPLACE VIEW specialties_view
                AS SELECT
                id as specialty_id,
                name,
                description
                FROM specialties
                `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS doctors_view`);
    await queryRunner.query(`DROP VIEW IF EXISTS articles_view`);
    await queryRunner.query(`DROP VIEW IF EXISTS specialties_view`);
  }
}
