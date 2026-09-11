import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { DateFormatInterceptor } from 'src/common/interceptors/dateFormatInterceptor.interceptor';

describe('DateFormatInterceptor', () => {
  let interceptor: DateFormatInterceptor;

  const makeContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => ({}),
      }),
    }) as unknown as ExecutionContext;

  const makeCallHandler = (value: any): CallHandler => ({
    handle: () => of(value),
  });

  beforeEach(() => {
    interceptor = new DateFormatInterceptor();
  });

  it('formats a top-level Date value to dd-MM-yyyy', (done) => {
    const date = new Date(2026, 8, 3); // 3 Sep 2026
    interceptor
      .intercept(makeContext(), makeCallHandler(date))
      .subscribe((result) => {
        expect(result).toBe('03-09-2026');
        done();
      });
  });

  it('formats Date fields nested inside a plain object', (done) => {
    const payload = {
      id: 1,
      name: 'John',
      createdAt: new Date(2026, 0, 15),
    };
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual({
          id: 1,
          name: 'John',
          createdAt: '15-01-2026',
        });
        done();
      });
  });

  it('formats Date fields inside arrays of objects', (done) => {
    const payload = [
      { id: 1, dob: new Date(2020, 5, 1) },
      { id: 2, dob: new Date(2021, 5, 1) },
    ];
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual([
          { id: 1, dob: '01-06-2020' },
          { id: 2, dob: '01-06-2021' },
        ]);
        done();
      });
  });

  it('leaves non-date primitives and null untouched', (done) => {
    const payload = { id: 1, active: true, note: null, tag: 'x' };
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual(payload);
        done();
      });
  });
});
