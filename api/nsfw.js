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
    const response = await fetch("https://nsfw.api4.ai/v1/results", {
      method: "POST",
      headers: {
        "Authorization": `Key ${process.env.API4AI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: imageUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    return res.status(200).json({
      url: imageUrl,
      nsfwNUMS: data.nsfw || {},
    });
  } catch (error) {
    console.error("Error en nsfw:", error);
    return res.status(500).json({ error: error.message });
  }
}