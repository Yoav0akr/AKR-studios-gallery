export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { imageURL } = req.body;

    if (!imageURL) {
      return res.status(400).json({ error: "imageURL es requerido" });
    }

    console.log("🔍 Analizando imagen:", imageURL);

    const imageResponse = await fetch(imageURL);

    if (!imageResponse.ok) {
      return res.status(400).json({ error: "No se pudo descargar la imagen" });
    }

    // ✅ CORRECCIÓN AQUÍ
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const sharp = require("sharp");
    const metadata = await sharp(imageBuffer).metadata();

    console.log("📊 Metadata de imagen:", metadata);

    const nsfwScore = analizarImagenGratis(metadata, imageBuffer);

    console.log("✅ Análisis completado:", nsfwScore);

    return res.status(200).json(nsfwScore);

  } catch (error) {
    console.error("❌ Error en /api/nsfw:", error);
    return res.status(500).json({
      error: "Error analizando imagen",
      message: error.message
    });
  }
}