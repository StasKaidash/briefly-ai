/**
 * Tiny structured logger. Server-side only — `process.env.NODE_ENV` gates
 * debug output so production stays quiet.
 *
 * Use this everywhere instead of `console.log`. Format is one-line JSON-ish
 * so it grep-pipes cleanly in Vercel logs.
 */

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, scope: string, message: string, fields?: Record<string, unknown>) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const payload: Record<string, unknown> = {
    t: new Date().toISOString(),
    level,
    scope,
    msg: message,
    ...fields,
  };

  const line = `[${payload.t}] ${level.toUpperCase()} ${scope}: ${message}${
    fields ? ` ${JSON.stringify(fields)}` : ""
  }`;

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (scope: string, message: string, fields?: Record<string, unknown>) =>
    emit("debug", scope, message, fields),
  info: (scope: string, message: string, fields?: Record<string, unknown>) =>
    emit("info", scope, message, fields),
  warn: (scope: string, message: string, fields?: Record<string, unknown>) =>
    emit("warn", scope, message, fields),
  error: (scope: string, message: string, fields?: Record<string, unknown>) =>
    emit("error", scope, message, fields),
};
