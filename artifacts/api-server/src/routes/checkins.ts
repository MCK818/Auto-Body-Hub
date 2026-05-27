import { Router } from "express";
import { db } from "@workspace/db";
import { checkinsTable, repairUpdatesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListCheckinsQueryParams,
  CreateCheckinBody,
  GetCheckinParams,
  UpdateCheckinParams,
  UpdateCheckinBody,
  ListRepairUpdatesParams,
  AddRepairUpdateParams,
  AddRepairUpdateBody,
} from "@workspace/api-zod";

const router = Router();

function serializeCheckin(c: typeof checkinsTable.$inferSelect) {
  return {
    ...c,
    estimatedCost: c.estimatedCost !== null ? Number(c.estimatedCost) : null,
    droppedOffAt: c.droppedOffAt.toISOString(),
    estimatedCompletionDate: c.estimatedCompletionDate?.toISOString() ?? null,
    completedAt: c.completedAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

function serializeUpdate(u: typeof repairUpdatesTable.$inferSelect) {
  return { ...u, createdAt: u.createdAt.toISOString() };
}

router.get("/", async (req, res) => {
  const query = ListCheckinsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const { status, clientId } = params as { status?: string; clientId?: number };

  const { vehicleId } = params as { vehicleId?: number };
  const conditions = [];
  if (status) conditions.push(eq(checkinsTable.status, status));
  if (clientId) conditions.push(eq(checkinsTable.clientId, clientId));
  if (vehicleId) conditions.push(eq(checkinsTable.vehicleId, vehicleId));

  const checkins = await db
    .select()
    .from(checkinsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(checkinsTable.createdAt);

  res.json(checkins.map(serializeCheckin));
});

router.post("/", async (req, res) => {
  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const data = {
    ...parsed.data,
    droppedOffAt: new Date(parsed.data.droppedOffAt),
    estimatedCompletionDate: parsed.data.estimatedCompletionDate
      ? new Date(parsed.data.estimatedCompletionDate)
      : undefined,
    estimatedCost: parsed.data.estimatedCost?.toString(),
  };
  const [checkin] = await db.insert(checkinsTable).values(data).returning();
  res.status(201).json(serializeCheckin(checkin));
});

router.get("/:id", async (req, res) => {
  const parsed = GetCheckinParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [checkin] = await db.select().from(checkinsTable).where(eq(checkinsTable.id, parsed.data.id));
  if (!checkin) return res.status(404).json({ error: "Not found" });
  res.json(serializeCheckin(checkin));
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateCheckinParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateCheckinBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const updateData: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.estimatedCost !== undefined) {
    updateData.estimatedCost = bodyParsed.data.estimatedCost?.toString();
  }
  if (bodyParsed.data.estimatedCompletionDate !== undefined) {
    updateData.estimatedCompletionDate = bodyParsed.data.estimatedCompletionDate
      ? new Date(bodyParsed.data.estimatedCompletionDate)
      : null;
  }
  if (bodyParsed.data.completedAt !== undefined) {
    updateData.completedAt = bodyParsed.data.completedAt ? new Date(bodyParsed.data.completedAt) : null;
  }

  const [checkin] = await db
    .update(checkinsTable)
    .set(updateData)
    .where(eq(checkinsTable.id, paramsParsed.data.id))
    .returning();
  if (!checkin) return res.status(404).json({ error: "Not found" });
  res.json(serializeCheckin(checkin));
});

router.get("/:id/updates", async (req, res) => {
  const parsed = ListRepairUpdatesParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const updates = await db
    .select()
    .from(repairUpdatesTable)
    .where(eq(repairUpdatesTable.checkinId, parsed.data.id))
    .orderBy(repairUpdatesTable.createdAt);
  res.json(updates.map(serializeUpdate));
});

router.post("/:id/updates", async (req, res) => {
  const paramsParsed = AddRepairUpdateParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = AddRepairUpdateBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const [update] = await db
    .insert(repairUpdatesTable)
    .values({ checkinId: paramsParsed.data.id, ...bodyParsed.data })
    .returning();

  if (bodyParsed.data.status) {
    await db
      .update(checkinsTable)
      .set({ status: bodyParsed.data.status })
      .where(eq(checkinsTable.id, paramsParsed.data.id));
  }

  res.status(201).json(serializeUpdate(update));
});

export default router;
