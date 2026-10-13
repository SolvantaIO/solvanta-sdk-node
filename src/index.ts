export { SolvantaError } from "./errors.js";
export type {
  SolvantaOptions,
  SolveOptions,
  SolveResponse,
  SolverService,
  ServiceCatalog,
  Dashboard,
  SolveRecord,
  SolveHistory,
  ReCaptchaResult,
  CloudflareResult,
  ArkoseResult,
  ForterResult,
  Metadata1Result,
  SeonResult,
  ErrorBody,
} from "./types.js";

import { SolvantaError } from "./errors.js";
import type {
  SolvantaOptions,
  SolveOptions,
  SolveResponse,
  ServiceCatalog,
  Dashboard,
  SolveHistory,
  SolveRecord,
  ErrorBody,
} from "./types.js";

const DEFAULT_BASE_URL = "https://backend.solvanta.io";
const DEFAULT_TIMEOUT = 120_000;

/** Registered task name constants. */
export const Tasks = {
  ReCaptchaV2: "ReCaptchaV2Task",
  ReCaptchaV2Enterprise: "ReCaptchaV2EnterpriseTask",
  ReCaptchaV3: "ReCaptchaV3Task",
  ReCaptchaV3Enterprise: "ReCaptchaV3EnterpriseTask",
  Cloudflare: "CloudflareTask",
  Arkose: "ArkoseTask",
  Forter: "ForterTask",
  NuData: "NuDataTask",
  ThreatMetrix: "ThreatMetrixTask",
  Pxm: "PxmTask",
  UeMsm: "UeMsmTask",
  Metadata1: "Metadata1Task",
  Seon: "SeonTask",
} as const;

export type TaskName = (typeof Tasks)[keyof typeof Tasks];

/** Solvanta API client. */
export class Solvanta {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  /**
   * Create a new Solvanta client.
   * @param apiKey - Workspace API key.
   * @param options - Optional configuration.
   */
  constructor(apiKey: string, options?: SolvantaOptions) {
    if (!apiKey) throw new Error("API key is required");
    this.apiKey = apiKey;
    this.baseUrl = (options?.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = options?.timeout ?? DEFAULT_TIMEOUT;
  }

  /* ── Core request plumbing ──────────────────────────────────────── */

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    const reqHeaders: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...headers,
    };
    if (body !== undefined) {
      reqHeaders["Content-Type"] = "application/json";
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: reqHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new SolvantaError("timeout", "Request timed out", 0);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      if (!res.ok) {
        throw new SolvantaError("unknown", text || res.statusText, res.status);
      }
      data = text;
    }

    if (!res.ok) {
      const body = data as ErrorBody;
      const code = body?.error?.code ?? "unknown";
      const message = body?.error?.message ?? res.statusText;
      throw new SolvantaError(code, message, res.status);
    }

    return data as T;
  }

  /* ── Solve ──────────────────────────────────────────────────────── */

  /**
   * Create a metered solve.
   * @param task - PascalCase task name (e.g. "ReCaptchaV3Task").
   * @param payload - Task-specific payload.
   * @param options - Optional solve options.
   * @returns Solve response with typed result.
   */
  async solve<T = Record<string, unknown>>(
    task: string,
    payload: Record<string, unknown>,
    options?: SolveOptions,
  ): Promise<SolveResponse<T>> {
    const headers: Record<string, string> = {};
    if (options?.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }
    return this.request<SolveResponse<T>>(
      "POST",
      "/v1/solve",
      { task, payload },
      headers,
    );
  }

  /* ── Solve retrieval ────────────────────────────────────────────── */

  /**
   * Retrieve a solve result by ID.
   * @param id - Solve UUID.
   */
  async getSolve<T = Record<string, unknown>>(
    id: string,
  ): Promise<SolveResponse<T>> {
    return this.request<SolveResponse<T>>("GET", `/v1/solves/${id}`);
  }

  /**
   * List solve history.
   * @param limit - Maximum number of records. Defaults to 20.
   */
  async listSolves(limit = 20): Promise<SolveHistory> {
    return this.request<SolveHistory>(
      "GET",
      `/v1/solves?limit=${limit}`,
    );
  }

  /* ── Discovery ──────────────────────────────────────────────────── */

  /**
   * Discover registered solver services and their readiness.
   */
  async services(): Promise<ServiceCatalog> {
    return this.request<ServiceCatalog>("GET", "/v1/solver/services");
  }

  /* ── Dashboard ──────────────────────────────────────────────────── */

  /**
   * Read workspace metrics and balance.
   */
  async dashboard(): Promise<Dashboard> {
    return this.request<Dashboard>("GET", "/v1/dashboard");
  }
}
