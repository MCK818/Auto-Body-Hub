import { Router } from "express";
import { db } from "@workspace/db";
import { partsTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import {
  ListPartsQueryParams,
  CreatePartBody,
  GetPartParams,
  UpdatePartParams,
  UpdatePartBody,
  DeletePartParams,
} from "@workspace/api-zod";

const router = Router();

function serializePart(p: typeof partsTable.$inferSelect) {
  return { ...p, price: Number(p.price), createdAt: p.createdAt.toISOString() };
}

router.get("/", async (req, res) => {
  const query = ListPartsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const { search, category } = params as { search?: string; category?: string };

  const conditions = [];
  if (category) conditions.push(eq(partsTable.category, category));
  if (search) {
    conditions.push(
      or(
        ilike(partsTable.name, `%${search}%`),
        ilike(partsTable.partNumber, `%${search}%`),
        ilike(partsTable.description, `%${search}%`)
      )
    );
  }

  const parts = await db
    .select()
    .from(partsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(partsTable.name);

  res.json(parts.map(serializePart));
});

router.post("/", async (req, res) => {
  const parsed = CreatePartBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const [part] = await db
    .insert(partsTable)
    .values({ ...parsed.data, price: parsed.data.price.toString() })
    .returning();
  res.status(201).json(serializePart(part));
});

router.get("/:id", async (req, res) => {
  const parsed = GetPartParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [part] = await db.select().from(partsTable).where(eq(partsTable.id, parsed.data.id));
  if (!part) return res.status(404).json({ error: "Not found" });
  res.json(serializePart(part));
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdatePartParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdatePartBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });

  const updateData: Record<string, unknown> = { ...bodyParsed.data };
  if (bodyParsed.data.price !== undefined) {
    updateData.price = bodyParsed.data.price.toString();
  }

  const [part] = await db
    .update(partsTable)
    .set(updateData)
    .where(eq(partsTable.id, paramsParsed.data.id))
    .returning();
  if (!part) return res.status(404).json({ error: "Not found" });
  res.json(serializePart(part));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeletePartParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(partsTable).where(eq(partsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
