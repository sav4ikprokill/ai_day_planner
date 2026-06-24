import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Card, CardTitle } from "../components/Card";
import { TaskList } from "../components/TaskList";
import { useTasks } from "../hooks/useTasks";

const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  opacity: ${(props) => (props.active ? 1 : 0.65)};
  font-size: 14px;
  min-height: 44px;

  @media (max-width: 480px) {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    padding: 10px 8px;
  }
`;

const EmptyState = styled.div`
  color: #94a3b8;
`;

type FilterStatus = "all" | "planned" | "done" | "cancelled";

export function TasksPage() {
  const { tasks, loading, error, changeStatus } = useTasks();
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filteredTasks = useMemo(() => {
    if (filter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === filter);
  }, [tasks, filter]);

  return (
    <Card>
      <CardTitle>Задачи</CardTitle>

      <FilterRow>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          Все
        </FilterButton>
        <FilterButton
          active={filter === "planned"}
          onClick={() => setFilter("planned")}
        >
          Запланированные
        </FilterButton>
        <FilterButton active={filter === "done"} onClick={() => setFilter("done")}>
          Выполненные
        </FilterButton>
        <FilterButton
          active={filter === "cancelled"}
          onClick={() => setFilter("cancelled")}
        >
          Отменённые
        </FilterButton>
      </FilterRow>

      {loading && <EmptyState>Загрузка...</EmptyState>}
      {error && <EmptyState>{error}</EmptyState>}

      {!loading && !error && (
        <TaskList tasks={filteredTasks} onStatusChange={changeStatus} />
      )}
    </Card>
  );
}
