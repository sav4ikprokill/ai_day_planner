import {
  HabitCreateSchema,
  HabitResponseSchema,
} from "@ai-planner/contracts";
import {
  createHabit as createHabitRequest,
  getHabits,
} from "@ai-planner/api-client";
import { apiClient } from "./client";

export async function fetchHabits() {
  const data = await getHabits(apiClient);
  return data.map((habit) => HabitResponseSchema.parse(habit));
}

export async function createHabit(category: string, preferredTime: string) {
  const payload = HabitCreateSchema.parse({
    category,
    preferred_time: preferredTime,
  });

  const habit = await createHabitRequest(apiClient, payload);
  return HabitResponseSchema.parse(habit);
}
