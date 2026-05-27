import { Router, type IRouter } from "express";
import healthRouter from "./health";
import clientsRouter from "./clients";
import vehiclesRouter from "./vehicles";
import checkinsRouter from "./checkins";
import partsRouter from "./parts";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/clients", clientsRouter);
router.use("/vehicles", vehiclesRouter);
router.use("/checkins", checkinsRouter);
router.use("/parts", partsRouter);
router.use("/payments", paymentsRouter);
router.use("/dashboard", dashboardRouter);

export default router;
