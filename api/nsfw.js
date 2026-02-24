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
      "https://api-inference.huggingface.co/models/Falconsai/nsfw_image_detection",
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

    // 🔥 Si HF responde error (modelo cargando, etc)
    if (!Array.isArray(result)) {
      console.error("Respuesta inesperada de HF:", result);
      return res.status(500).json({
        error: "Modelo no disponible",
        raw: result
      });
    }

    const scores = {};
    result.forEach(r => {
      scores[r.label] = r.score;
    });

    return res.status(200).json(scores);

  } catch (error) {
    console.error("Error HuggingFace:", error);
    return res.status(500).json({ error: "Error verificando imagen" });
  }
}