import { z } from "zod";
import ApiError from "../../utils/api-error.js";

export function parseBody<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) throw ApiError.badRequest(result.error.issues[0]?.message ?? "Invalid request");
  return result.data;
}

export const optionalDate = z.iso.datetime({ offset: true }).nullable();
