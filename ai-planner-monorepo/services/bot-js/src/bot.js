import http from "node:http";
import TelegramBot from "node-telegram-bot-api";
import { config } from "./config.js";
import { createTaskFromText, getTasks } from "./api-client.js";

if (!config.telegramToken) {
  throw new Error("TELEGRAM_BOT_TOKEN is not set");
}

const bot = new TelegramBot(config.telegramToken, { polling: true });

bot.onText(/\/start/, async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    [
      "Привет. Я AI Planner Bot.",
      "Отправь мне задачу обычным текстом.",
      "",
      "Примеры:",
      "добавь тренировку завтра в 19:00",
      "запланируй чтение вечером",
      "",
      "Команды:",
      "/tasks — показать последние задачи",
    ].join("\n"),
  );
});

bot.onText(/\/tasks/, async (msg) => {
  try {
    const tasks = await getTasks(msg.from);

    if (!tasks.length) {
      await bot.sendMessage(msg.chat.id, "Задач пока нет.");
      return;
    }

    const lines = tasks.slice(0, 10).map((task, index) => {
      const time = task.scheduled_at ?? "без времени";
      return `${index + 1}. ${task.title} | ${task.category} | ${time}`;
    });

    await bot.sendMessage(msg.chat.id, lines.join("\n"));
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    await bot.sendMessage(
      msg.chat.id,
      `Не удалось получить задачи: ${error.message}`,
    );
  }
});

bot.on("message", async (msg) => {
  const text = msg.text?.trim();

  if (!text || text.startsWith("/")) {
    return;
  }

  try {
    const task = await createTaskFromText(text, msg.from);

    await bot.sendMessage(
      msg.chat.id,
      [
        "Задача создана:",
        `Название: ${task.title}`,
        `Категория: ${task.category}`,
        `Время: ${task.scheduled_at ?? "не определено"}`,
        `Длительность: ${task.duration_minutes} мин`,
      ].join("\n"),
    );
  } catch (error) {
    console.error("Failed to create task:", error);
    await bot.sendMessage(
      msg.chat.id,
      `Не удалось создать задачу: ${error.message}`,
    );
  }
});

const server = http.createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/notify") {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }

  try {
    const body = await new Promise((resolve, reject) => {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      request.on("error", reject);
    });

    const payload = JSON.parse(body);
    if (!payload.telegram_id || !payload.message) {
      response.statusCode = 400;
      response.end("Invalid payload");
      return;
    }

    await bot.sendMessage(payload.telegram_id, payload.message);
    response.statusCode = 204;
    response.end();
  } catch (error) {
    console.error("Failed to handle /notify:", error);
    response.statusCode = 500;
    response.end("Failed to notify");
  }
});

server.listen(3001, "0.0.0.0", () => {
  console.log("Bot notify endpoint listening on 0.0.0.0:3001");
});
