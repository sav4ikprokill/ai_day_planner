import axios from "axios";
import { config } from "./config.js";
import { createTelegramInitData } from "./auth.js";
import {
  ApiErrorSchema,
  TaskResponseSchema,
  TextCommandRequestSchema,
} from "./schemas.js";

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 5000,
});

function formatApiError(error) {
  if (error.response?.data) {
    const parsed = ApiErrorSchema.safeParse(error.response.data);

    if (parsed.success) {
      if (typeof parsed.data.detail === "string") {
        return parsed.data.detail;
      }

      return parsed.data.detail.map((item) => item.msg).join(", ");
    }
  }

  if (error.code === "ECONNREFUSED") {
    return "Backend недоступен";
  }

  return error.message || "Неизвестная ошибка";
}

function buildHeaders(telegramUser) {
  return {
    "X-Telegram-Init-Data": createTelegramInitData(
      telegramUser,
      config.telegramToken,
    ),
  };
}

export async function createTaskFromText(text, telegramUser) {
  try {
    const payload = TextCommandRequestSchema.parse({ text });
    const response = await api.post("/tasks/parse", payload, {
      headers: buildHeaders(telegramUser),
    });

    return TaskResponseSchema.parse(response.data);
  } catch (error) {
    throw new Error(formatApiError(error));
  }
}

export async function getTasks(telegramUser) {
  try {
    const response = await api.get("/tasks/", {
      headers: buildHeaders(telegramUser),
    });
    return response.data.map((task) => TaskResponseSchema.parse(task));
  } catch (error) {
    throw new Error(formatApiError(error));
  }
}
