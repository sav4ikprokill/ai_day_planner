import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import type { HabitResponse } from "@ai-planner/contracts";
import { createHabit, fetchHabits } from "../api/habits";
import { Card, CardText, CardTitle } from "../components/Card";

const Stack = styled.div`
  display: grid;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }
`;

const FormCard = styled(Card)`
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

const Form = styled.form`
  display: grid;
  gap: 12px;
  margin-top: 14px;
`;

const Input = styled.input`
  padding: 14px 16px;
  border: none;
  border-radius: 16px;
  outline: none;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 16px;
  min-height: 48px;
`;

const Button = styled.button`
  padding: 14px 16px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-weight: 700;
  font-size: 15px;
  min-height: 48px;
`;

const HabitList = styled.div`
  display: grid;
  gap: 12px;
`;

const HabitItem = styled.div`
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;

  @media (max-width: 480px) {
    padding: 14px;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HabitCategory = styled.div`
  font-weight: 600;
  font-size: 15px;
`;

const HabitTime = styled.div`
  color: #94a3b8;
  font-size: 14px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
`;

const EmptyState = styled.div`
  color: #94a3b8;
`;

const Message = styled.div`
  color: #cbd5e1;
`;

export function HabitsPage() {
  const [habits, setHabits] = useState<HabitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [preferredTime, setPreferredTime] = useState("19:00:00");
  const [message, setMessage] = useState("");

  async function loadHabits() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHabits();
      setHabits(data);
    } catch (err) {
      console.error(err);
      setError("Не удалось загрузить привычки");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!category.trim()) {
      setMessage("Введи категорию привычки");
      return;
    }

    try {
      const habit = await createHabit(category.trim(), preferredTime);
      setMessage(`Сохранено: ${habit.category} → ${habit.preferred_time}`);
      setCategory("");
      await loadHabits();
    } catch (err) {
      console.error(err);
      setMessage("Не удалось сохранить привычку");
    }
  }

  useEffect(() => {
    void loadHabits();
  }, []);

  return (
    <Stack>
      <FormCard>
        <CardTitle>Новая привычка</CardTitle>
        <CardText>
          Привычка задаёт предпочтительное время для категории задач.
        </CardText>

        <Form onSubmit={handleSubmit}>
          <Input
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Например: спорт"
          />

          <Input
            value={preferredTime}
            onChange={(event) => setPreferredTime(event.target.value)}
            placeholder="19:00:00"
            type="time"
          />

          <Button type="submit">Сохранить привычку</Button>

          {message && <Message>{message}</Message>}
        </Form>
      </FormCard>

      <Card>
        <CardTitle>Привычки</CardTitle>

        {loading && <EmptyState>Загрузка...</EmptyState>}
        {error && <EmptyState>{error}</EmptyState>}

        {!loading && !error && (
          <HabitList>
            {habits.length === 0 ? (
              <EmptyState>Привычек пока нет.</EmptyState>
            ) : (
              habits.map((habit) => (
                <HabitItem key={habit.id}>
                  <HabitCategory>{habit.category}</HabitCategory>
                  <HabitTime>{habit.preferred_time}</HabitTime>
                </HabitItem>
              ))
            )}
          </HabitList>
        )}
      </Card>
    </Stack>
  );
}
