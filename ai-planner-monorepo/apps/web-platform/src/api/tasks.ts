import {
  TaskResponseSchema,
} from "@ai-planner/contracts";
import {
  getTasks as getTasksRequest,
  parseTask,
  updateTaskStatus as updateTaskStatusRequest,
} from "@ai-planner/api-client";
import { apiClient } from "./client";

export async function fetchTasks() {
  const data = await getTasksRequest(apiClient);
  return data.map((task) => TaskResponseSchema.parse(task));
}

export async function createTaskFromText(text: string) {
  const task = await parseTask(apiClient, text);
  return TaskResponseSchema.parse(task);
}

export async function updateTaskStatus(
  taskId: number,
  status: "planned" | "done" | "cancelled",
) {
  const task = await updateTaskStatusRequest(apiClient, taskId, status);
  return TaskResponseSchema.parse(task);
}
