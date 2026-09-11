import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsBeforeOrEqual } from 'src/common/decorators/isBeforeOrEqual.decorator';

class DateRangeDto {
  @IsBeforeOrEqual('toDate')
  fromDate?: string;

  toDate?: string;
}

class CustomMessageDto {
  @IsBeforeOrEqual('toDate', { message: 'fromDate must not be after toDate' })
  fromDate?: string;

  toDate?: string;
}

describe('IsBeforeOrEqual decorator', () => {
  async function errorsFor(value: Record<string, unknown>) {
    return validate(plainToInstance(DateRangeDto, value));
  }

  it('passes when the value is strictly before the related property', async () => {
    const errors = await errorsFor({
      fromDate: '2026-09-01',
      toDate: '2026-09-10',
    });

    expect(errors).toHaveLength(0);
  });

  it('passes when the value equals the related property', async () => {
    const errors = await errorsFor({
      fromDate: '2026-09-10',
      toDate: '2026-09-10',
    });

    expect(errors).toHaveLength(0);
  });

  it('fails when the value is after the related property', async () => {
    const errors = await errorsFor({
      fromDate: '2026-09-11',
      toDate: '2026-09-10',
    });

    expect(errors).not.toHaveLength(0);
    expect(errors[0].constraints).toMatchObject({
      isBeforeOrEqual: 'fromDate must be before or equal to toDate',
    });
  });

  it('compares full timestamps, not just calendar dates', async () => {
    const errors = await errorsFor({
      fromDate: '2026-09-10T10:00:01.000Z',
      toDate: '2026-09-10T10:00:00.000Z',
    });

    expect(errors).not.toHaveLength(0);
  });

  it('skips validation when the decorated value is missing', async () => {
    const errors = await errorsFor({ toDate: '2026-09-10' });

    expect(errors).toHaveLength(0);
  });

  it('skips validation when the related value is missing', async () => {
    const errors = await errorsFor({ fromDate: '2026-09-10' });

    expect(errors).toHaveLength(0);
  });

  it('skips validation when both values are missing', async () => {
    const errors = await errorsFor({});

    expect(errors).toHaveLength(0);
  });

  it('honors a custom validation message when provided', async () => {
    const errors = await validate(
      plainToInstance(CustomMessageDto, {
        fromDate: '2026-09-11',
        toDate: '2026-09-10',
      }),
    );

    expect(errors).not.toHaveLength(0);
    expect(errors[0].constraints).toMatchObject({
      isBeforeOrEqual: 'fromDate must not be after toDate',
    });
  });
});
