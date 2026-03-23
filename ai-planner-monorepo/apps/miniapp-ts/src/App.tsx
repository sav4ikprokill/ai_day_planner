import { useEffect, useState } from "react";
import type { TaskResponse } from "@ai-planner/contracts";
import {
  createTaskFromText,
  fetchTasks,
  isTelegramWebAppAvailable,
} from "./api-client";

const shellStyle: React.CSSProperties = {
  maxWidth: 560,
  margin: "0 auto",
  padding: "24px 16px 64px",
  fontFamily: "Inter, system-ui, sans-serif",
  color: "#0f172a",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
  marginBottom: 16,
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "12px 16px",
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 14,
  border: "1px solid #cbd5e1",
  marginBottom: 12,
  boxSizing: "border-box",
};

export function App() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isTelegramEnv] = useState(isTelegramWebAppAvailable());

  async function loadTasks() {
    try {
      setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error(error);
      setMessage("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setMessage("Введи задачу");
      return;
    }

    try {
      const task = await createTaskFromText(text.trim());
      setMessage(`Создано: ${task.title}`);
      setText("");
      await loadTasks();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось создать задачу");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)",
      }}
    >
      <div style={shellStyle}>
        <h1 style={{ marginBottom: 8 }}>Mini AI Planner</h1>
        <p style={{ marginTop: 0, color: "#475569" }}>
          Упрощённый мобильный интерфейс для быстрого добавления задач.
        </p>
        {!isTelegramEnv && (
          <p style={{ marginTop: 0, color: "#b45309" }}>
            Режим разработки: Telegram initData не найден, используется dev fallback.
          </p>
        )}

        <section style={cardStyle}>
          <form onSubmit={handleSubmit}>
            <input
              style={inputStyle}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="добавь тренировку завтра в 19:00"
            />
            <button type="submit" style={buttonStyle}>
              Добавить
            </button>
          </form>
          {message && <p style={{ marginBottom: 0, color: "#334155" }}>{message}</p>}
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Задачи</h2>
          {loading && <p>Загрузка...</p>}
          {!loading && tasks.length === 0 && <p>Задач пока нет.</p>}
          {!loading &&
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 12,
                  marginTop: 12,
                }}
              >
                <strong>{task.title}</strong>
                <div style={{ color: "#475569", marginTop: 6 }}>
                  {task.category} | {task.status} | {task.scheduled_at ?? "без времени"}
                </div>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}
