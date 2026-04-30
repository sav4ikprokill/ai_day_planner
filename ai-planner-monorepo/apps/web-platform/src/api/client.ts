import { createApiClient } from "@ai-planner/api-client";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function getTelegramInitData(): string | null {
  const telegramInitData = (
    window as Window & {
      Telegram?: {
        WebApp?: {
          initData?: string;
        };
      };
    }
  ).Telegram?.WebApp?.initData;

  if (telegramInitData?.trim()) {
    return telegramInitData;
  }

  const demoInitData = import.meta.env.VITE_DEMO_INIT_DATA?.trim();
  if (demoInitData) {
    return demoInitData;
  }

  console.warn(
    "Telegram WebApp initData is missing and VITE_DEMO_INIT_DATA is not configured.",
  );
  return null;
}

export const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  getTelegramInitData,
);
