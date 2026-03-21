import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import { createTaskFromText } from "../api/tasks";
import { Card, CardText, CardTitle } from "../components/Card";
import { TaskList } from "../components/TaskList";
import { useTasks } from "../hooks/useTasks";

const Stack = styled.div`
  display: grid;
  gap: 20px;
`;

const Hero = styled(Card)`
  padding: 32px;
`;

const Eyebrow = styled.div`
  color: #94a3b8;
  font-size: 14px;
  margin-bottom: 10px;
`;

const HeroTitle = styled.h1`
  margin: 0;
  font-size: 42px;
  line-height: 1.05;
  letter-spacing: -0.05em;

  @media (max-width: 700px) {
    font-size: 32px;
  }
`;

const HeroText = styled.p`
  margin: 14px 0 0;
  max-width: 720px;
  color: #cbd5e1;
  line-height: 1.6;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(Card)`
  padding: 22px;
`;

const StatValue = styled.div`
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.04em;
`;

const StatLabel = styled.div`
  margin-top: 8px;
  color: #94a3b8;
`;

const QuickAddCard = styled(Card)`
  padding: 24px;
`;

const QuickForm = styled.form`
  display: grid;
  gap: 12px;
`;

const Input = styled.input`
  padding: 16px 18px;
  border: none;
  border-radius: 18px;
  outline: none;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
`;

const Button = styled.button`
  padding: 14px 18px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 700;
`;

const Message = styled.div`
  color: #cbd5e1;
`;

const Columns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export function DashboardPage() {
  const {
    tasks,
    plannedTasks,
    doneTasks,
    todayTasks,
    upcomingTasks,
    loading,
    error,
    changeStatus,
    loadTasks,
  } = useTasks();

  const [text, setText] = useState("");
  const [message, setMessage] = useState("");

  const recentDoneTasks = useMemo(
    () => doneTasks.slice(0, 3),
    [doneTasks],
  );

  const stats = useMemo(() => {
    return {
      total: tasks.length,
      planned: plannedTasks.length,
      done: doneTasks.length,
      today: todayTasks.length,
    };
  }, [tasks, plannedTasks, doneTasks, todayTasks]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim()) {
      setMessage("Введи текст задачи");
      return;
    }

    try {
      const task = await createTaskFromText(text);
      setMessage(`Создано: ${task.title}`);
      setText("");
      await loadTasks();
    } catch (err) {
      console.error(err);
      setMessage("Не удалось создать задачу");
    }
  }

  return (
    <Stack>
      <Hero>
        <Eyebrow>AI Planner Platform</Eyebrow>
        <HeroTitle>Спокойный фокус на дне, а не на хаосе.</HeroTitle>
        <HeroText>
          Главный экран показывает, что важно сейчас: общий ритм задач, быстрый
          ввод, фокус на сегодня и ближайшие действия.
        </HeroText>
      </Hero>

      <StatsGrid>
        <StatCard>
          <StatValue>{stats.total}</StatValue>
          <StatLabel>Всего задач</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.planned}</StatValue>
          <StatLabel>Активные</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.done}</StatValue>
          <StatLabel>Выполнено</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.today}</StatValue>
          <StatLabel>На сегодня</StatLabel>
        </StatCard>
      </StatsGrid>

      <QuickAddCard>
        <CardTitle>Quick Add</CardTitle>
        <CardText>
          Напиши задачу обычной фразой. Например: «добавь тренировку завтра в
          19:00».
        </CardText>

        <QuickForm onSubmit={handleSubmit}>
          <Input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="добавь тренировку завтра в 19:00"
          />
          <Button type="submit">Создать задачу</Button>
          {message && <Message>{message}</Message>}
        </QuickForm>
      </QuickAddCard>

      <Columns>
        <Card>
          <CardTitle>Today</CardTitle>
          {loading && <div>Загрузка...</div>}
          {error && <div>{error}</div>}
          {!loading && !error && (
            <TaskList
              tasks={todayTasks}
              emptyText="На сегодня задач нет."
              onStatusChange={changeStatus}
            />
          )}
        </Card>

        <Card>
          <CardTitle>Upcoming</CardTitle>
          {loading && <div>Загрузка...</div>}
          {error && <div>{error}</div>}
          {!loading && !error && (
            <TaskList
              tasks={upcomingTasks.slice(0, 5)}
              emptyText="Ближайших задач нет."
              onStatusChange={changeStatus}
            />
          )}
        </Card>
      </Columns>

      <Card>
        <CardTitle>Recent Done</CardTitle>
        {loading && <div>Загрузка...</div>}
        {error && <div>{error}</div>}
        {!loading && !error && (
          <TaskList
            tasks={recentDoneTasks}
            emptyText="Пока нет завершённых задач."
          />
        )}
      </Card>
    </Stack>
  );
}