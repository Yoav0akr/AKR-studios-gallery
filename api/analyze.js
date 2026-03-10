export default async function handler(req, res) {

 const { imageURL } = req.body;

  if (!imageURL) {
    return res.status(400).json({ error: "Debes enviar la propiedad URL" });
  }

  try {

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/nlpconnect/vit-gpt2-image-captioning",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageURL }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("HF error:", text);

      return res.status(200).json({
        output: { text: "Descripción automática no disponible" }
      });
    }

    const data = await response.json();

    const caption =
      Array.isArray(data) && data[0]?.generated_text
        ? data[0].generated_text
        : "Descripción no disponible";

    return res.status(200).json({
      output: { text: caption }
    });

  } catch (error) {

    console.error("Analyze error:", error);

    return res.status(500).json({
      error: error.message
    });

  }

}