import { useCallback, useEffect, useMemo, useState } from "react";
import type { TaskResponse, TaskStatus } from "@ai-planner/contracts";
import { fetchTasks, updateTaskStatus } from "../api/tasks";

function parseDate(dateString: string | null): number | null {
  if (!dateString) {
    return null;
  }

  const timestamp = new Date(dateString).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function sortTasks(tasks: TaskResponse[]): TaskResponse[] {
  return [...tasks].sort((a, b) => {
    const aTime = parseDate(a.scheduled_at);
    const bTime = parseDate(b.scheduled_at);

    if (aTime !== null && bTime !== null) {
      return aTime - bTime;
    }

    if (aTime !== null) {
      return -1;
    }

    if (bTime !== null) {
      return 1;
    }

    return b.id - a.id;
  });
}

function isToday(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }

  const now = new Date();
  const date = new Date(dateString);

  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  );
}

function isFuture(dateString: string | null): boolean {
  if (!dateString) {
    return false;
  }

  const now = new Date();
  const date = new Date(dateString);

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return date > todayStart;
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();
      setTasks(sortTasks(data));
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }, []);

  const changeStatus = useCallback(async (taskId: number, status: TaskStatus) => {
    try {
      const updatedTask = await updateTaskStatus(taskId, status);
      setTasks((prev) =>
        sortTasks(prev.map((task) => (task.id === taskId ? updatedTask : task))),
      );
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить статус задачи");
    }
  }, []);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const plannedTasks = useMemo(
    () => sortTasks(tasks.filter((task) => task.status === "planned")),
    [tasks],
  );

  const doneTasks = useMemo(
    () => sortTasks(tasks.filter((task) => task.status === "done")),
    [tasks],
  );

  const cancelledTasks = useMemo(
    () => sortTasks(tasks.filter((task) => task.status === "cancelled")),
    [tasks],
  );

  const todayTasks = useMemo(
    () => sortTasks(plannedTasks.filter((task) => isToday(task.scheduled_at))),
    [plannedTasks],
  );

  const upcomingTasks = useMemo(
    () => sortTasks(plannedTasks.filter((task) => isFuture(task.scheduled_at))),
    [plannedTasks],
  );

  return {
    tasks,
    plannedTasks,
    doneTasks,
    cancelledTasks,
    todayTasks,
    upcomingTasks,
    loading,
    error,
    loadTasks,
    changeStatus,
  };
}
