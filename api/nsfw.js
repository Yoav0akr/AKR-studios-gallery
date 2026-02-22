// api/nsfw.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: "Debes enviar la propiedad imageUrl" });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/michellejieli/nsfw_model",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageUrl }),
      }
    );


    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    // Transformamos la respuesta en un objeto {label: score}
    const scores = {};
    if (Array.isArray(data)) {
      data.forEach(item => {
        scores[item.label] = item.score;
      });
    }

    return res.status(200).json({
      url: imageUrl,
      nsfwNUMS: scores,
    });
  } catch (error) {
    console.error("Error en nsfw:", error);
    return res.status(500).json({ error: error.message });
  }
}