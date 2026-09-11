import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  const makeContext = (response: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => response,
      }),
    }) as unknown as ExecutionContext;

  const makeCallHandler = (value: any): CallHandler => ({
    handle: () => of(value),
  });

  // intercept() is typed as Observable<any> | Promise<Observable<any>>; this
  // interceptor never actually returns a promise, so narrow the result for tests.
  const runIntercept = (
    context: ExecutionContext,
    handler: CallHandler,
  ): Observable<any> => {
    return interceptor.intercept(context, handler) as Observable<any>;
  };

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps the handler payload in the standard { statusCode, success, data, error } envelope', (done) => {
    const response = { statusCode: 200, headersSent: false };
    const payload = { id: 1, name: 'John' };

    runIntercept(
      makeContext(response),
      makeCallHandler(payload),
    ).subscribe((result: any) => {
      expect(result).toEqual({
        statusCode: 200,
        success: true,
        data: payload,
        error: null,
      });
      done();
    });
  });

  it('reflects the response status code that was set at emission time (e.g. 201)', (done) => {
    const response = { statusCode: 201, headersSent: false };

    runIntercept(
      makeContext(response),
      makeCallHandler({ id: 1 }),
    ).subscribe((result: any) => {
      expect(result.statusCode).toBe(201);
      expect(result.success).toBe(true);
      done();
    });
  });

  it('bypasses wrapping and returns the raw stream when headers were already sent', (done) => {
    const response = { statusCode: 200, headersSent: true };
    const rawValue = 'raw-stream-value';

    runIntercept(
      makeContext(response),
      makeCallHandler(rawValue),
    ).subscribe((result: any) => {
      expect(result).toBe(rawValue);
      done();
    });
  });
});
