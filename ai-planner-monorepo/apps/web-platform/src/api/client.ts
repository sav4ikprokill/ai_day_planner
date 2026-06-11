import { createApiClient } from "@ai-planner/api-client";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const AUTH_MODE_STORAGE_KEY = "ai-planner-auth-mode";

export type AuthMode = "demo" | "telegram";

function getTelegramInitDataFromWebApp(): string | null {
  const telegramInitData = (
    window as Window & {
      Telegram?: {
        WebApp?: {
          initData?: string;
        };
      };
    }
  ).Telegram?.WebApp?.initData;

  return telegramInitData?.trim() || null;
}

export function getAuthMode(): AuthMode {
  const storedMode = window.localStorage.getItem(AUTH_MODE_STORAGE_KEY);

  if (storedMode === "demo" || storedMode === "telegram") {
    return storedMode;
  }

  const telegramInitData = getTelegramInitDataFromWebApp();

  if (telegramInitData) {
    window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, "telegram");
    return "telegram";
  }

  window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, "demo");
  return "demo";
}

export function setAuthMode(mode: AuthMode): void {
  window.localStorage.setItem(AUTH_MODE_STORAGE_KEY, mode);
  window.location.reload();
}

export function resetAuthMode(): void {
  window.localStorage.removeItem(AUTH_MODE_STORAGE_KEY);
  window.location.reload();
}

export function getTelegramInitData(): string | null {
  const mode = getAuthMode();

  if (mode === "telegram") {
    const telegramInitData = getTelegramInitDataFromWebApp();

    if (telegramInitData) {
      return telegramInitData;
    }

    console.warn("Telegram mode is selected, but Telegram WebApp initData is missing.");
    return null;
  }

  const demoInitData = import.meta.env.VITE_DEMO_INIT_DATA?.trim();

  if (demoInitData) {
    return demoInitData;
  }

  console.warn("Demo mode is selected, but VITE_DEMO_INIT_DATA is not configured.");
  return null;
}

export const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  getTelegramInitData,
);