import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from 'src/common/interceptors/loggingInterceptor.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let consoleLogSpy: jest.SpyInstance;

  const makeContext = (req: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('logs the incoming request method and url before delegating to next.handle()', () => {
    const req = { method: 'GET', url: '/api/v1/users' };
    const nextHandler: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(makeContext(req), nextHandler);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('GET /api/v1/users'),
    );
  });

  it('logs a response line once the stream emits', (done) => {
    const req = { method: 'POST', url: '/api/v1/appointments' };
    const nextHandler: CallHandler = { handle: () => of({ id: 1 }) };

    interceptor.intercept(makeContext(req), nextHandler).subscribe(() => {
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST /api/v1/appointments'),
      );
      // request log + response log
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      done();
    });
  });

  it('passes the emitted value through unchanged', (done) => {
    const req = { method: 'GET', url: '/api/v1/ping' };
    const payload = { hello: 'world' };
    const nextHandler: CallHandler = { handle: () => of(payload) };

    interceptor
      .intercept(makeContext(req), nextHandler)
      .subscribe((result) => {
        expect(result).toBe(payload);
        done();
      });
  });

  it('does not swallow errors emitted by the underlying handler', (done) => {
    const req = { method: 'GET', url: '/api/v1/fail' };
    const err = new Error('boom');
    const nextHandler: CallHandler = { handle: () => throwError(() => err) };

    interceptor.intercept(makeContext(req), nextHandler).subscribe({
      error: (e) => {
        expect(e).toBe(err);
        done();
      },
    });
  });
});
