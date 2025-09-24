import fs from "fs/promises";
import { processImageSmart } from "../lib/imageProcessor.js";

export async function resizeController(req, res) {
  try {
    const params = {
      width: req.body.width ?? req.query.width,
      height: req.body.height ?? req.query.height,
      format: (req.body.format ?? req.query.format ?? "webp").toLowerCase(),
      quality: Number(req.body.quality ?? req.query.quality ?? 82),
      lossless: parseBool(req.body.lossless ?? req.query.lossless ?? false),
      fit: (req.body.fit ?? req.query.fit ?? "inside").toLowerCase(),
      enlarge: parseBool(req.body.enlarge ?? req.query.enlarge ?? false),
      preserveMeta: parseBool(req.body.preserveMeta ?? req.query.preserveMeta ?? false),
      noBiggerThanOriginal: parseBool(req.body.noBiggerThanOriginal ?? req.query.noBiggerThanOriginal ?? true)
    };

    let inputBuffer;
    if (req.file?.buffer) {
      inputBuffer = req.file.buffer;
    } else if (req.body.src) {
      const src = req.body.src;
      if (typeof src === "string" && src.startsWith("data:")) {
        const b64 = src.split(",")[1];
        inputBuffer = Buffer.from(b64, "base64");
      } else {
        inputBuffer = await fs.readFile(src);
      }
    } else {
      return res.status(400).json({ error: "No image provided" });
    }

    const { buffer, contentType } = await processImageSmart(inputBuffer, params);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e?.message || "processing error" });
  }
}

function parseBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return ["1", "true", "yes", "on"].includes(v.toLowerCase());
  return false;
}
