import { formidable } from "formidable";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Necesario para subir archivos con formidable
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // === SUBIR ARCHIVO ===
  if (req.method === "POST") {
    try {
      const form = formidable();

      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error("Error procesando archivo:", err);
          return res.status(500).json({ error: "Error procesando archivo" });
        }

        let file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file || !file.filepath) {
          console.error("⚠️ No se recibió un archivo válido:", files);
          return res.status(400).json({ error: "No se recibió un archivo válido" });
        }

        try {
          const uploadResult = await cloudinary.v2.uploader.upload(file.filepath, {
            folder: "AKR_Gallery",
          });

          console.log("✅ Imagen subida a Cloudinary:", uploadResult.secure_url);

          // Devuelve también el public_id para poder borrarlo después
          return res.status(200).json({
            success: true,
            url: uploadResult.secure_url,
            public_id: uploadResult.public_id,
          });
        } catch (uploadErr) {
          console.error("❌ Error al subir a Cloudinary:", uploadErr);
          return res.status(500).json({
            error: uploadErr.message || "Error subiendo a Cloudinary",
          });
        }
      });
    } catch (error) {
      console.error("❌ Error general en /api/upload:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }

    return; // detener aquí
  }

  // === BORRAR ARCHIVO ===
  if (req.method === "DELETE") {
    try {
      const { public_id } = req.query;

      if (!public_id) {
        return res.status(400).json({ error: "Falta el parámetro 'public_id'" });
      }

      // Destruir archivo en Cloudinary
      const result = await cloudinary.v2.uploader.destroy(public_id);

      if (result.result === "not found") {
        return res.status(404).json({ error: "Archivo no encontrado en Cloudinary" });
      }

      console.log(`🗑️ Imagen eliminada de Cloudinary: ${public_id}`);
      return res.status(200).json({ success: true, message: "Imagen eliminada correctamente" });
    } catch (error) {
      console.error("❌ Error al eliminar en Cloudinary:", error);
      return res.status(500).json({ error: "Error al eliminar en Cloudinary" });
    }
  }

  // === MÉTODOS NO PERMITIDOS ===
  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}
