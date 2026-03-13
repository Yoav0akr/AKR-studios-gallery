import { formidable } from "formidable";
import cloudinary from "cloudinary";
import sharp from "sharp";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Necesario para subir archivos con formidable
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const form = formidable({
        maxFileSize: 25 * 1024 * 1024, // 25 MB
        multiples: false,
      });

      form.parse(req, async (err, fields, files) => {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "El archivo excede el tamaño máximo de 25MB" });
          }
          console.error("Error procesando archivo:", err);
          return res.status(500).json({ error: "Error procesando archivo" });
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file || !file.filepath) {
          return res.status(400).json({ error: "No se recibió un archivo válido" });
        }

        // ✅ Limitar solo a imágenes
        if (!file.mimetype.startsWith("image/")) {
          return res.status(400).json({ error: "Solo se permiten archivos de imagen" });
        }

        try {
          // Comprimir la imagen con Sharp
          const buffer = await sharp(file.filepath)
            .resize({ width: 1024 }) // ancho máximo 1024px
            .jpeg({ quality: 80 })
            .toBuffer();

          // Subir a Cloudinary directamente desde buffer
          const uploadFromBuffer = (buffer) =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.v2.uploader.upload_stream(
                { folder: "AKR_Gallery" },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              stream.end(buffer);
            });

          const uploadResult = await uploadFromBuffer(buffer);

          return res.status(200).json({
            success: true,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
        } catch (uploadErr) {
          console.error("Error subiendo a Cloudinary:", uploadErr);
          return res.status(500).json({ error: "Error subiendo a Cloudinary" });
        }
      });
    } catch (error) {
      console.error("Error general en /api/upload:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    return;
  }

  if (req.method === "DELETE") {
    try {
      const { public_id } = req.query;

      if (!public_id) {
        return res.status(400).json({ error: "Falta el parámetro 'public_id'" });
      }

      const result = await cloudinary.v2.uploader.destroy(public_id);

      if (result.result === "not found") {
        return res.status(404).json({ error: "Archivo no encontrado en Cloudinary" });
      }

      return res.status(200).json({ success: true, message: "Imagen eliminada correctamente" });
    } catch (error) {
      console.error("Error al eliminar en Cloudinary:", error);
      return res.status(500).json({ error: "Error al eliminar en Cloudinary" });
    }
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
