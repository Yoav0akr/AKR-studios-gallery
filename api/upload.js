import { formidable } from "formidable";
import cloudinary from "cloudinary";
import sharp from "sharp";
import streamifier from "streamifier";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Next necesita esto para permitir archivos sin bodyParser
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      // 📌 FORMIDABLE con límite de 10MB
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10 MB
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({ error: "El archivo excede los 10MB permitidos." });
          }

          console.error("Error procesando archivo:", err);
          return res.status(500).json({ error: "Error procesando archivo" });
        }

        let file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
          return res.status(400).json({ error: "No se recibió un archivo." });
        }

        const mime = file.mimetype;

        try {
          let uploadResult;

          // ==========================
          // 📌 SI ES IMAGEN → SHARP
          // ==========================
          if (mime.startsWith("image/")) {
            const bufferOriginal = await sharp(file.filepath).toBuffer();

            const bufferOptimizado = await sharp(bufferOriginal)
              .resize({ width: 1920 })
              .webp({ quality: 80 })
              .toBuffer();

            uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.v2.uploader.upload_stream(
                { folder: "AKR_Gallery", resource_type: "image" },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              streamifier.createReadStream(bufferOptimizado).pipe(uploadStream);
            });
          }

          // ==========================
          // 📌 SI ES VIDEO
          // ==========================
          else if (mime.startsWith("video/")) {
            uploadResult = await cloudinary.v2.uploader.upload(file.filepath, {
              folder: "AKR_Gallery",
              resource_type: "video",
            });
          }

          // TIPO NO SOPORTADO
          else {
            return res.status(400).json({
              error: "Formato no permitido. Solo imágenes y videos."
            });
          }

          return res.status(200).json({
            success: true,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
            size_bytes: uploadResult.bytes,
            type: mime.startsWith("video/") ? "video" : "image"
          });

        } catch (uploadErr) {
          console.error("Error subiendo archivo:", uploadErr);
          return res.status(500).json({
            error: "Error al subir el archivo a Cloudinary"
          });
        }
      });

    } catch (error) {
      console.error("❌ Error general en /api/upload:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    return;
  }

  // =======================
  // ❌ MÉTODOS NO PERMITIDOS
  // =======================
  res.setHeader("Allow", ["POST"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
