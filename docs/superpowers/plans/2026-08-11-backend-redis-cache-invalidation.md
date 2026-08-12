# Backend Redis Cache-Aside Invalidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the half-scaffolded Redis cache-aside pattern across 8 backend services (articles, topics, doctors, specialties, appointments, role-permission, doctor-schedules, health-profile) with correct invalidation on every insert/update/delete.

**Architecture:** Detail lookups (`entity:{id}`) use exact-key `getData`/`setData`/`delData`, already the working pattern in `articles.service.ts`. List/pagination/filter lookups (`entities:...page=...`) use a new `delByPrefix` primitive (Redis `SCAN` + pipelined `DEL`) added to `RedisCacheService`, since the exact set of cached page/filter combinations can't be known at mutation time. All cache writes get a `3600`s TTL as a safety net.

**Tech Stack:** NestJS, `ioredis` (via the existing `RedisCacheService`), Jest + `@nestjs/testing`.

**Verification note (2026-08-11):** Tasks 1-9 were already implemented when this plan was resumed. The implementation was audited against the current code, all 11 Redis-related suites passed, and the full backend suite passed (12 suites, 30 tests) after adding the missing `MailerService` mock to the pre-existing mail smoke test. Backend build also passed.

## Global Constraints

- TTL on every `setData` call (list and detail) is `3600` seconds — matches the existing `articles` convention.
- Detail cache keys are singular (`article:{id}`, `doctor:{id}`, `topic:{id}`, `specialty:{id}`, `permissions:{userId}`, `doctorSchedule:{id}`, `healthProfile:relative:{relativeId}`); invalidated with exact `delData(key)`.
- List/filter cache keys are plural and prefixed (`articles:...`, `doctors:...`, `topics:...`, `specialties:...`, `appointments:{userId}:...`, `healthProfiles:...`); invalidated with `delByPrefix('<plural>:')` on any create/update/delete of that entity type.
- `RedisCacheModule` is not `@Global()` — any module newly injecting `RedisCacheService` must add `RedisCacheModule` to its own `imports` array (see `backend/src/modules/users/users.module.ts` for the existing pattern).
- Spec: `docs/superpowers/specs/2026-08-11-backend-redis-cache-invalidation-design.md`.

---

### Task 1: `delByPrefix` primitive on `RedisCacheService`

**Files:**
- Modify: `backend/src/redis-cache/redis-cache.service.ts`
- Test: `backend/src/redis-cache/redis-cache.service.spec.ts` (new)

**Interfaces:**
- Produces: `RedisCacheService.delByPrefix(prefix: string): Promise<void>` — every later task calls this.

- [x] **Step 1: Write the failing test**

Create `backend/src/redis-cache/redis-cache.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter } from 'events';
import { RedisCacheService } from './redis-cache.service';

const mockPipeline = { del: jest.fn(), exec: jest.fn().mockResolvedValue([]) };
const mockScanStream = new EventEmitter();
const mockRedisInstance = {
  scanStream: jest.fn(() => mockScanStream),
  pipeline: jest.fn(() => mockPipeline),
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedisInstance);
});

describe('RedisCacheService', () => {
  let service: RedisCacheService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisCacheService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<RedisCacheService>(RedisCacheService);
  });

  describe('delByPrefix', () => {
    it('scans with a wildcard match and deletes every key found', async () => {
      const promise = service.delByPrefix('articles:');
      mockScanStream.emit('data', ['articles:page=1', 'articles:page=2']);
      mockScanStream.emit('end');
      await promise;

      expect(mockRedisInstance.scanStream).toHaveBeenCalledWith({
        match: 'articles:*',
      });
      expect(mockPipeline.del).toHaveBeenCalledWith('articles:page=1');
      expect(mockPipeline.del).toHaveBeenCalledWith('articles:page=2');
      expect(mockPipeline.exec).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no keys match the prefix', async () => {
      const promise = service.delByPrefix('doctors:');
      mockScanStream.emit('end');
      await promise;

      expect(mockPipeline.del).not.toHaveBeenCalled();
      expect(mockPipeline.exec).not.toHaveBeenCalled();
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- redis-cache.service.spec.ts`
Expected: FAIL — `service.delByPrefix is not a function`.

- [x] **Step 3: Implement `delByPrefix`**

In `backend/src/redis-cache/redis-cache.service.ts`, add this method inside the `RedisCacheService` class (after `delData`):

```ts
  async delByPrefix(prefix: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = this.client.scanStream({ match: `${prefix}*` });
      const pipeline = this.client.pipeline();
      let hasKeys = false;

      stream.on('data', (keys: string[]) => {
        if (keys.length) {
          hasKeys = true;
          keys.forEach((key) => pipeline.del(key));
        }
      });

      stream.on('end', () => {
        if (hasKeys) {
          pipeline.exec().then(() => resolve()).catch(reject);
        } else {
          resolve();
        }
      });

      stream.on('error', reject);
    });
  }
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend run test -- redis-cache.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/redis-cache/redis-cache.service.ts backend/src/redis-cache/redis-cache.service.spec.ts
git commit -m "feat(backend): add delByPrefix to RedisCacheService for list-cache invalidation"
```

---

### Task 2: `articles` — enable list cache, invalidate on every mutation

**Files:**
- Modify: `backend/src/modules/articles/articles.service.ts`
- Test: `backend/src/modules/articles/articles.service.spec.ts` (new)

