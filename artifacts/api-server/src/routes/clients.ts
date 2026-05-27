import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListClientsQueryParams,
  CreateClientBody,
  GetClientParams,
  UpdateClientParams,
  UpdateClientBody,
  DeleteClientParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListClientsQueryParams.safeParse(req.query);
  const search = query.success ? query.data.search : undefined;

  const clients = await db
    .select()
    .from(clientsTable)
    .where(
      search
        ? or(
            ilike(clientsTable.name, `%${search}%`),
            ilike(clientsTable.email, `%${search}%`),
            ilike(clientsTable.phone, `%${search}%`)
          )
        : undefined
    )
    .orderBy(clientsTable.createdAt);

  const result = clients.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));
  res.json(result);
});

router.post("/", async (req, res) => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }
  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json({ ...client, createdAt: client.createdAt.toISOString() });
});

router.get("/:id", async (req, res) => {
  const parsed = GetClientParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, parsed.data.id));
  if (!client) return res.status(404).json({ error: "Not found" });
  res.json({ ...client, createdAt: client.createdAt.toISOString() });
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateClientParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateClientBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });
  const [client] = await db
    .update(clientsTable)
    .set(bodyParsed.data)
    .where(eq(clientsTable.id, paramsParsed.data.id))
    .returning();
  if (!client) return res.status(404).json({ error: "Not found" });
  res.json({ ...client, createdAt: client.createdAt.toISOString() });
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteClientParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(clientsTable).where(eq(clientsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
