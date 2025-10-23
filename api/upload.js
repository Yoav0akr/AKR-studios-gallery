import { formidable } from "formidable";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const form = formidable();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error procesando archivo:", err);
        return res.status(500).json({ error: "Error procesando archivo" });
      }

      let file;
      if (Array.isArray(files.file)) {
        file = files.file[0];
      } else {
        file = files.file;
      }

      if (!file || !file.filepath) {
        console.error("⚠️ No se recibió un archivo válido:", files);
        return res.status(400).json({ error: "No se recibió un archivo válido" });
      }

      try {
        const uploadResult = await cloudinary.v2.uploader.upload(file.filepath, {
          folder: "AKR_Gallery",
        });

        console.log("✅ Imagen subida a Cloudinary:", uploadResult.secure_url);
        return res.status(200).json({ url: uploadResult.secure_url });
      } catch (uploadErr) {
        console.error("❌ Error al subir a Cloudinary:", uploadErr);
        return res.status(500).json({ error: uploadErr.message || "Error en Cloudinary" });
      }
    });
  } catch (error) {
    console.error("❌ Error general en /api/upload:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
