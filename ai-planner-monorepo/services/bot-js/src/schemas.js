import { z } from "zod";

export const ApiValidationErrorSchema = z.object({
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  type: z.string(),
});

export const ApiErrorSchema = z.object({
  detail: z.union([z.string(), z.array(ApiValidationErrorSchema)]),
});

export const TaskStatusSchema = z.enum(["planned", "done", "cancelled"]);
export const TaskPrioritySchema = z.enum(["low", "medium", "high"]);
export const TaskSourceSchema = z.enum(["manual", "text", "voice"]);

export const TaskResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  scheduled_at: z.string().nullable(),
  duration_minutes: z.number().int().positive(),
  status: TaskStatusSchema,
  priority: TaskPrioritySchema,
  source: TaskSourceSchema,
});

export const TextCommandRequestSchema = z.object({
  text: z.string().min(1).max(500),
});
