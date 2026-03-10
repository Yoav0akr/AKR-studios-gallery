export default async function handler(req, res) {

  const { imageURL } = req.body;

  if (!imageURL) {
    return res.status(400).json({ error: "Falta imageURL" });
  }

  try {

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageURL }),
      }
    );

    const data = await response.json();

    const caption =
      Array.isArray(data) && data[0]?.generated_text
        ? data[0].generated_text
        : "descripcion no disponible";

    // generar categorías simples
    const categorias = caption
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(" ")
      .filter(w => w.length > 3)
      .slice(0, 5);

    res.status(200).json({
      descripcion: caption,
      categorias
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error analizando imagen"
    });

  }

}