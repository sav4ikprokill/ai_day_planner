import {
  TaskResponseSchema,
  TextCommandRequestSchema,
  type TaskResponse,
} from "@ai-planner/contracts";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const mockInitData = "dev-mode-init-data";

function getTelegramInitData(): string {
  const initData = window.Telegram?.WebApp?.initData;
  return initData && initData.length > 0 ? initData : mockInitData;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("X-Telegram-Init-Data", getTelegramInitData());

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function isTelegramWebAppAvailable(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export async function fetchTasks(): Promise<TaskResponse[]> {
  const data = await request<unknown[]>("/tasks/");
  return Array.isArray(data)
    ? data.map((task) => TaskResponseSchema.parse(task))
    : [];
}

export async function createTaskFromText(text: string): Promise<TaskResponse> {
  const payload = TextCommandRequestSchema.parse({ text });
  const data = await request<unknown>("/tasks/parse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return TaskResponseSchema.parse(data);
}
