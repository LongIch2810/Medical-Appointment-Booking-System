import { MigrationInterface, QueryRunner } from 'typeorm';
import { MEDICAL_NEWS_ARTICLES } from './data/medicalNewsArticles';

interface IdRow {
  id: number;
}

const toIdRows = (result: unknown): IdRow[] => {
  const records = Array.isArray(result)
    ? result
    : result && typeof result === 'object' && 'records' in result
      ? result.records
      : [];

  if (!Array.isArray(records)) return [];
  return records.filter((record): record is IdRow =>
    Boolean(
      record &&
      typeof record === 'object' &&
      'id' in record &&
      typeof record.id === 'number',
    ),
  );
};

export class SeedMedicalNewsArticles1787900000000 implements MigrationInterface {
  name = 'SeedMedicalNewsArticles1787900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (MEDICAL_NEWS_ARTICLES.length !== 100) {
      throw new Error('Medical news seed must contain exactly 100 articles');
    }

    const doctorRows = toIdRows(
      await queryRunner.query(`
        SELECT DISTINCT u.id
        FROM "users" u
        INNER JOIN "doctors" d ON d."user_id" = u.id
        WHERE u."deleted_at" IS NULL
          AND d."deleted_at" IS NULL
        ORDER BY u.id
        LIMIT 20
      `),
    );
    const authorRows = doctorRows.length
      ? doctorRows
      : toIdRows(
          await queryRunner.query(`
            SELECT id
            FROM "users"
            WHERE "deleted_at" IS NULL
            ORDER BY "isAdmin" DESC, id
            LIMIT 20
          `),
        );

    if (!authorRows.length) {
      throw new Error('Cannot seed medical news without an article author');
    }

    const topicIds = new Map<string, number>();
    const tagIds = new Map<string, number>();

    for (const [index, article] of MEDICAL_NEWS_ARTICLES.entries()) {
      let topicId = topicIds.get(article.topic.name);
      if (!topicId) {
        const rows = toIdRows(
          await queryRunner.query(
            `
            WITH existing AS (
              SELECT id
              FROM "topics"
              WHERE name = $1 OR slug = $2
              ORDER BY CASE WHEN slug = $2 THEN 0 ELSE 1 END
              LIMIT 1
            ), inserted AS (
              INSERT INTO "topics" (name, description, slug)
              SELECT $1, $3, $2
              WHERE NOT EXISTS (SELECT 1 FROM existing)
              ON CONFLICT DO NOTHING
              RETURNING id
            )
            SELECT id FROM inserted
            UNION ALL
            SELECT id FROM existing
            LIMIT 1
            `,
            [article.topic.name, article.topic.slug, article.topic.description],
          ),
        );
        topicId = rows[0]?.id;
        if (!topicId) {
          throw new Error(`Cannot resolve topic: ${article.topic.name}`);
        }
        topicIds.set(article.topic.name, topicId);
      }

      const authorId = authorRows[index % authorRows.length].id;
      const articleRows = toIdRows(
        await queryRunner.query(
          `
          INSERT INTO "articles" (
            title,
            content,
            img_urls,
            summary,
            slug,
            is_approve,
            topic_id,
            author_id,
            created_at,
            updated_at,
            deleted_at
          )
          VALUES ($1, $2, $3::jsonb, $4, $5, true, $6, $7,
            now() - ($8 * interval '1 day'),
            now() - ($8 * interval '1 day'),
            NULL
          )
          ON CONFLICT (slug) DO UPDATE SET
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            img_urls = EXCLUDED.img_urls,
            summary = EXCLUDED.summary,
            is_approve = true,
            topic_id = EXCLUDED.topic_id,
            author_id = EXCLUDED.author_id,
            updated_at = now(),
            deleted_at = NULL
          RETURNING id
          `,
          [
            article.title,
            article.content,
            JSON.stringify([article.image]),
            article.summary,
            article.slug,
            topicId,
            authorId,
            99 - index,
          ],
        ),
      );
      const articleId = articleRows[0]?.id;
      if (!articleId) {
        throw new Error(`Cannot seed article: ${article.slug}`);
      }

      for (const tagName of article.tags) {
        let tagId = tagIds.get(tagName);
        if (!tagId) {
          const tagSlug = tagName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const rows = toIdRows(
            await queryRunner.query(
              `
              WITH existing AS (
                SELECT id
                FROM "tags"
                WHERE name = $1 OR slug = $2
                ORDER BY CASE WHEN slug = $2 THEN 0 ELSE 1 END
                LIMIT 1
              ), inserted AS (
                INSERT INTO "tags" (name, slug)
                SELECT $1, $2
                WHERE NOT EXISTS (SELECT 1 FROM existing)
                ON CONFLICT DO NOTHING
                RETURNING id
              )
              SELECT id FROM inserted
              UNION ALL
              SELECT id FROM existing
              LIMIT 1
              `,
              [tagName, tagSlug],
            ),
          );
          tagId = rows[0]?.id;
          if (!tagId) {
            throw new Error(`Cannot resolve tag: ${tagName}`);
          }
          tagIds.set(tagName, tagId);
        }

        await queryRunner.query(
          `
            INSERT INTO "article_tags" (article_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (article_id, tag_id) DO UPDATE SET
              deleted_at = NULL,
              updated_at = now()
          `,
          [articleId, tagId],
        );
      }
    }

    await queryRunner.query(`
      SELECT setval(
        pg_get_serial_sequence('articles', 'id'),
        COALESCE((SELECT MAX(id) FROM "articles"), 1),
        true
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const slugs = MEDICAL_NEWS_ARTICLES.map(({ slug }) => slug);

    await queryRunner.query(
      `
        DELETE FROM "article_tags"
        WHERE article_id IN (
          SELECT id FROM "articles" WHERE slug = ANY($1::text[])
        )
      `,
      [slugs],
    );
    await queryRunner.query(
      `DELETE FROM "articles" WHERE slug = ANY($1::text[])`,
      [slugs],
    );
  }
}
