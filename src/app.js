
import express from "express";
import multer from "multer";
import apiRouter, { upload } from "./routes/api.js";

const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public", { maxAge: 0 }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", upload.single("image"), apiRouter);

export default app;
