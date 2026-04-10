import styled from "@emotion/styled";
import type { OptimizedTask } from "../api-client";

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
const SectionRow = styled.div`display:flex;justify-content:space-between;align-items:flex-start;gap:16px;`;
const SectionTitle = styled.h2`margin:0;font-size:1.05rem;letter-spacing:-0.03em;`;
const SectionText = styled.p`margin:6px 0 0;color:var(--tg-theme-hint-color,rgba(15,23,42,.62));font-size:.92rem;line-height:1.45;`;
const PrimaryButton = styled.button<{ disabled?: boolean }>`
  border:none;border-radius:20px;padding:15px 18px;color:#fff;font-weight:700;letter-spacing:-.02em;
  transition:transform .18s ease,box-shadow .18s ease,opacity .18s ease;cursor:${({ disabled }) => (disabled ? "not-allowed" : "pointer")};opacity:${({ disabled }) => (disabled ? 0.68 : 1)};
  &:hover{transform:${({ disabled }) => (disabled ? "none" : "translateY(-1px)")};}
  &:active{transform:${({ disabled }) => (disabled ? "none" : "scale(0.985)")};}
`;
const OptimizeButton = styled(PrimaryButton)`
  min-width: 170px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #2563eb 100%);
  box-shadow:
    0 16px 34px rgba(37, 99, 235, 0.26),
    0 0 30px rgba(59, 130, 246, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.24);
`;
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

function getPriorityLabel(priority: number): string {
  if (priority >= 3) return "Высокий";
  if (priority === 2) return "Средний";
  return "Низкий";
}

interface OptimizerPanelProps {
  optimizing: boolean;
  optimizedTasks: OptimizedTask[];
  onOptimize: () => Promise<void>;
}

export function OptimizerPanel({ optimizing, optimizedTasks, onOptimize }: OptimizerPanelProps) {
  return (
    <Panel>
      <SectionRow>
        <div>
          <SectionTitle>Оптимизировать день</SectionTitle>
          <SectionText>Отправь активные задачи в движок планирования и получи оптимальный порядок выполнения.</SectionText>
        </div>
        <OptimizeButton type="button" onClick={() => void onOptimize()} disabled={optimizing}>
          {optimizing ? "Оптимизация..." : "Оптимизировать"}
        </OptimizeButton>
      </SectionRow>

      {optimizing && <SpinnerWrap><Spinner /></SpinnerWrap>}
      {!optimizing && optimizedTasks.length === 0 && <EmptyState>Пока нет оптимизированного плана. Нажми кнопку выше, чтобы движок расставил задачи по приоритету.</EmptyState>}
      {optimizedTasks.length > 0 && (
        <CardStack>
          {optimizedTasks.map((task) => (
            <TaskCard key={task.id}>
              <CardHeader>
                <TaskTitle>{task.title}</TaskTitle>
                <PriorityPill tone={getPriorityTone(task.priority)}>{getPriorityLabel(task.priority)}</PriorityPill>
              </CardHeader>
              <TaskMeta>Оптимизированный порядок • Задача #{task.id}</TaskMeta>
            </TaskCard>
          ))}
        </CardStack>
      )}
    </Panel>
  );
}
