import { Router } from "express";
import { db } from "@workspace/db";
import { vehiclesTable, vehiclePhotosTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import {
  ListVehiclesQueryParams,
  CreateVehicleBody,
  GetVehicleParams,
  UpdateVehicleParams,
  UpdateVehicleBody,
  DeleteVehicleParams,
  ListVehiclePhotosParams,
  AddVehiclePhotoParams,
  AddVehiclePhotoBody,
} from "@workspace/api-zod";

const router = Router();

function serializeVehicle(v: typeof vehiclesTable.$inferSelect) {
  return { ...v, createdAt: v.createdAt.toISOString() };
}

function serializePhoto(p: typeof vehiclePhotosTable.$inferSelect) {
  return { ...p, createdAt: p.createdAt.toISOString() };
}

router.get("/", async (req, res) => {
  const query = ListVehiclesQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const { clientId, search } = params as { clientId?: number; search?: string };

  const conditions = [];
  if (clientId) conditions.push(eq(vehiclesTable.clientId, clientId));
  if (search) {
    conditions.push(
      or(
        ilike(vehiclesTable.make, `%${search}%`),
        ilike(vehiclesTable.model, `%${search}%`),
        ilike(vehiclesTable.licensePlate, `%${search}%`),
        ilike(vehiclesTable.vin, `%${search}%`)
      )
    );
  }

  const vehicles = await db
    .select()
    .from(vehiclesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(vehiclesTable.createdAt);

  res.json(vehicles.map(serializeVehicle));
});

router.post("/", async (req, res) => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
  const [vehicle] = await db.insert(vehiclesTable).values(parsed.data).returning();
  res.status(201).json(serializeVehicle(vehicle));
});

router.get("/:id", async (req, res) => {
  const parsed = GetVehicleParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const [vehicle] = await db.select().from(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.id));
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  res.json(serializeVehicle(vehicle));
});

router.patch("/:id", async (req, res) => {
  const paramsParsed = UpdateVehicleParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = UpdateVehicleBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });
  const [vehicle] = await db
    .update(vehiclesTable)
    .set(bodyParsed.data)
    .where(eq(vehiclesTable.id, paramsParsed.data.id))
    .returning();
  if (!vehicle) return res.status(404).json({ error: "Not found" });
  res.json(serializeVehicle(vehicle));
});

router.delete("/:id", async (req, res) => {
  const parsed = DeleteVehicleParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  await db.delete(vehiclesTable).where(eq(vehiclesTable.id, parsed.data.id));
  res.status(204).send();
});

router.get("/:id/photos", async (req, res) => {
  const parsed = ListVehiclePhotosParams.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ error: "Invalid id" });
  const photos = await db
    .select()
    .from(vehiclePhotosTable)
    .where(eq(vehiclePhotosTable.vehicleId, parsed.data.id))
    .orderBy(vehiclePhotosTable.createdAt);
  res.json(photos.map(serializePhoto));
});

router.post("/:id/photos", async (req, res) => {
  const paramsParsed = AddVehiclePhotoParams.safeParse(req.params);
  if (!paramsParsed.success) return res.status(400).json({ error: "Invalid id" });
  const bodyParsed = AddVehiclePhotoBody.safeParse(req.body);
  if (!bodyParsed.success) return res.status(400).json({ error: "Invalid input" });
  const [photo] = await db
    .insert(vehiclePhotosTable)
    .values({ vehicleId: paramsParsed.data.id, ...bodyParsed.data })
    .returning();
  res.status(201).json(serializePhoto(photo));
});

export default router;
