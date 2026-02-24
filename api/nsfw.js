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
    /*
      Respuesta típica:
      [
        { label: "nsfw", score: 0.93 },
        { label: "sfw", score: 0.07 }
      ]
    */

    // Pasar en limpio → convertir a objeto con porcentajes
    const limpio = {};
    result.forEach(r => {
      limpio[r.label] = `${(r.score * 100).toFixed(1)}%`;
    });

    return res.status(200).json({ scores: limpio });
  } catch (error) {
    console.error("Error HuggingFace:", error);
    return res.status(500).json({ error: "Error verificando imagen" });
  }
}