import { Router } from "express";
import { db } from "@workspace/db";
import {
  clientsTable,
  vehiclesTable,
  checkinsTable,
  paymentsTable,
  partsTable,
  repairUpdatesTable,
} from "@workspace/db";
import { eq, count, sum, gte, and, ne } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalClientsResult] = await db.select({ count: count() }).from(clientsTable);
  const [totalVehiclesResult] = await db.select({ count: count() }).from(vehiclesTable);

  const [activeCheckinsResult] = await db
    .select({ count: count() })
    .from(checkinsTable)
    .where(
      sql`${checkinsTable.status} NOT IN ('completed', 'cancelled')`
    );

  const [completedThisMonthResult] = await db
    .select({ count: count() })
    .from(checkinsTable)
    .where(
      and(
        eq(checkinsTable.status, "completed"),
        gte(checkinsTable.completedAt, startOfMonth)
      )
    );

  const [revenueResult] = await db
    .select({ total: sum(paymentsTable.amount) })
    .from(paymentsTable)
    .where(eq(paymentsTable.status, "paid"));

  const [pendingPaymentsResult] = await db
    .select({ total: sum(paymentsTable.amount) })
    .from(paymentsTable)
    .where(
      sql`${paymentsTable.status} IN ('pending', 'partial')`
    );

  const [partsInStockResult] = await db
    .select({ total: sum(partsTable.quantity) })
    .from(partsTable);

  res.json({
    totalClients: totalClientsResult?.count ?? 0,
    totalVehicles: totalVehiclesResult?.count ?? 0,
    activeCheckins: activeCheckinsResult?.count ?? 0,
    completedThisMonth: completedThisMonthResult?.count ?? 0,
    revenue: Number(revenueResult?.total ?? 0),
    pendingPayments: Number(pendingPaymentsResult?.total ?? 0),
    partsInStock: Number(partsInStockResult?.total ?? 0),
  });
});

router.get("/recent-activity", async (req, res) => {
  const recentCheckins = await db
    .select({
      id: checkinsTable.id,
      status: checkinsTable.status,
      description: checkinsTable.description,
      createdAt: checkinsTable.createdAt,
    })
    .from(checkinsTable)
    .orderBy(sql`${checkinsTable.createdAt} DESC`)
    .limit(5);

  const recentUpdates = await db
    .select({
      id: repairUpdatesTable.id,
      message: repairUpdatesTable.message,
      status: repairUpdatesTable.status,
      createdAt: repairUpdatesTable.createdAt,
    })
    .from(repairUpdatesTable)
    .orderBy(sql`${repairUpdatesTable.createdAt} DESC`)
    .limit(5);

  const recentPayments = await db
    .select({
      id: paymentsTable.id,
      amount: paymentsTable.amount,
      status: paymentsTable.status,
      createdAt: paymentsTable.createdAt,
    })
    .from(paymentsTable)
    .orderBy(sql`${paymentsTable.createdAt} DESC`)
    .limit(5);

  const activities = [
    ...recentCheckins.map((c) => ({
      id: c.id,
      type: c.status === "completed" ? ("completion" as const) : ("checkin" as const),
      title: c.status === "completed" ? "Repair completed" : "New check-in",
      description: c.description,
      timestamp: c.createdAt.toISOString(),
    })),
    ...recentUpdates.map((u) => ({
      id: u.id,
      type: "update" as const,
      title: "Repair update",
      description: u.message,
      timestamp: u.createdAt.toISOString(),
    })),
    ...recentPayments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      title: `Payment ${p.status}`,
      description: `$${Number(p.amount).toFixed(2)} — ${p.status}`,
      timestamp: p.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  res.json(activities);
});

export default router;
