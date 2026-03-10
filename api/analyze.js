export default async function handler(req, res) {

  try {

    const { imageURL } = req.body;

    if (!imageURL) {
      return res.status(400).json({ error: "Falta imageURL" });
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageURL }),
      }
    );

    const result = await response.json();

    console.log("HF analyze:", result);

    if (!Array.isArray(result)) {
      return res.status(200).json({
        descripcion: "",
        categorias: []
      });
    }

    const caption = result[0]?.generated_text || "";

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

    res.status(200).json({
      descripcion: "",
      categorias: []
    });

  }

}