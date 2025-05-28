import { Router } from "express";
import appointmentRoutes from "./appointment.routes";
import candidateRoutes from "./candidate.routes";
import conversationRoutes from "./conversation.routes";
import jobRoutes from "./job.routes";

const router = Router();

router.use("/jobs", jobRoutes);
router.use("/candidates", candidateRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/conversations", conversationRoutes);

export default router;
