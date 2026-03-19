import { integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: varchar({ length: 255 }).notNull(),
  category: varchar({ length: 100 }).notNull(),
  scheduledAt: timestamp("scheduled_at", { withTimezone: false }),
  durationMinutes: integer("duration_minutes").notNull(),
});