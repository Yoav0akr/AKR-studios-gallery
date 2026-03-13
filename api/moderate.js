export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { imageURL } = req.body;

  if (!imageURL) {
    return res.status(400).json({ error: "Missing imageURL" });
  }

  try {

    console.log("🔎 Moderating:", imageURL);

    const imgRes = await fetch(imageURL);
    const buffer = await imgRes.arrayBuffer();

    // =====================
    // NSFW
    // =====================

    const nsfwRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer
      }
    );

    const nsfwData = await nsfwRes.json();

    let nsfwScore = 0;

    if (Array.isArray(nsfwData)) {
      const nsfw = nsfwData.find(x => x.label?.toLowerCase() === "nsfw");
      nsfwScore = nsfw?.score || 0;
    }

    // =====================
    // FACE DETECTION
    // =====================

    const faceRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/arnabdhar/YOLOv8-Face-Detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer
      }
    );

    const faceData = await faceRes.json();

    const faceDetected = Array.isArray(faceData) && faceData.length > 0;

    // =====================
    // CATEGORIES (CLIP)
    // =====================

    const clipRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer
      }
    );

    const clipData = await clipRes.json();

    let categorias = [];

    if (Array.isArray(clipData)) {
      categorias = clipData
        .slice(0, 5)
        .map(x => x.label);
    }

    // =====================
    // DESCRIPTION (BLIP)
    // =====================

    const capRes = await fetch(
      "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/octet-stream",
        },
        body: buffer
      }
    );

    const capData = await capRes.json();

    let descripcion = "";

    if (Array.isArray(capData)) {
      descripcion = capData[0]?.generated_text || "";
    }

    // =====================
    // RESULTADO
    // =====================

    const allowed = nsfwScore < 0.6 && !faceDetected;

    return res.status(200).json({
      allowed,
      nsfw: nsfwScore,
      realPerson: faceDetected,
      categorias,
      descripcion
    });

  } catch (error) {

    console.error("Moderation error:", error);

    return res.status(500).json({
      allowed: true,
      error: "moderation_failed"
    });

  }

}