import dotenv from "dotenv";

dotenv.config();

export const config = {
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  apiBaseUrl: process.env.API_BASE_URL || "http://127.0.0.1:8000",
};

if (!config.apiBaseUrl) {
  throw new Error("API_BASE_URL is not set");
}
