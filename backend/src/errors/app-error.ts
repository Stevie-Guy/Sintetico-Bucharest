/**
 * Eroare cunoscută, cu mesaj sigur de afișat utilizatorului.
 * Error handler-ul o transformă în răspuns JSON: { error: { code, message, fields? } }.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}
