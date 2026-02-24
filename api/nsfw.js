export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imageURL } = req.body;
  if (!imageURL) {
    return res.status(400).json({ error: "Falta imageURL" });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageURL }),
      }
    );

    const result = await response.json();

    if (!Array.isArray(result)) {
      console.warn("HF respondió algo inesperado:", result);
      return res.status(200).json({
        nsfw: 0.5,
        sfw: 0.5,
        warning: "Modelo no disponible"
      });
    }

    const scores = {};
    result.forEach(r => {
      scores[r.label] = r.score;
    });

    return res.status(200).json(scores);

  } catch (error) {
    console.error("Error HF:", error);
    return res.status(200).json({
      nsfw: 0.5,
      sfw: 0.5,
      warning: "Error en análisis"
    });
  }
}