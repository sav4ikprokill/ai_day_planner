import type { TaskResponse } from "@ai-planner/contracts";
import {
  createApiClient,
  getOptimizedTasks as getOptimizedTasksRequest,
  getTasks,
  parseTask,
  type OptimizedTask,
} from "@ai-planner/api-client";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const mockInitData = "dev-mode-init-data";
const mockInitDataStorageKey = "mock_init_data";
const mockUserNameStorageKey = "mock_user_name";
const apiClient = createApiClient(apiBaseUrl, () => getAuthInitData() ?? "");

function getStoredMockInitData(): string | null {
  try {
    return window.localStorage.getItem(mockInitDataStorageKey);
  } catch {
    return null;
  }
}

export function getAuthInitData(): string | null {
  const initData = window.Telegram?.WebApp?.initData;
  if (initData && initData.length > 0) {
    return initData;
  }

  return getStoredMockInitData();
}

export function isTelegramWebAppAvailable(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthInitData());
}

export function getStoredDisplayName(): string | null {
  try {
    return window.localStorage.getItem(mockUserNameStorageKey);
  } catch {
    return null;
  }
}

export function enableStandaloneDevAuth(name: string): void {
  const trimmedName = name.trim();

  window.localStorage.setItem(mockInitDataStorageKey, mockInitData);
  window.localStorage.setItem(
    mockUserNameStorageKey,
    trimmedName || "Локальный пользователь",
  );
}

export async function fetchTasks(): Promise<TaskResponse[]> {
  return getTasks(apiClient);
}

export async function createTaskFromText(text: string): Promise<TaskResponse> {
  return parseTask(apiClient, text);
}

export async function getOptimizedTasks(): Promise<OptimizedTask[]> {
  return getOptimizedTasksRequest(apiClient);
}

export type { OptimizedTask };
