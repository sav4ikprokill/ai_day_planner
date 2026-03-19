import { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import type { TaskResponse, TaskStatus } from "@ai-planner/contracts";
import { fetchTasks, updateTaskStatus } from "../api/tasks";
import { Card, CardTitle } from "../components/Card";

const TaskList = styled.div`
  display: grid;
  gap: 12px;
`;

const TaskItem = styled.div`
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  gap: 10px;
`;

const TaskTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const TaskMain = styled.div`
  font-weight: 600;
  font-size: 16px;
`;

const TaskMeta = styled.div`
  color: #cbd5e1;
  font-size: 14px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
`;

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  opacity: ${(props) => (props.active ? 1 : 0.65)};
`;

const EmptyState = styled.div`
  color: #cbd5e1;
`;

const StatusBadge = styled.span<{ status: TaskStatus }>`
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  background: ${({ status }) => {
    if (status === "done") return "rgba(34, 197, 94, 0.2)";
    if (status === "cancelled") return "rgba(239, 68, 68, 0.2)";
    return "rgba(59, 130, 246, 0.2)";
  }};
  color: ${({ status }) => {
    if (status === "done") return "#86efac";
    if (status === "cancelled") return "#fca5a5";
    return "#93c5fd";
  }};
`;

type FilterStatus = "all" | "planned" | "done" | "cancelled";

export function TasksPage() {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить задачи");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(taskId: number, status: TaskStatus) {
    try {
      const updatedTask = await updateTaskStatus(taskId, status);
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task)),
      );
    } catch (err) {
      console.error(err);
      setError("Не удалось обновить статус задачи");
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  const filteredTasks = useMemo(() => {
    if (filter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  return (
    <Card>
      <CardTitle>Tasks</CardTitle>

      <FilterRow>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Все
        </FilterButton>
        <FilterButton
          active={filter === "planned"}
          onClick={() => setFilter("planned")}
        >
          Planned
        </FilterButton>
        <FilterButton active={filter === "done"} onClick={() => setFilter("done")}>
          Done
        </FilterButton>
        <FilterButton
          active={filter === "cancelled"}
          onClick={() => setFilter("cancelled")}
        >
          Cancelled
        </FilterButton>
      </FilterRow>

      {loading && <EmptyState>Загрузка...</EmptyState>}
      {error && <EmptyState>{error}</EmptyState>}

      {!loading && !error && (
        <TaskList>
          {filteredTasks.length === 0 ? (
            <EmptyState>Задач пока нет.</EmptyState>
          ) : (
            filteredTasks.map((task) => (
              <TaskItem key={task.id}>
                <TaskTop>
                  <TaskMain>{task.title}</TaskMain>
                  <StatusBadge status={task.status}>{task.status}</StatusBadge>
                </TaskTop>

                <TaskMeta>
                  category: {task.category} | time: {task.scheduled_at ?? "без времени"} | priority: {task.priority} | source: {task.source}
                </TaskMeta>

                <Actions>
                  {task.status !== "planned" && (
                    <Button onClick={() => handleStatusChange(task.id, "planned")}>
                      Planned
                    </Button>
                  )}
                  {task.status !== "done" && (
                    <Button onClick={() => handleStatusChange(task.id, "done")}>
                      Done
                    </Button>
                  )}
                  {task.status !== "cancelled" && (
                    <Button onClick={() => handleStatusChange(task.id, "cancelled")}>
                      Cancel
                    </Button>
                  )}
                </Actions>
              </TaskItem>
            ))
          )}
        </TaskList>
      )}
    </Card>
  );
}