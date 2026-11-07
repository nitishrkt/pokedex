import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_REQUEST_TIMEOUT_MS } from '../../common/constants/api.constants';
import { AppError } from '../../common/models/app-error.model';
import { LoggerService } from '../logger.service';
import { GraphqlClientService } from './graphql-client.service';
import { TIMEOUT_ERROR_MESSAGE } from './graphql-error.util';

const ENDPOINT = 'https://example.test/graphql';
const DOCUMENT = 'query GetThing($id: Int!) { thing(id: $id) { id } }';

describe('GraphqlClientService', () => {
  let client: GraphqlClientService;
  let httpMock: HttpTestingController;
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    client = TestBed.inject(GraphqlClientService);
    httpMock = TestBed.inject(HttpTestingController);
    logError = vi.spyOn(TestBed.inject(LoggerService), 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    httpMock.verify();
    vi.useRealTimers();
  });

  /** Sends the request and captures whatever the Observable emits. */
  function send(): { value?: unknown; error?: AppError } {
    const result: { value?: unknown; error?: AppError } = {};
    client.request$(ENDPOINT, DOCUMENT, { id: 1 }).subscribe({
      next: (value) => (result.value = value),
      error: (error: AppError) => (result.error = error),
    });
    return result;
  }

  it('posts the document and variables and emits data on success', () => {
    const result = send();

    const req = httpMock.expectOne(ENDPOINT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ query: DOCUMENT, variables: { id: 1 } });
    req.flush({ data: { thing: { id: 1 } } });

    expect(result).toEqual({ value: { thing: { id: 1 } } });
    expect(logError).not.toHaveBeenCalled();
  });

  it('turns errors[] in an HTTP 200 into a graphql AppError and logs it', () => {
    const result = send();
    const errors = [{ message: "field 'thing' not found in type: 'query_root'" }];

    httpMock.expectOne(ENDPOINT).flush({ errors });

    expect(result.error).toMatchObject({ kind: 'graphql', details: { errors } });
    expect(result.error?.message).not.toContain('query_root');
    expect(logError).toHaveBeenCalledWith(
      'GraphQL GetThing failed (graphql)',
      expect.objectContaining({ endpoint: ENDPOINT, details: { errors } }),
    );
  });

  it('turns a 200 without data into a graphql AppError', () => {
    const result = send();

    httpMock.expectOne(ENDPOINT).flush({ data: null });

    expect(result.error?.kind).toBe('graphql');
  });

  it('maps status 0 to a network AppError', () => {
    const result = send();

    httpMock.expectOne(ENDPOINT).error(new ProgressEvent('error'));

    expect(result.error).toMatchObject({ kind: 'network', status: 0 });
  });

  it.each([
    [503, 'server'],
    [429, 'rate-limit'],
    [404, 'client'],
  ])('maps HTTP %i to a %s AppError', (status, kind) => {
    const result = send();

    httpMock.expectOne(ENDPOINT).flush('failure', { status, statusText: 'Failure' });

    expect(result.error).toMatchObject({ kind, status });
    expect(result.error?.message).toBeTruthy();
  });

  it('cancels a request with no response after the timeout and errors as network', () => {
    vi.useFakeTimers();
    const result = send();
    const req = httpMock.expectOne(ENDPOINT);

    vi.advanceTimersByTime(API_REQUEST_TIMEOUT_MS - 1);
    expect(result.error).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(req.cancelled).toBe(true);
    expect(result.error).toMatchObject({ kind: 'network', message: TIMEOUT_ERROR_MESSAGE });
  });
});
