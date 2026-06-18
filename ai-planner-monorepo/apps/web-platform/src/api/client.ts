import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";
const TOKEN_KEY = "ai-planner-token";

let tokenPromise: Promise<string> | null = null;

async function fetchGuestToken(): Promise<string> {
  const guestId = crypto.randomUUID();
  const res = await fetch(`${API_URL}/api/v1/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guest_id: guestId }),
  });

  if (!res.ok) {
    throw new Error(`Auth error ${res.status}`);
  }

  const data = await res.json();
  const token = data.access_token;
  window.localStorage.setItem(TOKEN_KEY, token);
  return token;
}

async function getAccessToken(): Promise<string> {
  const cached = window.localStorage.getItem(TOKEN_KEY);
  if (cached) return cached;

  if (!tokenPromise) {
    tokenPromise = fetchGuestToken().finally(() => {
      tokenPromise = null;
    });
  }

  return tokenPromise;
}

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      window.localStorage.removeItem(TOKEN_KEY);
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
      return apiClient.request(config);
    }
    return Promise.reject(error);
  }
);

export { getAccessToken };