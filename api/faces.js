export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imageURL } = req.body;
  if (!imageURL) {
    return res.status(400).json({ error: "Falta imageURL" });
  }

  try {
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/arnabdhar/YOLOv8-Face-Detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: imageURL }),
      }
    );

    const result = await response.json();

    // El modelo devuelve un array de objetos con bounding boxes si detecta rostros
    if (!Array.isArray(result)) {
      console.warn("HF respondió algo inesperado:", result);
      return res.status(200).json({
        faceDetected: false,
        warning: "Modelo no disponible"
      });
    }

    const faceDetected = result.length > 0;

    return res.status(200).json({
      faceDetected,
      allowed: !faceDetected // permitido si NO hay rostros humanos
    });

  } catch (error) {
    console.error("Error HF:", error);
    return res.status(200).json({
      faceDetected: false,
      warning: "Error en análisis"
    });
  }
}