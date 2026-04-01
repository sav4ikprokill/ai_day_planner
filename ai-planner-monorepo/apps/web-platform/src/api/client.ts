import axios from "axios";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  timeout: 5000,
});

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

apiClient.interceptors.request.use((config) => {
  config.headers.set("X-Telegram-Init-Data", getTelegramInitData());
  return config;
});
