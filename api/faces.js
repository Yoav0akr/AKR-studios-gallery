export default async function handler(req, res) {

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
        body: JSON.stringify({
          inputs: imageURL
        }),
      }
    );

    const data = await response.json();

    console.log("HF faces:", data);

    const faceDetected = Array.isArray(data) && data.length > 0;

    return res.status(200).json({
      faceDetected,
      allowed: !faceDetected
    });

  } catch (error) {

    console.error("Face detection error:", error);

    return res.status(200).json({
      faceDetected: false,
      allowed: true
    });

  }

}