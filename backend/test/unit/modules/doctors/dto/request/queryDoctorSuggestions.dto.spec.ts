import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryDoctorSuggestionsDto } from 'src/modules/doctors/dto/request/queryDoctorSuggestions.dto';

async function validateQuery(payload: Record<string, unknown>) {
  const dto = plainToInstance(QueryDoctorSuggestionsDto, payload);
  return validate(dto);
}

describe('QueryDoctorSuggestionsDto', () => {
  it('rejects a missing search field', async () => {
    const errors = await validateQuery({});
    expect(errors.some((e) => e.property === 'search')).toBe(true);
  });

  it('rejects a search shorter than 2 characters', async () => {
    const errors = await validateQuery({ search: 'a' });
    expect(errors.some((e) => e.property === 'search')).toBe(true);
  });

  it('accepts a 2-character search', async () => {
    const errors = await validateQuery({ search: 'an' });
    expect(errors).toHaveLength(0);
  });

  it('accepts a longer search string', async () => {
    const errors = await validateQuery({ search: 'Nguyễn Văn An' });
    expect(errors).toHaveLength(0);
  });
});
