import { z } from "zod";
import { AppError } from "../errors/app-error";

export function parseInput<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw new AppError(400, "VALIDATION_ERROR", "Parametrii trimiși nu sunt valizi.",
    z.flattenError(result.error).fieldErrors as Record<string, string[]>);
  return result.data;
}
