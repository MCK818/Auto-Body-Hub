import { Router } from "express";
import { db } from "@workspace/db";
import { paymentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListPaymentsQueryParams,
  CreatePaymentBody,
  GetPaymentParams,
  UpdatePaymentParams,
  UpdatePaymentBody,
} from "@workspace/api-zod";

const router = Router();

function serializePayment(p: typeof paymentsTable.$inferSelect) {
  return {
    ...p,
    amount: Number(p.amount),
    paidAt: p.paidAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const query = ListPaymentsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const { clientId, checkinId, status } = params as {
    clientId?: number;
    checkinId?: number;
    status?: string;
  };

  const conditions = [];
  if (clientId) conditions.push(eq(paymentsTable.clientId, clientId));
  if (checkinId) conditions.push(eq(paymentsTable.checkinId, checkinId));
  if (status) conditions.push(eq(paymentsTable.status, status));

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(paymentsTable.createdAt);

  res.json(payments.map(serializePayment));
});

router.post("/", async (req, res) => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const [payment] = await db
    .insert(paymentsTable)
    .values({
      ...parsed.data,
      amount: parsed.data.amount.toString(),
      paidAt: parsed.data.paidAt ? new Date(parsed.data.paidAt) : undefined,
    })
    .returning();
  res.status(201).json(serializePayment(payment));
});

router.get("/:id", async (req, res) => {
  const parsed = GetPaymentParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, parsed.data.id));
  if (!payment) return res.status(404).json({ error: "Not found" });
  res.json(serializePayment(payment));
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdatePaymentParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdatePaymentBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const updateData: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.amount !== undefined) {
    updateData.amount = bodyParsed.data.amount.toString();
  }
  if (bodyParsed.data.paidAt !== undefined) {
    updateData.paidAt = bodyParsed.data.paidAt ? new Date(bodyParsed.data.paidAt) : null;
  }

  const [payment] = await db
    .update(paymentsTable)
    .set(updateData)
    .where(eq(paymentsTable.id, paramsParsed.data.id))
    .returning();
  if (!payment) return res.status(404).json({ error: "Not found" });
  res.json(serializePayment(payment));
});

export default router;
