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

type Props = {
  tasks: TaskResponse[];
  emptyText?: string;
  onStatusChange?: (taskId: number, status: TaskStatus) => void;
};

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
            <StatusBadge status={task.status}>{task.status}</StatusBadge>
          </Top>

          <Meta>
            category: {task.category} | time: {task.scheduled_at ?? "без времени"} | priority: {task.priority} | source: {task.source}
          </Meta>

          {onStatusChange && (
            <Actions>
              {task.status !== "planned" && (
                <ActionButton onClick={() => onStatusChange(task.id, "planned")}>
                  Planned
                </ActionButton>
              )}
              {task.status !== "done" && (
                <ActionButton onClick={() => onStatusChange(task.id, "done")}>
                  Done
                </ActionButton>
              )}
              {task.status !== "cancelled" && (
                <ActionButton onClick={() => onStatusChange(task.id, "cancelled")}>
                  Cancel
                </ActionButton>
              )}
            </Actions>
          )}
        </Item>
      ))}
    </List>
  );
}