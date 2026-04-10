import axios, { type AxiosInstance } from "axios";
import type { HabitResponse, TaskResponse, TaskStatus } from "@ai-planner/contracts";

export interface OptimizedTask {
  id: number;
  title: string;
  priority: number;
}

export interface TaskUpdatePayload {
  title?: string;
  category?: string;
  scheduled_at?: string | null;
  duration_minutes?: number;
  priority?: "low" | "medium" | "high";
}

export interface HabitCreatePayload {
  category: string;
  preferred_time: string;
}

export function createApiClient(baseUrl: string, getInitData: () => string): AxiosInstance {
  const client = axios.create({
    baseURL: baseUrl,
    timeout: 5000,
  });

  client.interceptors.request.use((config) => {
    config.headers.set("X-Telegram-Init-Data", getInitData());
    return config;
  });

  return client;
}

export async function getTasks(client: AxiosInstance): Promise<TaskResponse[]> {
  const response = await client.get<TaskResponse[]>("/tasks/");
  return response.data;
}

export async function createTask(
  client: AxiosInstance,
  payload: {
    title: string;
    category?: string;
    scheduled_at?: string | null;
    duration_minutes?: number;
    priority?: "low" | "medium" | "high";
    source?: "manual" | "text" | "voice" | "habit";
  },
): Promise<TaskResponse> {
  const response = await client.post<TaskResponse>("/tasks/", payload);
  return response.data;
}

export async function parseTask(client: AxiosInstance, text: string): Promise<TaskResponse> {
  const response = await client.post<TaskResponse>("/tasks/parse", { text });
  return response.data;
}

export async function getOptimizedTasks(client: AxiosInstance): Promise<OptimizedTask[]> {
  const response = await client.get<OptimizedTask[]>("/tasks/optimized");
  return response.data;
}

export async function updateTaskStatus(
  client: AxiosInstance,
  taskId: number,
  status: TaskStatus,
): Promise<TaskResponse> {
  const response = await client.patch<TaskResponse>(`/tasks/${taskId}/status`, { status });
  return response.data;
}

export async function deleteTask(client: AxiosInstance, taskId: number): Promise<void> {
  await client.delete(`/tasks/${taskId}`);
}

export async function updateTask(
  client: AxiosInstance,
  taskId: number,
  payload: TaskUpdatePayload,
): Promise<TaskResponse> {
  const response = await client.put<TaskResponse>(`/tasks/${taskId}`, payload);
  return response.data;
}

export async function getHabits(client: AxiosInstance): Promise<HabitResponse[]> {
  const response = await client.get<HabitResponse[]>("/habits/");
  return response.data;
}

export async function createHabit(
  client: AxiosInstance,
  payload: HabitCreatePayload,
): Promise<HabitResponse> {
  const response = await client.post<HabitResponse>("/habits/", payload);
  return response.data;
}
