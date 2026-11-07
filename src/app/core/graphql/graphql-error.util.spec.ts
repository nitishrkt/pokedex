import { HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom, throwError, TimeoutError } from 'rxjs';

import { createAppError } from '../../common/models/app-error.model';
import { LoggerService } from '../logger.service';
import { normalizeAppError, TIMEOUT_ERROR_MESSAGE, toAppError } from './graphql-error.util';

describe('toAppError', () => {
  it('maps an error that is not an HttpErrorResponse to unknown, keeping it in details', () => {
    const error = new TypeError("Cannot read properties of undefined (reading 'map')");

    expect(toAppError(error)).toMatchObject({ kind: 'unknown', details: error });
  });

  it('maps an RxJS TimeoutError to network with a timeout message', () => {
    expect(toAppError(new TimeoutError())).toMatchObject({
      kind: 'network',
      message: TIMEOUT_ERROR_MESSAGE,
    });
  });

  it('maps an HttpErrorResponse by status and passes AppErrors through', () => {
    expect(toAppError(new HttpErrorResponse({ status: 502 }))).toMatchObject({
      kind: 'server',
      status: 502,
    });

    const appError = createAppError('client');
    expect(toAppError(appError)).toBe(appError);
  });
});

describe('normalizeAppError', () => {
  it('re-throws an AppError and logs only errors that were not AppErrors yet', async () => {
    const logger = { warn: vi.fn(), error: vi.fn() } as unknown as LoggerService;
    const appError = createAppError('graphql');

    await expect(
      lastValueFrom(throwError(() => appError).pipe(normalizeAppError(logger, 'Op'))),
    ).rejects.toBe(appError);
    expect(logger.error).not.toHaveBeenCalled();

    await expect(
      lastValueFrom(throwError(() => new TypeError('bad')).pipe(normalizeAppError(logger, 'Op'))),
    ).rejects.toMatchObject({ kind: 'unknown' });
    expect(logger.error).toHaveBeenCalledWith('Op failed (unknown)', expect.anything());
  });
});
