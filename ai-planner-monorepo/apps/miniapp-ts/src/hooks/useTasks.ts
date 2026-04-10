import { useEffect, useState } from "react";
import type { TaskResponse } from "@ai-planner/contracts";
import {
  createTaskFromText,
  fetchTasks,
  getOptimizedTasks,
  type OptimizedTask,
} from "../api-client";

export function useTasks(authenticated: boolean) {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [optimizedTasks, setOptimizedTasks] = useState<OptimizedTask[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadTasks() {
    try {
      setLoading(true);
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      console.error(error);
      setMessage("Сейчас не удалось загрузить задачи.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }

    void loadTasks();
  }, [authenticated]);

  async function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setMessage("Сначала опиши задачу для планировщика.");
      return;
    }

    try {
      const task = await createTaskFromText(text.trim());
      setMessage(`Добавлено: ${task.title}`);
      setText("");
      await loadTasks();
    } catch (error) {
      console.error(error);
      setMessage("Не удалось создать задачу.");
    }
  }

  async function optimizeTasks() {
    try {
      setOptimizing(true);
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
      const data = await getOptimizedTasks();
      setOptimizedTasks(data);
      setMessage(
        data.length > 0
          ? "Оптимальный порядок задач готов."
          : "Нет активных задач для оптимизации.",
      );
    } catch (error) {
      console.error(error);
      setMessage("Не удалось оптимизировать расписание.");
    } finally {
      setOptimizing(false);
    }
  }

  return {
    tasks,
    optimizedTasks,
    text,
    setText,
    loading,
    optimizing,
    message,
    loadTasks,
    submitTask,
    optimizeTasks,
  };
}
