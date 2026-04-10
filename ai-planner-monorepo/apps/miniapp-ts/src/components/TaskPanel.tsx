import styled from "@emotion/styled";
import type { TaskResponse } from "@ai-planner/contracts";

const Panel = styled.section`
  padding: 18px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(18px);
`;
const SectionTitle = styled.h2`margin:0;font-size:1.05rem;letter-spacing:-0.03em;`;
const SectionText = styled.p`margin:6px 0 0;color:var(--tg-theme-hint-color,rgba(15,23,42,.62));font-size:.92rem;line-height:1.45;`;
const SpinnerWrap = styled.div`display:flex;justify-content:center;padding:20px 0 10px;`;
const Spinner = styled.div`
  width:28px;height:28px;border-radius:50%;border:3px solid rgba(148,163,184,.24);border-top-color:#4f46e5;animation:spin .9s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
const EmptyState = styled.div`padding:24px 18px;border-radius:24px;background:rgba(255,255,255,.7);color:rgba(71,85,105,.95);text-align:center;line-height:1.55;`;
const CardStack = styled.div`display:flex;flex-direction:column;gap:12px;margin-top:16px;`;
const TaskCard = styled.article`
  padding:16px;border-radius:24px;background:rgba(255,255,255,.88);box-shadow:0 8px 24px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,.4);
  border:1px solid rgba(226,232,240,.9);transition:transform .18s ease,box-shadow .18s ease;
  &:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(15,23,42,.1),inset 0 1px 0 rgba(255,255,255,.4);}
`;
const CardHeader = styled.div`display:flex;justify-content:space-between;gap:10px;align-items:flex-start;`;
const TaskTitle = styled.strong`display:block;font-size:1rem;line-height:1.35;letter-spacing:-.02em;color:var(--tg-theme-text-color,#0f172a);`;
const TaskMeta = styled.div`margin-top:10px;color:rgba(71,85,105,.95);font-size:.9rem;line-height:1.45;`;
const PriorityPill = styled.span<{ tone: "high" | "medium" | "low" }>`
  display:inline-flex;align-items:center;justify-content:center;min-width:84px;padding:8px 12px;border-radius:999px;font-size:.79rem;font-weight:700;letter-spacing:.01em;
  background:${({ tone }) => tone === "high" ? "rgba(254, 226, 226, 0.95)" : tone === "medium" ? "rgba(254, 249, 195, 0.95)" : "rgba(220, 252, 231, 0.95)"};
  color:${({ tone }) => tone === "high" ? "#b91c1c" : tone === "medium" ? "#a16207" : "#15803d"};
`;

function getPriorityTone(priority: number): "high" | "medium" | "low" {
  if (priority >= 3) return "high";
  if (priority === 2) return "medium";
  return "low";
}

function getTaskPriorityLabel(priority: TaskResponse["priority"]): string {
  if (priority === "high") return "Высокий";
  if (priority === "medium") return "Средний";
  return "Низкий";
}

function getTaskStatusLabel(status: TaskResponse["status"]): string {
  if (status === "done") return "Выполнено";
  if (status === "cancelled") return "Отменено";
  return "Запланировано";
}

interface TaskPanelProps {
  loading: boolean;
  tasks: TaskResponse[];
}

export function TaskPanel({ loading, tasks }: TaskPanelProps) {
  return (
    <Panel>
      <SectionTitle>Задачи на сегодня</SectionTitle>
      <SectionText>Текущий список задач в компактном мобильном формате.</SectionText>

      {loading && <SpinnerWrap><Spinner /></SpinnerWrap>}
      {!loading && tasks.length === 0 && <EmptyState>📭 Пока нет задач. Попроси ИИ добавить первую.</EmptyState>}
      {!loading && tasks.length > 0 && (
        <CardStack>
          {tasks.map((task) => (
            <TaskCard key={task.id}>
              <CardHeader>
                <TaskTitle>{task.title}</TaskTitle>
                <PriorityPill tone={getPriorityTone(task.priority === "high" ? 3 : task.priority === "medium" ? 2 : 1)}>
                  {getTaskPriorityLabel(task.priority)}
                </PriorityPill>
              </CardHeader>
              <TaskMeta>
                {task.category} • {getTaskStatusLabel(task.status)} • {task.scheduled_at ?? "без времени"}
              </TaskMeta>
            </TaskCard>
          ))}
        </CardStack>
      )}
    </Panel>
  );
}
