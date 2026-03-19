import { z } from "zod";

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

export const HabitResponseSchema = z.object({
  id: z.number().int().positive(),
  category: z.string().min(1).max(100),
  preferred_time: z.string(),
});

export const TextCommandRequestSchema = z.object({
  text: z.string().min(1).max(500),
});

export const TaskStatusUpdateSchema = z.object({
  status: TaskStatusSchema,
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
export type HabitResponse = z.infer<typeof HabitResponseSchema>;
export type TextCommandRequest = z.infer<typeof TextCommandRequestSchema>;
export type TaskStatusUpdate = z.infer<typeof TaskStatusUpdateSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type TaskSource = z.infer<typeof TaskSourceSchema>;