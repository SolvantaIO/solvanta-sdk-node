/** Error thrown by the Solvanta client on API failures. */
export class SolvantaError extends Error {
  /** Machine-readable error code from the API (e.g. "insufficient_credits"). */
  readonly code: string;
  /** HTTP status code of the response. */
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number) {
    super(message);
    this.name = "SolvantaError";
    this.code = code;
    this.statusCode = statusCode;
  }
}
