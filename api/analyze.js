export default async function handler(req, res) {
  const { URL } = req.body;
  if (!URL) return res.status(400).json({ error: "Debes enviar la propiedad URL" });

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: URL }),
      }
    );

    const data = await response.json();

    const caption = Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text
      : "Descripción no disponible";

    return res.status(200).json({ output: { text: caption } });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}