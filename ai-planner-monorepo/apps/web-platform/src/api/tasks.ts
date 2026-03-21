import {
  TaskResponseSchema,
  TaskStatusUpdateSchema,
  TextCommandRequestSchema,
} from "@ai-planner/contracts";
import { apiClient } from "./client";

export async function fetchTasks() {
  const response = await apiClient.get("/tasks/");
  return response.data.map((task: unknown) => TaskResponseSchema.parse(task));
}

export async function createTaskFromText(text: string) {
  const payload = TextCommandRequestSchema.parse({ text });
  const response = await apiClient.post("/tasks/parse", payload);
  return TaskResponseSchema.parse(response.data);
}

export async function updateTaskStatus(
  taskId: number,
  status: "planned" | "done" | "cancelled",
) {
  const payload = TaskStatusUpdateSchema.parse({ status });
  const response = await apiClient.patch(`/tasks/${taskId}/status`, payload);
  return TaskResponseSchema.parse(response.data);
}
