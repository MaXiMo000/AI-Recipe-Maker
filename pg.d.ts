declare module 'pg' {
  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[];
    rowCount: number | null;
    command: string;
    oid: number;
    fields: Array<{ name: string; tableID: number; columnID: number; dataTypeID: number; dataTypeSize: number; dataTypeModifier: number; format: string }>;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    on(event: 'error', listener: (err: Error) => void): this;
    end(): Promise<void>;
  }

  export interface PoolClient {
    query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<T>>;
    release(): void;
  }

  export const types: unknown;
}
