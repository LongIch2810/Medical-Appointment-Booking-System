import { BadRequestException, CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { FileRequiredInterceptor } from 'src/common/interceptors/fileRequiredInterceptor.interceptor';

describe('FileRequiredInterceptor', () => {
  let interceptor: FileRequiredInterceptor;

  const makeContext = (request: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    }) as unknown as ExecutionContext;

  const nextHandler: CallHandler = { handle: () => of('handled') };

  beforeEach(() => {
    interceptor = new FileRequiredInterceptor();
  });

  it('throws BadRequestException when neither file nor files is present', () => {
    expect(() =>
      interceptor.intercept(makeContext({}), nextHandler),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException when files is an empty array', () => {
    expect(() =>
      interceptor.intercept(makeContext({ files: [] }), nextHandler),
    ).toThrow(BadRequestException);
  });

  it('allows a single valid file through and calls next.handle()', (done) => {
    const request = {
      file: { mimetype: 'image/png', size: 1024 },
    };
    interceptor
      .intercept(makeContext(request), nextHandler)
      .subscribe((result) => {
        expect(result).toBe('handled');
        done();
      });
  });

  it('rejects a single file with a disallowed mimetype', () => {
    const request = {
      file: { mimetype: 'application/x-msdownload', size: 1024 },
    };
    expect(() =>
      interceptor.intercept(makeContext(request), nextHandler),
    ).toThrow(BadRequestException);
  });

  it('rejects a single file exceeding the default max size (20MB)', () => {
    const request = {
      file: { mimetype: 'image/png', size: 21 * 1024 * 1024 },
    };
    expect(() =>
      interceptor.intercept(makeContext(request), nextHandler),
    ).toThrow(BadRequestException);
  });

  it('validates every entry when multiple files are provided', () => {
    const request = {
      files: [
        { mimetype: 'image/png', size: 1024 },
        { mimetype: 'application/x-bad', size: 1024 },
      ],
    };
    expect(() =>
      interceptor.intercept(makeContext(request), nextHandler),
    ).toThrow(BadRequestException);
  });

  it('allows all files through when every file is valid', (done) => {
    const request = {
      files: [
        { mimetype: 'image/png', size: 1024 },
        { mimetype: 'application/pdf', size: 2048 },
      ],
    };
    interceptor
      .intercept(makeContext(request), nextHandler)
      .subscribe((result) => {
        expect(result).toBe('handled');
        done();
      });
  });

  it('respects custom allowedMimeTypes and maxFileSize passed via constructor', () => {
    const customInterceptor = new FileRequiredInterceptor(
      ['image/png'],
      100,
    );
    const request = {
      file: { mimetype: 'image/jpeg', size: 50 },
    };
    expect(() =>
      customInterceptor.intercept(makeContext(request), nextHandler),
    ).toThrow(BadRequestException);

    const okRequest = {
      file: { mimetype: 'image/png', size: 50 },
    };
    expect(() =>
      customInterceptor.intercept(makeContext(okRequest), nextHandler),
    ).not.toThrow();
  });
});
