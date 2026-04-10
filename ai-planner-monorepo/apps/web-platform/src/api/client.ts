import { createApiClient } from "@ai-planner/api-client";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

function getTelegramInitData(): string {
  const mockInitData = window.localStorage.getItem("mock_init_data");
  if (mockInitData) {
    return mockInitData;
  }

  const telegramInitData = (
    window as Window & {
      Telegram?: {
        WebApp?: {
          initData?: string;
        };
      };
    }
  ).Telegram?.WebApp?.initData;

  return telegramInitData ?? "";
}

export const apiClient = createApiClient(
  import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  getTelegramInitData,
);
