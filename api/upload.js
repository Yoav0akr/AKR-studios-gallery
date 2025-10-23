// === /api/upload.js ===
// Endpoint serverless para subir imágenes a Cloudinary de forma segura

import formidable from "formidable";
import cloudinary from "cloudinary";

// Configura Cloudinary con tus variables de entorno (en Vercel)
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Necesario para manejar archivos en Vercel
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Parsear el archivo enviado desde el frontend
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error al procesar el archivo:", err);
        return res.status(500).json({ error: "Error procesando el archivo" });
      }

      const file = files.file;
      if (!file) {
        return res.status(400).json({ error: "No se recibió ningún archivo" });
      }

      // Subir a Cloudinary
      const uploadResult = await cloudinary.v2.uploader.upload(file.filepath, {
        folder: "AKR_Gallery",
      });

      console.log("✅ Imagen subida a Cloudinary:", uploadResult.secure_url);

      // Devolver la URL al frontend
      return res.status(200).json({ url: uploadResult.secure_url });
    });
  } catch (error) {
    console.error("Error general en /api/upload:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
