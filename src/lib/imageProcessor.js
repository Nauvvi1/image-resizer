import sharp from "sharp";

export async function processImageSmart(inputBuffer, opts = {}) {
  const {
    width,
    height,
    format = "webp",
    quality = 82,
    lossless = false,
    fit = "inside",
    enlarge = false,
    preserveMeta = false,
    noBiggerThanOriginal = true,
    maxBytes
  } = opts;

  const targetBytes = typeof maxBytes === "number"
    ? maxBytes
    : (noBiggerThanOriginal ? inputBuffer.length : Infinity);

  async function encodeWithQuality(q) {
    let img = sharp(inputBuffer, { limitInputPixels: false })
      .rotate()
      .toColourspace("srgb");

    if (preserveMeta) {
      img = img.withMetadata();
    }
    img = img.resize({
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      fit,
      withoutEnlargement: !enlarge,
      kernel: sharp.kernel.lanczos3
    });

    let contentType = "image/webp";
    switch ((format || "webp").toLowerCase()) {
      case "jpeg":
        img = img.jpeg({
          quality: Number(q),
          mozjpeg: true,
          progressive: true
        });
        contentType = "image/jpeg";
        break;
      case "png":
        img = img.png({
          compressionLevel: 9,
          palette: true
        });
        contentType = "image/png";
        break;
      case "avif":
        img = img.avif({
          quality: Number(q),
          lossless: !!lossless,
          effort: 8
        });
        contentType = "image/avif";
        break;
      case "webp":
      default:
        img = img.webp({
          quality: Number(q),
          lossless: !!lossless,
          smartSubsample: true,
          effort: 6
        });
        contentType = "image/webp";
        break;
    }

    const buffer = await img.toBuffer();
    return { buffer, contentType };
  }

  if (lossless && (format === "webp" || format === "avif")) {
    return encodeWithQuality(quality);
  }

  let qLow = 30;
  let qHigh = Math.max(Number(quality) || 82, 30);
  let best = await encodeWithQuality(qHigh);
  if (best.buffer.length <= targetBytes || !Number.isFinite(targetBytes)) return best;

  let result = best;
  for (let i = 0; i < 6; i++) {
    const mid = Math.floor((qLow + qHigh) / 2);
    const trial = await encodeWithQuality(mid);
    if (trial.buffer.length <= targetBytes) {
      result = trial;
      qHigh = mid - 1;
    } else {
      qLow = mid + 1;
    }
  }
  return result;
}
