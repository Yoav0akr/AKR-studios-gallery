// api/analyze.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: "Debes enviar la propiedad imageUrl" });
  }

  try {
    const apiKey = process.env.DEEPAI_KEY;
    const response = await fetch("https://api.deepai.org/api/image-captioning", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: imageUrl }),
    });

    const text = await response.text(); // leer como texto
    let data;
    try {
      data = JSON.parse(text); // intentar parsear JSON
    } catch {
      // si no es JSON, devolver texto como error
      return res.status(response.status).json({ error: text });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}