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
    const tasks = await getTasks();

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
    const task = await createTaskFromText(text);

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