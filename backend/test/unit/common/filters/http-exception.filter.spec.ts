import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  const makeResponse = (headersSent = false) => {
    const res: any = { headersSent };
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const makeHost = (response: any): ArgumentsHost =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({}),
        getResponse: () => response,
      }),
    }) as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('does nothing when headers were already sent', () => {
    const response = makeResponse(true);

    filter.catch(new BadRequestException('bad'), makeHost(response));

    expect(response.status).not.toHaveBeenCalled();
    expect(response.json).not.toHaveBeenCalled();
  });

  it('maps a plain-string HttpException response to code/details', () => {
    const response = makeResponse();

    filter.catch(new ForbiddenException('nope'), makeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.FORBIDDEN,
      success: false,
      data: null,
      error: {
        code: 'FORBIDDEN',
        details: 'nope',
      },
    });
  });

  it('marks class-validator array messages on a 400 as VALIDATION_FAILED', () => {
    const response = makeResponse();
    const exception = new BadRequestException({
      message: ['email must be an email', 'password is required'],
      error: 'Bad Request',
      statusCode: 400,
    });

    filter.catch(exception, makeHost(response));

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_FAILED',
        details: ['email must be an email', 'password is required'],
      },
    });
  });

  it('uses a custom "code" field on the exception response object when present', () => {
    const response = makeResponse();
    const exception = new BadRequestException({
      code: 'DOCTOR_SCHEDULE_CONFLICT',
      message: 'Schedule already booked',
    });

    filter.catch(exception, makeHost(response));

    expect(response.json).toHaveBeenCalledWith({
      statusCode: 400,
      success: false,
      data: null,
      error: {
        code: 'DOCTOR_SCHEDULE_CONFLICT',
        details: 'Schedule already booked',
      },
    });
  });

  it('falls back to HttpStatus[status] as the code when no custom code is provided', () => {
    const response = makeResponse();

    filter.catch(new NotFoundException('missing'), makeHost(response));

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        details: 'missing',
      },
    });
  });

  it('treats a non-HttpException as an internal server error', () => {
    const response = makeResponse();

    filter.catch(new Error('unexpected failure'), makeHost(response));

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      success: false,
      data: null,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        details: 'Internal server error',
      },
    });
  });
});
