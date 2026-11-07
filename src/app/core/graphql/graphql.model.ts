/** Variables object sent alongside a GraphQL document. */
export type GraphqlVariables = Record<string, unknown>;

/** Request body posted to a GraphQL endpoint. */
export interface GraphqlRequest<TVars extends GraphqlVariables = GraphqlVariables> {
  query: string;
  variables?: TVars;
}

/** One entry of a GraphQL `errors[]` array. Only `message` is relied on. */
export interface GraphqlError {
  message: string;
}

/** Raw GraphQL response envelope. */
export interface GraphqlResponse<TData> {
  data?: TData | null;
  errors?: GraphqlError[];
}
