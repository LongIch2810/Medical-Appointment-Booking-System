import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { RemoveFieldPasswordInterceptor } from 'src/common/interceptors/removeFieldPassword.interceptor';

describe('RemoveFieldPasswordInterceptor', () => {
  let interceptor: RemoveFieldPasswordInterceptor;

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
    interceptor = new RemoveFieldPasswordInterceptor();
  });

  it('strips a top-level password field from an object', (done) => {
    const payload = { id: 1, email: 'a@b.com', password: 'secret' };
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual({ id: 1, email: 'a@b.com' });
        expect(result.password).toBeUndefined();
        done();
      });
  });

  it('strips password fields from every item in an array', (done) => {
    const payload = [
      { id: 1, password: 'a' },
      { id: 2, password: 'b' },
    ];
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual([{ id: 1 }, { id: 2 }]);
        done();
      });
  });

  it('strips nested password fields inside sub-objects', (done) => {
    const payload = {
      id: 1,
      user: { id: 2, password: 'nested-secret', name: 'John' },
    };
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual({ id: 1, user: { id: 2, name: 'John' } });
        done();
      });
  });

  it('leaves objects without a password field untouched', (done) => {
    const payload = { id: 1, name: 'John' };
    interceptor
      .intercept(makeContext(), makeCallHandler(payload))
      .subscribe((result) => {
        expect(result).toEqual({ id: 1, name: 'John' });
        done();
      });
  });

  it('passes primitive and null values through unchanged', (done) => {
    interceptor
      .intercept(makeContext(), makeCallHandler(null))
      .subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
  });
});
