import { HabitResponseSchema } from "@ai-planner/contracts";
import { apiClient } from "./client";

export async function fetchHabits() {
  const response = await apiClient.get("/habits");
  return response.data.map((habit: unknown) => HabitResponseSchema.parse(habit));
}