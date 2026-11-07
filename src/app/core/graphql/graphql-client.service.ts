import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError, timeout } from 'rxjs';

import { API_REQUEST_TIMEOUT_MS } from '../../common/constants/api.constants';
import { LoggerService } from '../logger.service';
import { getOperationName, toAppError, unwrapGraphqlResponse } from './graphql-error.util';
import { GraphqlRequest, GraphqlResponse, GraphqlVariables } from './graphql.model';

/**
 * Minimal GraphQL transport over `HttpClient`. No caching (stores own that)
 * and no retrying (each API service decides); every failure is an AppError.
 */
@Injectable({ providedIn: 'root' })
export class GraphqlClientService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  /**
   * Posts a GraphQL document and emits its `data` once. Cold: each
   * subscription sends a new request, which is what lets `retry` work.
   *
   * Errors with an AppError (`graphql`, `network` incl. timeout, `rate-limit`,
   * `server`, `client` or `unknown`) after logging the technical details.
   */
  request$<TData, TVars extends GraphqlVariables = GraphqlVariables>(
    endpoint: string,
    document: string,
    variables?: TVars,
  ): Observable<TData> {
    const body: GraphqlRequest<TVars> = { query: document, variables };

    return this.http.post<GraphqlResponse<TData>>(endpoint, body).pipe(
      timeout({ first: API_REQUEST_TIMEOUT_MS }),
      map((response) => unwrapGraphqlResponse(response)),
      catchError((error: unknown) => {
        const appError = toAppError(error);
        this.logger.error(`GraphQL ${getOperationName(document)} failed (${appError.kind})`, {
          endpoint,
          variables,
          status: appError.status,
          details: appError.details,
        });
        return throwError(() => appError);
      }),
    );
  }
}
