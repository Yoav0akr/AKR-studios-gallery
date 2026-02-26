// api/categs.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ error: "Falta imageUrl" });
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageUrl }),
      }
    );

    const result = await response.json();

    const labels = result.map(r =>
      r.label.replace(/\s+/g, "_").toLowerCase()
    );

    res.status(200).json({ categorias: labels });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error clasificando imagen" });
  }
}