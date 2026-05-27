import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import vehiclesRouter from "./vehicles";
import checkinsRouter from "./checkins";
import partsRouter from "./parts";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";
import claimsRouter from "./claims";
import trackRouter from "./track";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/clients", clientsRouter);
router.use("/vehicles", vehiclesRouter);
router.use("/checkins", checkinsRouter);
router.use("/parts", partsRouter);
router.use("/payments", paymentsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/claims", claimsRouter);
router.use("/track", trackRouter);

export default router;
