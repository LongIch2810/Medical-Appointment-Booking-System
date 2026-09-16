import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BodyUpdateUserDto } from 'src/modules/users/dto/request/bodyUpdateUser.dto';

async function validateBody(payload: Record<string, unknown>) {
  const dto = plainToInstance(BodyUpdateUserDto, payload);
  return validate(dto);
}

describe('BodyUpdateUserDto', () => {
  const base = {
    phone: '0912345678',
    fullname: 'Nguyen Van A',
    date_of_birth: '1990-01-01',
    picture: 'https://example.com/avatar.png',
    address: '123 Le Loi',
  };

  // Regression test: multipart/form-data (used by PATCH /users/update-info
  // because the same form supports avatar upload) always sends primitives as
  // strings, so gender arrived as "true"/"false" and @IsBoolean() rejected it
  // with "gender must be a boolean value" even though the user only edited
  // their address. @Transform coerces the string before validation runs.
  it('accepts gender sent as the string "true" (multipart/form-data)', async () => {
    const errors = await validateBody({ ...base, gender: 'true' });
    expect(errors).toHaveLength(0);
  });

  it('accepts gender sent as the string "false" (multipart/form-data)', async () => {
    const errors = await validateBody({ ...base, gender: 'false' });
    expect(errors).toHaveLength(0);
  });

  it('accepts gender sent as a real boolean (JSON callers)', async () => {
    const errors = await validateBody({ ...base, gender: true });
    expect(errors).toHaveLength(0);
  });

  it('rejects a non-boolean, non "true"/"false" gender value', async () => {
    const errors = await validateBody({ ...base, gender: 'not-a-boolean' });
    expect(errors.some((e) => e.property === 'gender')).toBe(true);
  });
});
