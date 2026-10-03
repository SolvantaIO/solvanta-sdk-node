/** Options for constructing a Solvanta client. */
export interface SolvantaOptions {
  /** API base URL. Defaults to the Solvanta production endpoint. */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 120000 (2 minutes). */
  timeout?: number;
}

/** Per-solve request options. */
export interface SolveOptions {
  /** Idempotency key for safe retries. Up to 128 characters. */
  idempotencyKey?: string;
}

/** Successful solve response from the API. */
export interface SolveResponse<T = Record<string, unknown>> {
  /** Solve UUID. */
  id: string;
  /** Request state. */
  status: "solved" | "processing" | "failed";
  /** Provider-specific result. Present when status is "solved". */
  result?: T;
  /** Credits charged for this solve. */
  credits_used: number;
  /** Remaining workspace credits. Present on create-solve responses. */
  balance?: number;
  /** Worker execution time in milliseconds. */
  elapsed_ms: number;
}

/** Error envelope returned by the API on non-2xx responses. */
export interface ErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** A registered solver service from the discovery endpoint. */
export interface SolverService {
  task: string;
  name: string;
  family: string;
  platform: string;
  description: string;
  capabilities: string[];
  credits: number;
  aliases?: string[];
  native: boolean;
  configured: boolean;
  median_latency_ms?: number;
  success_rate?: number;
}

/** Response from GET /v1/solver/services. */
export interface ServiceCatalog {
  services: SolverService[];
  worker_reachable: boolean;
}

/** Workspace overview from GET /v1/dashboard. */
export interface Dashboard {
  balance: number;
  total_solves: number;
  successful_solves: number;
  failed_solves: number;
  credits_used: number;
  [key: string]: unknown;
}

/** A solve record from the history endpoint. */
export interface SolveRecord {
  id: string;
  task: string;
  status: string;
  credits_used: number;
  elapsed_ms: number;
  created_at: string;
  result?: Record<string, unknown>;
  [key: string]: unknown;
}

/** Response from GET /v1/solves. */
export interface SolveHistory {
  solves: SolveRecord[];
  [key: string]: unknown;
}

/* ── Task-specific result types ─────────────────────────────────────── */

export interface ReCaptchaResult {
  token: string;
  challenged?: boolean;
  action?: string;
}

export interface CloudflareResult {
  ok: boolean;
  cf_clearance: string;
  cookies: Record<string, string>;
  token?: string;
  userAgent: string;
  elapsed_ms: number;
}

export interface ArkoseResult {
  token: string;
  suppressed: boolean;
}

export interface ForterResult {
  token: string;
  token_id: string;
  derived_profile: string;
  cookie: { name: string; value: string; domain: string; path: string; secure: boolean };
  pages_processed: number;
  events_generated: number;
  flushes_completed: number;
  warmups_completed: number;
  telemetry_submitted: boolean;
  warnings?: string[];
}

export interface Metadata1Result {
  token: string;
  step: string;
  solve_ms: number;
}
