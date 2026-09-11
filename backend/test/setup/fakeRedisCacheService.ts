/**
 * Fake in-memory thay thế RedisCacheService cho integration test.
 *
 * RedisCacheService thật không có khái niệm "db index"/prefix theo môi
 * trường, nên trỏ integration test vào Redis dev thật (dùng chung các key
 * pattern permissions, session_version, refresh_tokens, blacklist) có
 * rủi ro va chạm với dữ liệu dev đang chạy, và ràng buộc "không FLUSHDB"
 * khiến không có cách dọn dẹp an toàn giữa các lần chạy. Đây là external
 * boundary (hạ tầng cache/session, không phải logic nghiệp vụ nội bộ), nên
 * mock ở đây là đúng ranh giới cho phép theo quy tắc mocking.
 *
 * Implement đúng interface public của RedisCacheService (không thêm/bớt
 * method) để có thể override 1-1 qua Test.createTestingModule.
 */
export class FakeRedisCacheService {
  private readonly store = new Map<
    string,
    { value: unknown; expiresAt: number | null }
  >();
  private readonly lists = new Map<string, string[]>();

  async setData<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiresAt = ttl && ttl > 0 ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async getData<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async delData(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  async lRange(
    key: string,
    startIndex: number,
    endIndex: number,
  ): Promise<string[]> {
    const list = this.lists.get(key) ?? [];
    const end = endIndex === -1 ? list.length : endIndex + 1;
    return list.slice(startIndex, end);
  }

  async rPush(key: string, value: string): Promise<number> {
    const list = this.lists.get(key) ?? [];
    list.push(value);
    this.lists.set(key, list);
    return list.length;
  }

  async lPop(key: string): Promise<string | null> {
    const list = this.lists.get(key);
    if (!list || list.length === 0) return null;
    return list.shift() ?? null;
  }

  async incr(key: string): Promise<number> {
    const entry = this.store.get(key);
    const current =
      typeof entry?.value === 'number' ? entry.value : Number(entry?.value) || 0;
    const next = current + 1;
    this.store.set(key, { value: next, expiresAt: entry?.expiresAt ?? null });
    return next;
  }

  async lRem(key: string, _count: number, value: string): Promise<number> {
    const list = this.lists.get(key) ?? [];
    const index = list.indexOf(value);
    if (index === -1) return 0;
    list.splice(index, 1);
    this.lists.set(key, list);
    return 1;
  }

  /** Test-only helper — không thuộc interface thật của RedisCacheService. */
  reset(): void {
    this.store.clear();
    this.lists.clear();
  }
}