**Interfaces:**
- Consumes: `RedisCacheService.{getData,setData,delData,delByPrefix}` (Task 1).

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/articles/articles.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Article from 'src/entities/article.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UploadFileProducer } from 'src/bullmq/queues/uploadFile/uploadFile.producer';
import { ArticlesService } from './articles.service';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let articleRepo: { update: jest.Mock; softDelete: jest.Mock; findOne: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    articleRepo = {
      update: jest.fn(),
      softDelete: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        { provide: getRepositoryToken(Article), useValue: articleRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: UploadFileProducer, useValue: { uploadFilesArticle: jest.fn() } },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  describe('filterAndPagination', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { data: 'cached-articles' };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.filterAndPagination({
        page: 1,
        limit: 10,
        arrange: 'asc',
      } as any);

      expect(result).toBe(cached);
      expect(articleRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries and populates the cache with a 3600s TTL on a cache miss', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      articleRepo.createQueryBuilder.mockReturnValue(qb);

      await service.filterAndPagination({
        page: 1,
        limit: 10,
        arrange: 'asc',
      } as any);

      expect(redisCacheService.setData).toHaveBeenCalledWith(
        expect.stringContaining('articles:public:page=1'),
        expect.anything(),
        3600,
      );
    });
  });

  describe('mutations invalidate the articles cache', () => {
    it('updateArticle wipes the list cache and the article detail key', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 1 });
      await service.updateArticle(1, { title: 'New title' } as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('articles:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('article:1');
    });

    it('deleteArticle wipes the list cache and the article detail key', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 1 });
      await service.deleteArticle(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('articles:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('article:1');
    });

    it('approveArticle wipes the list cache', async () => {
      articleRepo.findOne.mockResolvedValue({ id: 1, is_approve: false });
      await service.approveArticle(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('articles:');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- articles.service.spec.ts`
Expected: FAIL — cache-miss test fails because `filterAndPagination` never calls `setData` (it's commented out); the `approveArticle` test fails because it never calls `delByPrefix`.

- [x] **Step 3: Implement — enable and namespace the list caches**

In `backend/src/modules/articles/articles.service.ts`, `filterAndPagination` (around line 168-233): replace the commented-out cache block and give this method's key a `public:` sub-namespace (it must not collide with `filterAndPaginationByDoctors`'s cache, which serves a different, author-scoped result set for the same filter shape):

```ts
  async filterAndPagination(objectFilters: BodyFilterArticlesDto) {
    let { page, limit } = objectFilters;
    const { topic_slug, search, arrange, is_approve } = objectFilters;
    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const cacheKey = `articles:public:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const query = this.articleRepo
```

...and just before `return result;` at the end of the same method:

```ts
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }
```

Do the same in `filterAndPaginationByDoctors` (around line 262-334), using the `articles:byDoctors:` sub-namespace instead:

```ts
    const cacheKey = `articles:byDoctors:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const query = this.articleRepo
```

and before its `return result;`:

```ts
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }
```

- [x] **Step 4: Implement — invalidate on every mutation**

In `create` (around line 40-82), right before `return ArticleMapper.toArticleResponseDto(newArticle);`:

```ts
    await this.redisCacheService.delByPrefix('articles:');

    return ArticleMapper.toArticleResponseDto(newArticle);
```

In `updateArticle` (around line 84-108), the exact `article:{id}` delete already exists — add the prefix wipe right above it:

```ts
    await this.articleRepo.update(articleId, fields);

    await this.redisCacheService.delByPrefix('articles:');
    await this.redisCacheService.delData(`article:${articleId}`);

    return { message: 'Cập nhật bài viết thành công' };
```

In `deleteArticle` (around line 110-124), same pattern:

```ts
    await this.articleRepo.softDelete(articleId);

    await this.redisCacheService.delByPrefix('articles:');
    await this.redisCacheService.delData(`article:${articleId}`);

    return { message: 'Xóa bài biết thành công.' };
```

In `approveArticle` (around line 150-166), add invalidation (this method has none today):

```ts
    await this.articleRepo.update(articleId, { is_approve: true });

    await this.redisCacheService.delByPrefix('articles:');

    return { message: 'Duyệt bài viết thành công.' };
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npm --prefix backend run test -- articles.service.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/src/modules/articles/articles.service.ts backend/src/modules/articles/articles.service.spec.ts
git commit -m "feat(backend): enable articles list cache and invalidate on every mutation"
```

---

### Task 3: `topics` — fix the live-but-buggy cache (no TTL, no invalidation), add detail cache

**Files:**
- Modify: `backend/src/modules/topics/topics.service.ts`
- Test: `backend/src/modules/topics/topics.service.spec.ts` (new)

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/topics/topics.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Topic from 'src/entities/topic.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { TopicsService } from './topics.service';

describe('TopicsService', () => {
  let service: TopicsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let topicRepo: {
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    topicRepo = {
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        { provide: getRepositoryToken(Topic), useValue: topicRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
  });

  describe('filterAndPagination', () => {
    it('sets the list cache with a 3600s TTL', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };
      topicRepo.createQueryBuilder.mockReturnValue(qb);

      await service.filterAndPagination({ page: 1, limit: 10, arrange: 'asc' } as any);

      expect(redisCacheService.setData).toHaveBeenCalledWith(
        expect.stringContaining('topics:page=1'),
        expect.anything(),
        3600,
      );
    });
  });

  describe('mutations invalidate the topics cache', () => {
    it('create wipes the list cache', async () => {
      topicRepo.findOne.mockResolvedValue(null);
      topicRepo.create.mockReturnValue({});
      topicRepo.save.mockResolvedValue({ id: 1, name: 'X', description: 'd', slug: 'x' });

      await service.create({ name: 'X', description: 'd' } as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('topics:');
    });

    it('update wipes the list cache and the topic detail key', async () => {
      topicRepo.findOne.mockResolvedValue({ id: 1, name: 'Old', description: 'd' });
      topicRepo.save.mockResolvedValue({ id: 1, name: 'Old', description: 'd' });

      await service.update(1, { description: 'new' });

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('topics:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('topic:1');
    });

    it('remove wipes the list cache and the topic detail key', async () => {
      topicRepo.findOne.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('topics:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('topic:1');
    });
  });

  describe('getTopic', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1, name: 'Cached' };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getTopic(1);

      expect(result).toBe(cached);
      expect(topicRepo.findOne).not.toHaveBeenCalled();
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- topics.service.spec.ts`
Expected: FAIL — TTL assertion fails (currently `setData(cacheKey, result)` with no TTL argument); `create`/`update`/`remove` never call `delByPrefix`/`delData`; `getTopic` doesn't read from cache at all.

- [x] **Step 3: Implement — fix the TTL bug and add invalidation**

In `backend/src/modules/topics/topics.service.ts`, `create` (line 24-48), right before `return TopicMapper.toTopicResponse(newTopic);`:

```ts
      const newTopic = await this.topicRepo.save(topic);
      await this.redisCacheService.delByPrefix('topics:');
      return TopicMapper.toTopicResponse(newTopic);
```

`update` (line 50-83), replace the final line:

```ts
    const savedTopic = await this.topicRepo.save(topic);
    await this.redisCacheService.delByPrefix('topics:');
    await this.redisCacheService.delData(`topic:${topicId}`);
    return savedTopic;
```

`filterAndPagination` (line 85-122), fix the missing TTL:

```ts
    await this.redisCacheService.setData(cacheKey, result, 3600);
```

`remove` (line 145-149):

```ts
  async remove(topicId: number) {
    await this.findById(topicId);
    await this.topicRepo.softDelete(topicId);
    await this.redisCacheService.delByPrefix('topics:');
    await this.redisCacheService.delData(`topic:${topicId}`);
    return { message: 'Xóa topic thành công' };
  }
```

Add a detail cache to `getTopic` (line 140-143):

```ts
  async getTopic(topicId: number) {
    const cacheKey = `topic:${topicId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
    const topic = await this.findById(topicId);
    const result = TopicMapper.toTopicResponse(topic);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix backend run test -- topics.service.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/topics/topics.service.ts backend/src/modules/topics/topics.service.spec.ts
git commit -m "fix(backend): add TTL and mutation invalidation to topics cache, add topic detail cache"
```

---

### Task 4: `doctors` — enable list, detail, and outstanding-doctors caches; invalidate on mutation

**Files:**
- Modify: `backend/src/modules/doctors/doctors.service.ts`
- Test: `backend/src/modules/doctors/doctors.service.spec.ts` (new)

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/doctors/doctors.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Doctor from 'src/entities/doctor.entity';
import User from 'src/entities/user.entity';
import Specialty from 'src/entities/specialty.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { DoctorsService } from './doctors.service';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getRawAndEntities: jest.fn().mockResolvedValue({ entities: [], raw: [] }),
    getCount: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

describe('DoctorsService', () => {
  let service: DoctorsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let doctorRepo: { findOne: jest.Mock; save: jest.Mock; create: jest.Mock; softDelete: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    doctorRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(() => makeQb()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        { provide: getRepositoryToken(Doctor), useValue: doctorRepo },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: getRepositoryToken(Specialty), useValue: {} },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
  });

  describe('getDoctorDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getDoctorDetail(1);

      expect(result).toBe(cached);
      expect(doctorRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('wipes the doctors list/outstanding cache and the doctor detail key', async () => {
      redisCacheService.getData.mockResolvedValue({ id: 5 });

      await service.remove(5);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('doctors:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('doctor:5');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- doctors.service.spec.ts`
Expected: FAIL — `getDoctorDetail` doesn't read from cache (commented out); `remove` never calls `delByPrefix`/`delData`.

- [x] **Step 3: Implement**

In `backend/src/modules/doctors/doctors.service.ts`:

`filterAndPagination` (line 85-171) — uncomment and complete the cache block at the top:

```ts
    const cacheKey = `doctors:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilter || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
```

and before `return result;` at the end:

```ts
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
```

`getDoctorDetail` (line 173-192):

```ts
  async getDoctorDetail(doctorId: number) {
    const cacheKey = `doctor:${doctorId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const { entities, raw } = await this.baseDoctorQuery()
      .where('doctor.id = :doctorId', { doctorId })
      .getRawAndEntities();

    if (entities.length === 0) {
      throw new NotFoundException('Bác sĩ không tồn tại.');
    }
    const row = raw.find((i) => Number(i.doctor_id) === doctorId);
    const doctor = {
      ...entities[0],
      avg_rating: Number(row?.avg_rating ?? 0),
      appointments_completed: Number(row?.appointments_completed ?? 0),
    };
    const result = DoctorsMapper.toDoctorResponseDto(setIsOutstandingDoctor(doctor));
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
```

`create` (line 34-65), before `return this.getDoctorDetail(newDoctor.id);`:

```ts
    const newDoctor = await this.doctorRepo.save(doctor);
    await this.redisCacheService.delByPrefix('doctors:');
    return this.getDoctorDetail(newDoctor.id);
```

`update` (line 194-221), before `return this.getDoctorDetail(doctorId);`:

```ts
    await this.doctorRepo.save(doctor);
    await this.redisCacheService.delByPrefix('doctors:');
    await this.redisCacheService.delData(`doctor:${doctorId}`);
    return this.getDoctorDetail(doctorId);
```

`remove` (line 223-227):

```ts
  async remove(doctorId: number) {
    await this.getDoctorDetail(doctorId);
    await this.doctorRepo.softDelete(doctorId);
    await this.redisCacheService.delByPrefix('doctors:');
    await this.redisCacheService.delData(`doctor:${doctorId}`);
    return { message: 'Xóa bác sĩ thành công.' };
  }
```

`getOutstandingDoctors` (line 229-257) — uncomment its cache block (key `doctors:outstandingDoctors`, already covered by the `doctors:` prefix wipe above, no extra invalidation call needed):

```ts
  async getOutstandingDoctors() {
    const cacheKey = `doctors:outstandingDoctors`;
    const outstandingDoctorsCached = await this.redisCacheService.getData(cacheKey);
    if (outstandingDoctorsCached) return outstandingDoctorsCached;
    const query = this.baseDoctorQuery()
      .orderBy('avg_rating', 'DESC')
      .addOrderBy('appointments_completed', 'DESC');
    const { entities, raw } = await query.getRawAndEntities();
    const outstandingDoctors = entities.map((doctor) => {
      const row = raw.find((i) => Number(i.doctor_id) === doctor.id);

      return {
        ...doctor,
        avg_rating: Number(row?.avg_rating ?? 0),
        appointments_completed: Number(row?.appointments_completed ?? 0),
      };
    });
    const result = DoctorsMapper.toDoctorResponseDtoList(
      setIsOutstandingDoctors(outstandingDoctors)
        .filter((doctor) => doctor.isOutstanding)
        .slice(0, 4),
    );
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix backend run test -- doctors.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/doctors/doctors.service.ts backend/src/modules/doctors/doctors.service.spec.ts
git commit -m "feat(backend): enable doctors list/detail/outstanding cache and invalidate on mutation"
```

---

### Task 5: `specialties` — enable list cache, add detail cache, invalidate on mutation

**Files:**
- Modify: `backend/src/modules/specialties/specialties.service.ts`
- Test: `backend/src/modules/specialties/specialties.service.spec.ts` (new)

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/specialties/specialties.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Specialty from 'src/entities/specialty.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { SpecialtiesService } from './specialties.service';

describe('SpecialtiesService', () => {
  let service: SpecialtiesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let specialtyRepo: { findOne: jest.Mock; save: jest.Mock; softDelete: jest.Mock; createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    specialtyRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpecialtiesService,
        { provide: getRepositoryToken(Specialty), useValue: specialtyRepo },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<SpecialtiesService>(SpecialtiesService);
  });

  describe('getSpecialtyDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1, name: 'Cached' };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getSpecialtyDetail(1);

      expect(result).toBe(cached);
      expect(specialtyRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('wipes the list cache and the specialty detail key', async () => {
      specialtyRepo.findOne.mockResolvedValue({ id: 1, name: 'Old', description: 'd', img_url: 'x' });
      specialtyRepo.save.mockResolvedValue({ id: 1, name: 'Old' });

      await service.update(1, { description: 'new' } as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('specialties:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('specialty:1');
    });
  });

  describe('delete', () => {
    it('wipes the list cache and the specialty detail key', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      specialtyRepo.findOne.mockResolvedValue({ id: 1, name: 'X', description: 'd', img_url: 'x' });

      await service.delete(1);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('specialties:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('specialty:1');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- specialties.service.spec.ts`
Expected: FAIL — `getSpecialtyDetail` has no cache read; `update`/`delete` never call `delByPrefix`/`delData`.

- [x] **Step 3: Implement**

In `backend/src/modules/specialties/specialties.service.ts`:

`filterAndPagination` (line 120-159) — uncomment and complete:

```ts
    const cacheKey = `specialties:page=${page}:limit=${limit}:filter=${JSON.stringify(objectFilter || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
```

and before `return result;`:

```ts
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
```

`getSpecialtyDetail` (line 115-118), add a detail cache:

```ts
  async getSpecialtyDetail(specialtyId: number) {
    const cacheKey = `specialty:${specialtyId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const specialty = await this.findSpecialtyById(specialtyId);
    const result = SpecialtiesMapper.toSpecialtyResponseDto(specialty);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
```

`create` (line 25-57), before `return specialtyDetail;`:

```ts
      const specialtyDetail = await this.getSpecialtyDetail(newSpecialty.id);
      await this.redisCacheService.delByPrefix('specialties:');
      return specialtyDetail;
```

`update` (line 59-97), before `return SpecialtiesMapper.toSpecialtyResponseDto(updatedSpecialty);`:

```ts
    const updatedSpecialty = await this.specialtyRepo.save(specialty);
    await this.redisCacheService.delByPrefix('specialties:');
    await this.redisCacheService.delData(`specialty:${specialtyId}`);
    return SpecialtiesMapper.toSpecialtyResponseDto(updatedSpecialty);
```

`delete` (line 99-113):

```ts
  async delete(specialtyId: number) {
    const specialty = await this.specialtyRepo.findOne({
      where: { id: specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Chuyên khoa không tồn tại.');
    }

    await this.specialtyRepo.softDelete(specialtyId);

    const deletedSpecialty = await this.getSpecialtyDetail(specialtyId);

    await this.redisCacheService.delByPrefix('specialties:');
    await this.redisCacheService.delData(`specialty:${specialtyId}`);

    return deletedSpecialty;
  }
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix backend run test -- specialties.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/specialties/specialties.service.ts backend/src/modules/specialties/specialties.service.spec.ts
git commit -m "feat(backend): enable specialties list/detail cache and invalidate on mutation"
```

---

### Task 6: `appointments` — enable list and detail caches, invalidate on create/cancel/updateStatus

**Files:**
- Modify: `backend/src/modules/appointments/appointments.service.ts`
- Test: `backend/src/modules/appointments/appointments.service.spec.ts` (new)

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/appointments/appointments.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Appointment from 'src/entities/appointment.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { WebsocketGateway } from 'src/websockets/websocket.gateway';
import { UsersService } from '../users/users.service';
import { DoctorSchedulesService } from '../doctor-schedules/doctor-schedules.service';
import { RelativesService } from '../relatives/relatives.service';
import { AppointmentStatus } from 'src/shared/enums/appointmentStatus';
import { AppointmentsService } from './appointments.service';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    ...overrides,
  };
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let appointmentRepo: { createQueryBuilder: jest.Mock; update: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    appointmentRepo = {
      createQueryBuilder: jest.fn(() => makeQb()),
      update: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepo },
        { provide: UsersService, useValue: { findByUserId: jest.fn(), isUserExists: jest.fn().mockResolvedValue(true) } },
        { provide: DoctorSchedulesService, useValue: {} },
        { provide: RelativesService, useValue: {} },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: WebsocketGateway, useValue: {} },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  describe('getAppointmentDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 1 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getAppointmentDetail(9, 1);

      expect(result).toBe(cached);
      expect(appointmentRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('wipes the appointments list cache and this appointment detail key', async () => {
      jest.spyOn(service, 'isAppointmentExistAndPending').mockResolvedValue(true as any);
      jest.spyOn(service, 'getAppointmentDetail').mockResolvedValue({ id: 3 } as any);

      await service.cancel(9, 3);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('appointments:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('user:9:appointment:3');
    });
  });

  describe('updateStatus', () => {
    it('wipes the appointments list cache and the booking user detail key', async () => {
      appointmentRepo.createQueryBuilder.mockReturnValue(
        makeQb({
          getOne: jest
            .fn()
            .mockResolvedValueOnce({
              id: 3,
              status: AppointmentStatus.CONFIRMED,
              booked_by_user: { id: 9 },
              doctor_schedule: { start_time: '00:00:00' },
              appointment_date: new Date(0),
            })
            .mockResolvedValueOnce({ id: 3, status: AppointmentStatus.ABSENT }),
        }),
      );

      await service.updateStatus(3, AppointmentStatus.ABSENT);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('appointments:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('user:9:appointment:3');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- appointments.service.spec.ts`
Expected: FAIL — `getAppointmentDetail` has no cache read; `cancel`/`updateStatus` never call `delByPrefix`/`delData`.

- [x] **Step 3: Implement**

In `backend/src/modules/appointments/appointments.service.ts`:

`findPersonalAppointments` (line 220-270) — uncomment and complete:

```ts
    const cacheKey = `appointments:${userId}:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
```

and before `return result;`:

```ts
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
```

`getAppointmentDetail` (line 480-503):

```ts
  async getAppointmentDetail(userId: number, appointmentId: number) {
    const isUserExist = await this.usersService.isUserExists(userId);
    if (!isUserExist) {
      throw new NotFoundException('Không tìm thấy người dùng.');
    }
    const cacheKey = `user:${userId}:appointment:${appointmentId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const appointment = await this.baseAppointmentQuery()
      .where('appointment.id = :appointmentId', { appointmentId })
      .andWhere('bookedByUser.id = :userId', { userId })
      .getOne();

    if (!appointment) {
      throw new NotFoundException('Lịch hẹn không tồn tại.');
    }

    const result = AppointmentsMapper.toAppointmentResponseDto(appointment);
    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }
```

`create` (line 88-195) — the transaction's final line already reassigns `appointmentDetail` from `this.getAppointmentDetail(...)`; add the list-cache wipe right before `return appointmentDetail;`:

```ts
      const appointmentDetail = await this.getAppointmentDetail(
        userId,
        saved.id,
      );

      await this.redisCacheService.delByPrefix('appointments:');

      return appointmentDetail;
    });
  }
```

`cancel` (line 197-218):

```ts
    await this.appointmentRepo.update(appointmentId, {
      status: AppointmentStatus.CANCELLED,
    });

    await this.redisCacheService.delByPrefix('appointments:');
    await this.redisCacheService.delData(`user:${userId}:appointment:${appointmentId}`);

    const cancelledAppointment = await this.getAppointmentDetail(
      userId,
      appointmentId,
    );

    return cancelledAppointment;
```

`updateStatus` (line 386-461) — the loaded `appointment` already has `booked_by_user` (joined as `bookedByUser` alias by `baseAppointmentQuery`, exposed as `appointment.booked_by_user` on the entity). Add invalidation right after `await this.appointmentRepo.save(appointment);`:

```ts
    appointment.status = status;
    await this.appointmentRepo.save(appointment);

    await this.redisCacheService.delByPrefix('appointments:');
    await this.redisCacheService.delData(
      `user:${appointment.booked_by_user.id}:appointment:${appointmentId}`,
    );

    const updatedAppointment = await this.baseAppointmentQuery()
      .where('appointment.id = :appointmentId', { appointmentId })
      .getOne();

    return AppointmentsMapper.toAppointmentResponseDto(updatedAppointment!);
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix backend run test -- appointments.service.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/appointments/appointments.service.ts backend/src/modules/appointments/appointments.service.spec.ts
git commit -m "feat(backend): enable appointments list/detail cache and invalidate on mutation"
```

---

### Task 7: `permissions:{userId}` cache — role-permission read path, dual invalidation from roles and users

**Files:**
- Modify: `backend/src/modules/role-permission/role-permission.service.ts`
- Modify: `backend/src/modules/roles/roles.service.ts`
- Modify: `backend/src/modules/roles/roles.module.ts`
- Modify: `backend/src/modules/users/users.service.ts`
- Test: `backend/src/modules/role-permission/role-permission.service.spec.ts` (new)
- Test: `backend/src/modules/roles/roles.service.spec.ts` (new)
- Test: `backend/src/modules/users/users.service.spec.ts` (new)

**Interfaces:**
- Produces: `RolePermissionService.getPermissionsByRoles(userId, roles)` now cache-aside (called by `PermissionsGuard` on every request — no signature change).

- [x] **Step 1: Write the failing test for `role-permission.service.ts`**

Create `backend/src/modules/role-permission/role-permission.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import Permission from 'src/entities/permission.entity';
import Role from 'src/entities/role.entity';
import RolePermission from 'src/entities/rolePermission.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RolePermissionService } from './role-permission.service';

describe('RolePermissionService', () => {
  let service: RolePermissionService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let rolePermissionRepo: { createQueryBuilder: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    rolePermissionRepo = { createQueryBuilder: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionService,
        { provide: getRepositoryToken(RolePermission), useValue: rolePermissionRepo },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(Permission), useValue: {} },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<RolePermissionService>(RolePermissionService);
  });

  describe('getPermissionsByRoles', () => {
    it('returns cached permissions without querying the repository on a cache hit', async () => {
      redisCacheService.getData.mockResolvedValue(['article:read']);

      const result = await service.getPermissionsByRoles(9, ['ADMIN']);

      expect(result).toEqual(['article:read']);
      expect(rolePermissionRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('queries and populates the cache with a 3600s TTL on a cache miss', async () => {
      redisCacheService.getData.mockResolvedValue(null);
      const qb: any = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ name: 'article:read' }]),
      };
      rolePermissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getPermissionsByRoles(9, ['ADMIN']);

      expect(result).toEqual(['article:read']);
      expect(redisCacheService.setData).toHaveBeenCalledWith('permissions:9', ['article:read'], 3600);
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend run test -- role-permission.service.spec.ts`
Expected: FAIL — `getPermissionsByRoles` never reads/writes the cache (commented out).

- [x] **Step 3: Implement the cache read in `role-permission.service.ts`**

In `backend/src/modules/role-permission/role-permission.service.ts`, `getPermissionsByRoles` (line 28-51):

```ts
  async getPermissionsByRoles(
    userId: number,
    roles: string[],
  ): Promise<string[]> {
    const cacheKey = `permissions:${userId}`;
    const cachedData = (await this.redisCacheService.getData(
      cacheKey,
    )) as string[];
    if (cachedData) return cachedData;

    const rawPermissions = await this.rolePermissionRepository
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'permission')
      .innerJoin('rp.role', 'role')
      .where('role.role_name IN (:...roles)', { roles })
      .select('DISTINCT permission.name', 'name')
      .getRawMany();

    const permissions = rawPermissions.map((item) => item.name);

    await this.redisCacheService.setData(cacheKey, permissions, 3600);

    return permissions;
  }
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend run test -- role-permission.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/role-permission/role-permission.service.ts backend/src/modules/role-permission/role-permission.service.spec.ts
git commit -m "feat(backend): enable permissions:{userId} cache in getPermissionsByRoles"
```

- [x] **Step 6: Write the failing tests for `roles.service.ts`**

First add `RedisCacheModule` to `backend/src/modules/roles/roles.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import Role from 'src/entities/role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from '../permissions/permissions.module';
import { RedisCacheModule } from 'src/redis-cache/redis-cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([Role]), PermissionsModule, RedisCacheModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
```

Create `backend/src/modules/roles/roles.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Role from 'src/entities/role.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  let service: RolesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let manager: { findOne: jest.Mock; getRepository: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    manager = {
      findOne: jest.fn(),
      getRepository: jest.fn(() => ({
        find: jest.fn().mockResolvedValue([]),
        restore: jest.fn(),
        create: jest.fn((data) => data),
        save: jest.fn(),
        softDelete: jest.fn(),
      })),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: PermissionsService, useValue: { isPermissionListExist: jest.fn().mockResolvedValue(true) } },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.spyOn(service, 'getRoleDetail').mockResolvedValue({} as any);
  });

  describe('updateRolePermissions', () => {
    it('wipes the whole permissions cache, since every user with this role is affected', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });

      await service.updateRolePermissions(1, [10, 11]);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('permissions:');
    });
  });

  describe('deleteRolePermissions', () => {
    it('wipes the whole permissions cache, since every user with this role is affected', async () => {
      manager.findOne.mockResolvedValue({ id: 1 });
      manager.getRepository.mockReturnValue({
        find: jest.fn().mockResolvedValue([{ id: 100, permission: { id: 10 } }]),
        softDelete: jest.fn(),
      });

      await service.deleteRolePermissions(1, [10]);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('permissions:');
    });
  });
});
```

- [x] **Step 7: Run tests to verify they fail**

Run: `npm --prefix backend run test -- roles.service.spec.ts`
Expected: FAIL — `RolesService` doesn't inject `RedisCacheService` yet, so the test module fails to compile / `delByPrefix` is never called.

- [x] **Step 8: Implement in `roles.service.ts`**

Add the dependency to the constructor:

```ts
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private readonly permissionsService: PermissionsService,
    private datasource: DataSource,
    private readonly redisCacheService: RedisCacheService,
  ) {}
```

In `updateRolePermissions` (line 128-182), before `return this.getRoleDetail(roleId);`:

```ts
      if (newRolePermissions.length) {
        await rolePermissionRepo.save(newRolePermissions);
      }
      await this.redisCacheService.delByPrefix('permissions:');
      return this.getRoleDetail(roleId);
    });
  }
```

In `deleteRolePermissions` (line 183-211), before `return this.getRoleDetail(roleId);`:

```ts
      await rolePermissionRepo.softDelete(
        rolePermissions.map((rolePermission) => rolePermission.id),
      );
      await this.redisCacheService.delByPrefix('permissions:');
      return this.getRoleDetail(roleId);
    });
  }
```

- [x] **Step 9: Run tests to verify they pass**

Run: `npm --prefix backend run test -- roles.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 10: Commit**

```bash
git add backend/src/modules/roles/roles.module.ts backend/src/modules/roles/roles.service.ts backend/src/modules/roles/roles.service.spec.ts
git commit -m "feat(backend): wipe permissions cache when a role's permissions change"
```

- [x] **Step 11: Write the failing test for `users.service.ts`**

Create `backend/src/modules/users/users.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import User from 'src/entities/user.entity';
import Role from 'src/entities/role.entity';
import UserRole from 'src/entities/userRole.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let manager: { findOne: jest.Mock; find: jest.Mock; delete: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    manager = {
      findOne: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
      save: jest.fn(),
    };
    dataSource = { transaction: jest.fn((cb) => cb(manager)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: DataSource, useValue: dataSource },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('updateRoles', () => {
    it("wipes only this user's permissions cache key", async () => {
      manager.findOne
        .mockResolvedValueOnce({ id: 9 })
        .mockResolvedValueOnce({ id: 9, roles: [] });
      manager.find.mockResolvedValue([{ id: 1 }]);

      await service.updateRoles(9, [1]);

      expect(redisCacheService.delData).toHaveBeenCalledWith('permissions:9');
    });
  });
});
```

- [x] **Step 12: Run test to verify it fails**

Run: `npm --prefix backend run test -- users.service.spec.ts`
Expected: FAIL — `UsersService` doesn't inject `RedisCacheService` yet.

- [x] **Step 13: Implement in `users.service.ts`**

Add the dependency to the constructor (`backend/src/modules/users/users.module.ts` already imports `RedisCacheModule`, confirmed — no module change needed here):

```ts
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly redisCacheService: RedisCacheService,
  ) {}
```

In `updateRoles` (line 379-421), before `return UsersMapper.toUserProfileResponse(updatedUser!);`:

```ts
      const updatedUser = await manager.findOne(User, {
        where: { id: userId },
        relations: {
          roles: {
            role: {
              permissions: {
                permission: true,
              },
            },
          },
        },
      });

      await this.redisCacheService.delData(`permissions:${userId}`);

      return UsersMapper.toUserProfileResponse(updatedUser!);
    });
  }
```

- [x] **Step 14: Run test to verify it passes**

Run: `npm --prefix backend run test -- users.service.spec.ts`
Expected: PASS (1 test).

- [ ] **Step 15: Commit**

```bash
git add backend/src/modules/users/users.service.ts backend/src/modules/users/users.service.spec.ts
git commit -m "feat(backend): wipe a user's permissions cache key when their roles change"
```

---

### Task 8: `doctor-schedules` — new detail and per-doctor list caches

**Files:**
- Modify: `backend/src/modules/doctor-schedules/doctor-schedules.service.ts`
- Test: `backend/src/modules/doctor-schedules/doctor-schedules.service.spec.ts` (new)

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/doctor-schedules/doctor-schedules.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import DoctorSchedule from 'src/entities/doctorSchedule.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { DoctorsService } from '../doctors/doctors.service';
import { DoctorSchedulesService } from './doctor-schedules.service';

describe('DoctorSchedulesService', () => {
  let service: DoctorSchedulesService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let doctorScheduleRepo: {
    findOne: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let doctorsService: { findDoctorByUserId: jest.Mock; findByDoctorId: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    doctorScheduleRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn(),
    };

    doctorsService = {
      findDoctorByUserId: jest.fn().mockResolvedValue({ id: 4 }),
      findByDoctorId: jest.fn().mockResolvedValue({ id: 4 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorSchedulesService,
        { provide: getRepositoryToken(DoctorSchedule), useValue: doctorScheduleRepo },
        { provide: DoctorsService, useValue: doctorsService },
        { provide: RedisCacheService, useValue: redisCacheService },
      ],
    }).compile();

    service = module.get<DoctorSchedulesService>(DoctorSchedulesService);
  });

  describe('getDoctorScheduleDetail', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      const cached = { id: 7 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getDoctorScheduleDetail(7);

      expect(result).toBe(cached);
      expect(doctorScheduleRepo.findOne).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('wipes the schedule detail key and this doctor\'s schedule-list key', async () => {
      doctorScheduleRepo.findOne.mockResolvedValue({ id: 7, doctor: { id: 4 } });

      await service.remove(1, 7);

      expect(redisCacheService.delData).toHaveBeenCalledWith('doctorSchedule:7');
      expect(redisCacheService.delData).toHaveBeenCalledWith('doctorSchedules:doctor:4');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- doctor-schedules.service.spec.ts`
Expected: FAIL — no cache code exists yet in this service.

- [x] **Step 3: Implement**

In `backend/src/modules/doctor-schedules/doctor-schedules.service.ts`:

`getDoctorScheduleDetail` (line 111-114):

```ts
  async getDoctorScheduleDetail(scheduleId: number) {
    const cacheKey = `doctorSchedule:${scheduleId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;
    const schedule = await this.findScheduleByDoctorScheduleId(scheduleId);
    const result = DoctorScheduleMapper.toDoctorScheduleResponseDto(schedule);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
```

`getSchedulesByDoctorId` (line 146-169) — this has no pagination/filters, so it's a single exact key per doctor, not a `delByPrefix` target:

```ts
  async getSchedulesByDoctorId(doctorId: number) {
    const doctor = await this.doctorsService.findByDoctorId(doctorId);
    if (!doctor) {
      throw new NotFoundException('Bác sĩ không tồn tại trong hệ thống.');
    }

    const cacheKey = `doctorSchedules:doctor:${doctorId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;

    const schedules = await this.doctorScheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.appointments', 'appointment')
      .where('schedule.doctor_id = :doctorId', { doctorId })
      .select([
        'schedule.id',
        'schedule.day_of_week',
        'schedule.start_time',
        'schedule.end_time',
        'schedule.is_active',
        'appointment',
      ])
      .orderBy('schedule.day_of_week', 'ASC')
      .addOrderBy('schedule.start_time', 'ASC')
      .getMany();

    const result = DoctorScheduleMapper.toDoctorScheduleResponseDtoList(schedules);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
```

`create` (line 25-67), before `return DoctorScheduleMapper.toDoctorScheduleResponseDto(newSchedule);`:

```ts
      const newSchedule = await this.doctorScheduleRepo.save({
        ...bodyCreateSchedule,
        is_active: true,
        doctor,
      });

      await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);

      return DoctorScheduleMapper.toDoctorScheduleResponseDto(newSchedule);
```

`update` (line 69-109), before `return this.doctorScheduleRepo.save(schedule);`:

```ts
    Object.assign(schedule, bodyUpdateSchedule);
    const savedSchedule = await this.doctorScheduleRepo.save(schedule);
    await this.redisCacheService.delData(`doctorSchedule:${doctorScheduleId}`);
    await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);
    return savedSchedule;
```

`updateActive` (line 116-137), before `return { message: ... };`:

```ts
    await this.doctorScheduleRepo.update(doctorScheduleId, {
      is_active: isActive,
    });

    await this.redisCacheService.delData(`doctorSchedule:${doctorScheduleId}`);
    await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);

    return {
      message: isActive
        ? 'Kích hoạt ca khám thành công.'
        : 'Ngừng kích hoạt ca khám thành công.',
    };
```

`remove` (line 139-144):

```ts
  async remove(userId: number, doctorScheduleId: number) {
    const doctor = await this.doctorsService.findDoctorByUserId(userId);
    const schedule = await this.findOwnedSchedule(doctor.id, doctorScheduleId);
    await this.doctorScheduleRepo.delete(schedule.id);
    await this.redisCacheService.delData(`doctorSchedule:${doctorScheduleId}`);
    await this.redisCacheService.delData(`doctorSchedules:doctor:${doctor.id}`);
    return { message: 'Xóa ca khám thành công.' };
  }
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix backend run test -- doctor-schedules.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/doctor-schedules/doctor-schedules.service.ts backend/src/modules/doctor-schedules/doctor-schedules.service.spec.ts
git commit -m "feat(backend): add doctor-schedules detail/list cache with invalidation"
```

---

### Task 9: `health-profile` — new detail and list caches

**Files:**
- Modify: `backend/src/modules/health-profile/health-profile.service.ts`
- Test: `backend/src/modules/health-profile/health-profile.service.spec.ts` (new)

- [x] **Step 1: Write the failing tests**

Create `backend/src/modules/health-profile/health-profile.service.spec.ts`:

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import HealthProfile from 'src/entities/healthProfile.entity';
import { RedisCacheService } from 'src/redis-cache/redis-cache.service';
import { RelativesService } from '../relatives/relatives.service';
import { UsersService } from '../users/users.service';
import { HealthProfileService } from './health-profile.service';

function makeQb(overrides: Partial<Record<string, any>> = {}) {
  return {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockResolvedValue(null),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    ...overrides,
  };
}

describe('HealthProfileService', () => {
  let service: HealthProfileService;
  let redisCacheService: jest.Mocked<RedisCacheService>;
  let healthProfileRepo: { create: jest.Mock; save: jest.Mock; createQueryBuilder: jest.Mock };
  let relativesService: { findOwnedByUserId: jest.Mock };
  let usersService: { isUserExists: jest.Mock };

  beforeEach(async () => {
    redisCacheService = {
      getData: jest.fn(),
      setData: jest.fn(),
      delData: jest.fn(),
      delByPrefix: jest.fn(),
    } as unknown as jest.Mocked<RedisCacheService>;

    healthProfileRepo = {
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => makeQb()),
    };

    relativesService = { findOwnedByUserId: jest.fn() };
    usersService = { isUserExists: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthProfileService,
        { provide: getRepositoryToken(HealthProfile), useValue: healthProfileRepo },
        { provide: RelativesService, useValue: relativesService },
        { provide: RedisCacheService, useValue: redisCacheService },
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = module.get<HealthProfileService>(HealthProfileService);
  });

  describe('getHealthProfile', () => {
    it('returns cached data without querying the repository on a cache hit', async () => {
      relativesService.findOwnedByUserId.mockResolvedValue({ id: 2 });
      const cached = { id: 5 };
      redisCacheService.getData.mockResolvedValue(cached);

      const result = await service.getHealthProfile(9, 2);

      expect(result).toBe(cached);
      expect(healthProfileRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('wipes the health-profiles list cache and this relative\'s detail key', async () => {
      relativesService.findOwnedByUserId.mockResolvedValue({
        id: 2,
        health_profile: { id: 5 },
      });
      healthProfileRepo.save.mockResolvedValue({ id: 5 });

      await service.update(9, 2, {} as any);

      expect(redisCacheService.delByPrefix).toHaveBeenCalledWith('healthProfiles:');
      expect(redisCacheService.delData).toHaveBeenCalledWith('healthProfile:relative:2');
    });
  });
});
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npm --prefix backend run test -- health-profile.service.spec.ts`
Expected: FAIL — no cache code exists yet in this service.

- [x] **Step 3: Implement**

In `backend/src/modules/health-profile/health-profile.service.ts`:

`getHealthProfile` (line 84-96):

```ts
  async getHealthProfile(userId: number, relativeId: number) {
    await this.relativesService.findOwnedByUserId(userId, relativeId);

    const cacheKey = `healthProfile:relative:${relativeId}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) return cachedData;

    const healthProfile = await this.baseHealthProfileQuery()
      .where('relative.id = :relativeId', { relativeId })
      .getOne();

    if (!healthProfile) {
      throw new NotFoundException('Hồ sơ sức khỏe không tồn tại.');
    }

    const result = HealthProfileMapper.toHealthProfileResponseDto(healthProfile);
    await this.redisCacheService.setData(cacheKey, result, 3600);
    return result;
  }
```

`listHealthProfilesByUserId` (line 98-146):

```ts
    let { page, limit, arrange, search } = objectFilters;

    page = Math.max(1, page);
    limit = Math.max(1, limit);
    const skip = (page - 1) * limit;

    const cacheKey = `healthProfiles:user:${userId}:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const query = this.baseHealthProfileQuery()
```

and before the final `return new PaginationResultDto(...)`, capture the result and set the cache:

```ts
    const result = new PaginationResultDto(
      'healthProfiles',
      HealthProfileMapper.toHealthProfileResponseDtoList(healthProfiles),
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }
```

`filterAndPagination` (line 148-186), same pattern with its own key namespace (admin-facing, not scoped to a user):

```ts
    const cacheKey = `healthProfiles:page=${page}:limit=${limit}:filters=${JSON.stringify(objectFilters || {})}`;
    const cachedData = await this.redisCacheService.getData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const query = this.baseHealthProfileQuery()
```

and before its final return:

```ts
    const result = new PaginationResultDto(
      'healthProfiles',
      HealthProfileMapper.toHealthProfileResponseDtoList(healthProfiles),
      total,
      page,
      limit,
    );

    await this.redisCacheService.setData(cacheKey, result, 3600);

    return result;
  }
```

`create` (line 27-52), before `return HealthProfileMapper.toHealthProfileResponseDto(newHealthProfile);`:

```ts
    const newHealthProfile =
      await this.healthProfileRepo.save(createdHealthProfile);

    await this.redisCacheService.delByPrefix('healthProfiles:');

    return HealthProfileMapper.toHealthProfileResponseDto(newHealthProfile);
```

`update` (line 54-82), before `return HealthProfileMapper.toHealthProfileResponseDto(updatedHealthProfile);`:

```ts
    const updatedHealthProfile = await this.healthProfileRepo.save(
      relative.health_profile,
    );

    await this.redisCacheService.delByPrefix('healthProfiles:');
    await this.redisCacheService.delData(`healthProfile:relative:${relativeId}`);

    return HealthProfileMapper.toHealthProfileResponseDto(updatedHealthProfile);
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npm --prefix backend run test -- health-profile.service.spec.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/health-profile/health-profile.service.ts backend/src/modules/health-profile/health-profile.service.spec.ts
git commit -m "feat(backend): add health-profile detail/list cache with invalidation"
```

---

### Task 10: Full backend test suite sanity check

**Files:** none (verification only)

- [x] **Step 1: Run the full backend test suite**

Run: `npm --prefix backend run test`
Expected: All suites PASS, including the 8 new/modified spec files from Tasks 1-9 and the pre-existing `mail.service.spec.ts`.

- [x] **Step 2: Run the backend build**

Run: `npm --prefix backend run build`
Expected: Compiles with no TypeScript errors (confirms no leftover references to removed/renamed variables across the 8 touched services).

- [ ] **Step 3: Commit (only if Steps 1-2 required fixes)**

If everything already passed, there is nothing to commit for this task — it's a verification checkpoint, not a code change.
