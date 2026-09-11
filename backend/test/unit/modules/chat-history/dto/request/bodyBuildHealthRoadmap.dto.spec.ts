import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BodyBuildHealthRoadmapDto } from 'src/modules/chat-history/dto/request/bodyBuildHealthRoadmap.dto';

async function validateBody(payload: Record<string, unknown>) {
  return validate(plainToInstance(BodyBuildHealthRoadmapDto, payload));
}

describe('BodyBuildHealthRoadmapDto', () => {
  it('accepts a positive integer relative_id', async () => {
    await expect(validateBody({ relative_id: 7 })).resolves.toHaveLength(0);
  });

  it.each([
    {},
    { relative_id: 0 },
    { relative_id: -1 },
    { relative_id: 1.5 },
    { relative_id: 'invalid' },
  ])('rejects an invalid relative_id: %p', async (payload) => {
    const errors = await validateBody(payload);
    expect(errors.some((error) => error.property === 'relative_id')).toBe(true);
  });
});
