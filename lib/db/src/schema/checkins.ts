import { pgTable, serial, text, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clientsTable } from "./clients";
import { vehiclesTable } from "./vehicles";

export const checkinsTable = pgTable("checkins", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clientsTable.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").notNull().references(() => vehiclesTable.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  description: text("description").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  droppedOffAt: timestamp("dropped_off_at").notNull(),
  estimatedCompletionDate: timestamp("estimated_completion_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCheckinSchema = createInsertSchema(checkinsTable).omit({ id: true, createdAt: true });
export type InsertCheckin = z.infer<typeof insertCheckinSchema>;
export type Checkin = typeof checkinsTable.$inferSelect;

export const repairUpdatesTable = pgTable("repair_updates", {
  id: serial("id").primaryKey(),
  checkinId: integer("checkin_id").notNull().references(() => checkinsTable.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRepairUpdateSchema = createInsertSchema(repairUpdatesTable).omit({ id: true, createdAt: true });
export type InsertRepairUpdate = z.infer<typeof insertRepairUpdateSchema>;
export type RepairUpdate = typeof repairUpdatesTable.$inferSelect;
