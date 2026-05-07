import styled from "@emotion/styled";
import type { TaskResponse, TaskStatus } from "@ai-planner/contracts";

const List = styled.div`
  display: grid;
  gap: 12px;
`;

const Item = styled.div`
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  display: grid;
  gap: 10px;
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
`;

const Meta = styled.div`
  color: #cbd5e1;
  font-size: 14px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
`;

const EmptyState = styled.div`
  color: #94a3b8;
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

const SourceBadge = styled.span`
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(249, 115, 22, 0.18);
  color: #fdba74;
`;

type Props = {
  tasks: TaskResponse[];
  emptyText?: string;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
};

function getStatusLabel(status: TaskStatus): string {
  if (status === "done") {
    return "Выполнено";
  }
  if (status === "cancelled") {
    return "Отменено";
  }
  return "Запланировано";
}

function getPriorityLabel(priority: TaskResponse["priority"]): string {
  if (priority === "high") {
    return "Высокий";
  }
  if (priority === "medium") {
    return "Средний";
  }
  return "Низкий";
}

function getSourceLabel(source: TaskResponse["source"]): string {
  if (source === "manual") {
    return "вручную";
  }
  if (source === "voice") {
    return "голос";
  }
  return "текст";
}

export function TaskList({
  tasks,
  emptyText = "Задач пока нет.",
  onStatusChange,
}: Props) {
  if (!tasks.length) {
    return <EmptyState>{emptyText}</EmptyState>;
  }

  return (
    <List>
      {tasks.map((task) => (
        <Item key={task.id}>
          <Top>
            <Title>{task.title}</Title>
            <Actions>
              {task.source === "voice" && <SourceBadge>voice</SourceBadge>}
              <StatusBadge status={task.status}>{getStatusLabel(task.status)}</StatusBadge>
            </Actions>
          </Top>

          <Meta>
            категория: {task.category} | время: {task.scheduled_at ?? "без времени"} | приоритет: {getPriorityLabel(task.priority)} | источник: {getSourceLabel(task.source)}
          </Meta>

          {onStatusChange && (
            <Actions>
              {task.status !== "planned" && (
                <ActionButton onClick={() => onStatusChange(task.id, "planned")}>
                  Запланировать
                </ActionButton>
              )}
              {task.status !== "done" && (
                <ActionButton onClick={() => onStatusChange(task.id, "done")}>
                  Выполнено
                </ActionButton>
              )}
              {task.status !== "cancelled" && (
                <ActionButton onClick={() => onStatusChange(task.id, "cancelled")}>
                  Отменить
                </ActionButton>
              )}
            </Actions>
          )}
        </Item>
      ))}
    </List>
  );
}
