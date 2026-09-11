import {
  changePasswordSchema,
  forgotPasswordEmailSchema,
  signInSchema,
  signUpSchema,
} from '@/schemas/auth.schema';
import { relativeFormSchema } from '@/schemas/relative.schema';

describe('patient form schemas', () => {
  it('accepts a valid login and rejects malformed email-like usernames', () => {
    expect(signInSchema.safeParse({ usernameOrEmail: 'patient1', password: 'secret1' }).success).toBe(true);
    expect(signInSchema.safeParse({ usernameOrEmail: 'bad@email', password: 'secret1' }).success).toBe(false);
  });

  it('requires matching sign-up passwords', () => {
    const base = {
      username: 'patient1',
      email: 'patient@example.com',
      password: 'secret1',
      confirmPassword: 'secret1',
      fullname: 'Patient One',
    };
    expect(signUpSchema.safeParse(base).success).toBe(true);
    expect(signUpSchema.safeParse({ ...base, confirmPassword: 'secret2' }).success).toBe(false);
  });

  it('requires a valid forgot-password email', () => {
    expect(forgotPasswordEmailSchema.safeParse({ email: 'patient@example.com' }).success).toBe(true);
    expect(forgotPasswordEmailSchema.safeParse({ email: 'patient' }).success).toBe(false);
  });

  it('requires a changed, confirmed password', () => {
    expect(changePasswordSchema.safeParse({ old_password: 'secret1', new_password: 'secret2', confirm_password: 'secret2' }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ old_password: 'secret1', new_password: 'secret1', confirm_password: 'secret1' }).success).toBe(false);
  });

  it('accepts optional relative contact data but validates supplied phones', () => {
    const base = { fullname: 'Relative One', relationship_code: 'PARENT', dob: '', gender: 'true' as const };
    expect(relativeFormSchema.safeParse({ ...base, phone: '' }).success).toBe(true);
    expect(relativeFormSchema.safeParse({ ...base, phone: '0912345678' }).success).toBe(true);
    expect(relativeFormSchema.safeParse({ ...base, phone: '123' }).success).toBe(false);
  });
});

