import { MEDICAL_NEWS_ARTICLES } from 'src/database/migrations/data/medicalNewsArticles';
import { SeedMedicalNewsArticles1787900000000 } from 'src/database/migrations/1787900000000-seedMedicalNewsArticles';
import { QueryRunner } from 'typeorm';

describe('medical news article seed data', () => {
  it('contains 100 complete and unique approved-ready articles', () => {
    expect(MEDICAL_NEWS_ARTICLES).toHaveLength(100);
    expect(new Set(MEDICAL_NEWS_ARTICLES.map(({ slug }) => slug)).size).toBe(
      100,
    );

    for (const article of MEDICAL_NEWS_ARTICLES) {
      expect(article.title.length).toBeGreaterThan(20);
      expect(article.summary.length).toBeGreaterThan(60);
      expect(article.content.length).toBeGreaterThan(700);
      expect(article.content).toContain('<h2>Nguồn tham khảo</h2>');
      expect(article.content).toContain('https://');
      expect(article.image.url).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(article.tags.length).toBeGreaterThanOrEqual(2);
      expect(article.topic.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('covers all configured medical topics evenly', () => {
    const topicCounts = MEDICAL_NEWS_ARTICLES.reduce<Record<string, number>>(
      (counts, article) => ({
        ...counts,
        [article.topic.slug]: (counts[article.topic.slug] ?? 0) + 1,
      }),
      {},
    );

    expect(Object.keys(topicCounts)).toHaveLength(20);
    expect(Object.values(topicCounts).every((count) => count === 5)).toBe(true);
  });

  it('persists every article with parameterized, idempotent queries', async () => {
    let articleId = 1000;
    const query = jest.fn(async (sql: string, _parameters?: unknown[]) => {
      if (sql.includes('INNER JOIN "doctors"')) return [{ id: 1 }, { id: 2 }];
      if (sql.includes('INSERT INTO "topics"')) return [{ id: 10 }];
      if (sql.includes('INSERT INTO "articles"')) return [{ id: articleId++ }];
      if (sql.includes('INSERT INTO "tags"')) return [{ id: 20 }];
      return [];
    });
    const runner = { query } as unknown as QueryRunner;

    await new SeedMedicalNewsArticles1787900000000().up(runner);

    const articleQueries = query.mock.calls.filter(([sql]) =>
      sql.includes('INSERT INTO "articles"'),
    );
    expect(articleQueries).toHaveLength(100);
    expect(
      articleQueries.every(([sql]) => sql.includes('ON CONFLICT (slug)')),
    ).toBe(true);
    expect(
      articleQueries.every(([, parameters]) => Array.isArray(parameters)),
    ).toBe(true);
  });
});
