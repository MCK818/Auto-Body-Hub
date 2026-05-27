import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, vehiclesTable, checkinsTable, repairUpdatesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const q = (req.query.q as string)?.trim();
  if (!q) return res.status(400).json({ error: "Query required" });

  let checkins: (typeof checkinsTable.$inferSelect)[] = [];

  const numericId = parseInt(q, 10);
  if (!isNaN(numericId) && String(numericId) === q) {
    checkins = await db.select().from(checkinsTable).where(eq(checkinsTable.id, numericId));
  }

  if (checkins.length === 0) {
    const clients = await db
      .select()
      .from(clientsTable)
      .where(ilike(clientsTable.phone, `%${q.replace(/\D/g, "").slice(-7)}%`));

    if (clients.length > 0) {
      for (const client of clients) {
        const clientCheckins = await db
          .select()
          .from(checkinsTable)
          .where(eq(checkinsTable.clientId, client.id));
        checkins.push(...clientCheckins);
      }
    }
  }

  const results = await Promise.all(
    checkins.map(async (checkin) => {
      const updates = await db
        .select()
        .from(repairUpdatesTable)
        .where(eq(repairUpdatesTable.checkinId, checkin.id))
        .orderBy(repairUpdatesTable.createdAt);

      const [vehicle] = await db
        .select()
        .from(vehiclesTable)
        .where(eq(vehiclesTable.id, checkin.vehicleId));

      return {
        ...checkin,
        estimatedCost: checkin.estimatedCost !== null ? Number(checkin.estimatedCost) : null,
        droppedOffAt: checkin.droppedOffAt.toISOString(),
        estimatedCompletionDate: checkin.estimatedCompletionDate?.toISOString() ?? null,
        completedAt: checkin.completedAt?.toISOString() ?? null,
        createdAt: checkin.createdAt.toISOString(),
        vehicle: vehicle ? { ...vehicle, createdAt: vehicle.createdAt.toISOString() } : null,
        updates: updates.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
      };
    })
  );

  res.json(results);
});

export default router;
