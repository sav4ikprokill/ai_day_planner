import { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Card, CardTitle } from "../components/Card";
import { fetchHabits } from "../api/habits";
import type { HabitResponse } from "@ai-planner/contracts";

const HabitList = styled.div`
  display: grid;
  gap: 12px;
`;

const HabitItem = styled.div`
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.05);
`;

const EmptyState = styled.div`
  color: #cbd5e1;
`;

export function HabitsPage() {
  const [habits, setHabits] = useState<HabitResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    void loadHabits();
  }, []);

  return (
    <Card>
      <CardTitle>Habits</CardTitle>

      {loading && <EmptyState>Загрузка...</EmptyState>}
      {error && <EmptyState>{error}</EmptyState>}

      {!loading && !error && (
        <HabitList>
          {habits.length === 0 ? (
            <EmptyState>Привычек пока нет.</EmptyState>
          ) : (
            habits.map((habit) => (
              <HabitItem key={habit.id}>
                {habit.category} → {habit.preferred_time}
              </HabitItem>
            ))
          )}
        </HabitList>
      )}
    </Card>
  );
}