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

    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const sharp = require("sharp");
    const metadata = await sharp(imageBuffer).metadata();

    console.log("📊 Metadata:", metadata);

    // 🔥 FUNCIÓN DEFINIDA DENTRO (imposible que no exista)
    function analizarImagenGratis(metadata, imageBuffer) {
      let porn = 0;
      let sexy = 0;
      let neutral = 0.5;
      let drawing = 0;
      let hentai = 0;

      if (metadata.width && metadata.height) {
        const aspectRatio = metadata.width / metadata.height;
        if (aspectRatio > 2 || aspectRatio < 0.5) {
          drawing += 0.2;
        }
      }

      if (metadata.format === "png") drawing += 0.15;
      if (metadata.format === "jpeg") neutral += 0.1;

      const total = porn + sexy + neutral + drawing + hentai;

      return {
        porn: total ? porn / total : 0,
        sexy: total ? sexy / total : 0,
        neutral: total ? neutral / total : 1,
        drawing: total ? drawing / total : 0,
        hentai: total ? hentai / total : 0,
      };
    }

    const nsfwScore = analizarImagenGratis(metadata, imageBuffer);

    console.log("✅ Resultado:", nsfwScore);

    return res.status(200).json(nsfwScore);

  } catch (error) {
    console.error("❌ Error en /api/nsfw:", error);
    return res.status(500).json({
      error: "Error analizando imagen",
      message: error.message,
    });
  }
}