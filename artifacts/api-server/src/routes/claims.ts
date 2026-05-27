import { Router } from "express";
import { db } from "@workspace/db";
import { clientsTable, vehiclesTable, checkinsTable, vehiclePhotosTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { client, vehicle, description, photos } = req.body;

    if (!client?.name || !client?.phone || !vehicle?.make || !vehicle?.model || !vehicle?.year) {
      return res.status(400).json({ error: "Missing required fields: client name, phone, vehicle make/model/year" });
    }

    const phoneCleaned = String(client.phone).replace(/\D/g, "");

    let [existingClient] = await db
      .select()
      .from(clientsTable)
      .where(eq(clientsTable.phone, client.phone));

    if (!existingClient) {
      [existingClient] = await db
        .insert(clientsTable)
        .values({
          name: String(client.name),
          email: client.email ? String(client.email) : null,
          phone: String(client.phone),
          address: client.address ? String(client.address) : null,
        })
        .returning();
    }

    const [newVehicle] = await db
      .insert(vehiclesTable)
      .values({
        clientId: existingClient.id,
        make: String(vehicle.make),
        model: String(vehicle.model),
        year: parseInt(String(vehicle.year), 10),
        licensePlate: vehicle.licensePlate ? String(vehicle.licensePlate) : null,
        vin: vehicle.vin ? String(vehicle.vin) : null,
        color: vehicle.color ? String(vehicle.color) : null,
        mileage: vehicle.mileage ? parseInt(String(vehicle.mileage), 10) : null,
      })
      .returning();

    const [checkin] = await db
      .insert(checkinsTable)
      .values({
        clientId: existingClient.id,
        vehicleId: newVehicle.id,
        status: "pending",
        description: description ? String(description) : "Damage claim submitted online",
        droppedOffAt: new Date(),
      })
      .returning();

    if (Array.isArray(photos)) {
      for (const photo of photos.slice(0, 10)) {
        if (photo?.url && typeof photo.url === "string") {
          await db.insert(vehiclePhotosTable).values({
            vehicleId: newVehicle.id,
            url: photo.url,
            caption: photo.caption ? String(photo.caption) : "Damage photo",
          });
        }
      }
    }

    res.status(201).json({
      checkinId: checkin.id,
      clientId: existingClient.id,
      vehicleId: newVehicle.id,
      status: checkin.status,
    });
  } catch (err) {
    console.error("claims error:", err);
    res.status(500).json({ error: "Failed to submit claim" });
  }
});

export default router;
