import {
  HabitCreateSchema,
  HabitResponseSchema,
} from "@ai-planner/contracts";
import { apiClient } from "./client";

export async function fetchHabits() {
  const response = await apiClient.get("/habits/");
  return response.data.map((habit: unknown) =>
    HabitResponseSchema.parse(habit),
  );
}

export async function createHabit(category: string, preferredTime: string) {
  const payload = HabitCreateSchema.parse({
    category,
    preferred_time: preferredTime,
  });

  const response = await apiClient.post("/habits/", payload);
  return HabitResponseSchema.parse(response.data);
}
