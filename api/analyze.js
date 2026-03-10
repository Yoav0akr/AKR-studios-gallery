export default async function handler(req, res) {

  // Solo permitir POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imageURL } = req.body;

  if (!imageURL) {
    return res.status(400).json({ error: "Falta imageURL" });
  }

  try {

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/facebook/detr-resnet-50",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageURL }),
      }
    );

    // Si HuggingFace responde error HTTP
    if (!response.ok) {

      const text = await response.text();
      console.warn("HF HTTP error:", text);

      return res.status(200).json({
        faceDetected: false,
        allowed: true,
        warning: "HF request failed"
      });

    }

    const result = await response.json();

    // Si la respuesta no es un array
    if (!Array.isArray(result)) {

      console.warn("Respuesta inesperada:", result);

      return res.status(200).json({
        faceDetected: false,
        allowed: true
      });

    }

    // Detectar si hay personas
    const personDetected = result.some(obj => obj.label === "person");

    return res.status(200).json({
      faceDetected: personDetected,
      allowed: !personDetected
    });

  } catch (error) {

    console.error("Error HF:", error);

    return res.status(200).json({
      faceDetected: false,
      allowed: true,
      warning: "Error en análisis"
    });

  }

}