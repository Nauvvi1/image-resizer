
import { Router } from "express";
import multer from "multer";
import { resizeController } from "../controllers/resizeController.js";

export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();
router.post("/resize", resizeController);

export default router;
