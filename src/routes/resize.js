
import { Router } from "express";
import { resizeHandler } from "../controllers/resizeController.js";

const router = Router();
router.post("/", resizeHandler);

export default router;
