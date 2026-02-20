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
    // Llamada al detector NSFWCheckers
    const response = await fetch("https://nsfwcheckers.com/api/v1/nsfw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: imageUrl }), // aquí el fix
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    // Retornamos el resultado
    return res.status(200).json({
      url: imageUrl,
      nsfwNUMS: data.output || {},
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}