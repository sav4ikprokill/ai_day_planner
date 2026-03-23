import crypto from "crypto";

function buildDataCheckString(params) {
  return Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

export function createTelegramInitData(telegramUser, botToken) {
  if (!telegramUser?.id) {
    throw new Error("Telegram user id is required for authenticated API calls");
  }

  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN is required for authenticated API calls");
  }

  const params = {
    auth_date: String(Math.floor(Date.now() / 1000)),
    user: JSON.stringify({
      id: telegramUser.id,
      username: telegramUser.username ?? undefined,
      first_name: telegramUser.first_name ?? "",
      last_name: telegramUser.last_name ?? undefined,
      language_code: telegramUser.language_code ?? undefined,
    }),
  };

  const dataCheckString = buildDataCheckString(params);
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const searchParams = new URLSearchParams({
    ...params,
    hash,
  });

  return searchParams.toString();
}
