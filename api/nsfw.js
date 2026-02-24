export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { imageURL } = req.body;

    if (!imageURL) {
      return res.status(400).json({ error: "imageURL es requerido" });
    }

    console.log("🔍 Analizando imagen:", imageURL);

    // Descargar la imagen
    const imageResponse = await fetch(imageURL);
    if (!imageResponse.ok) {
      return res.status(400).json({ error: "No se pudo descargar la imagen" });
    }

    const imageBuffer = await imageResponse.buffer();

    // Usar sharp para analizar propiedades de la imagen
    const sharp = require("sharp");
    const metadata = await sharp(imageBuffer).metadata();

    console.log("📊 Metadata de imagen:", metadata);

    // Análisis heurístico gratis sin modelos ML
    const nsfwScore = analizarImagenGratis(metadata, imageBuffer);

    console.log("✅ Análisis completado:", nsfwScore);

    return res.status(200).json(nsfwScore);
  } catch (error) {
    console.error("❌ Error en /api/nsfw:", error.message);
    return res.status(500).json({ 
      error: "Error analizando imagen",
      message: error.message 
    });
  }
}

// Análisis GRATIS basado en propiedades de imagen
function analizarImagenGratis(metadata, imageBuffer) {
  let porn = 0;
  let sexy = 0;
  let neutral = 0.5; // Por defecto neutral
  let drawing = 0;
  let hentai = 0;

  // 1️⃣ Análisis por tamaño y formato
  if (metadata.width && metadata.height) {
    const aspectRatio = metadata.width / metadata.height;
    const area = metadata.width * metadata.height;

    // Imágenes muy anchas o muy altas suelen ser distintas
    if (aspectRatio > 2 || aspectRatio < 0.5) {
      drawing += 0.2;
    }
  }

  // 2️⃣ Análisis por formato
  if (metadata.format === "png") {
    drawing += 0.15; // PNG suele tener más dibujos/arte
  } else if (metadata.format === "jpeg") {
    neutral += 0.1; // JPEG suele ser más fotos reales
  }

  // 3️⃣ Análisis de densidad de píxeles (skin tone detection básico)
  try {
    if (imageBuffer && imageBuffer.length > 0) {
      // Muestrear píxeles para detectar tonos de piel
      const skinPixels = contarPixelesDePiel(imageBuffer, metadata);
      const porcentajePiel = skinPixels / Math.max(1, metadata.width * metadata.height);

      if (porcentajePiel > 0.3) {
        // Muchos píxeles de color piel
        sexy += 0.4;
        porn += 0.2;
        neutral -= 0.2;
      } else if (porcentajePiel > 0.15) {
        sexy += 0.15;
        neutral -= 0.05;
      }
    }
  } catch (e) {
    console.warn("⚠️ Error en análisis de píxeles:", e.message);
  }

  // 4️⃣ Normalizar scores (suma = 1)
  const total = porn + sexy + neutral + drawing + hentai;
  if (total > 0) {
    porn = porn / total;
    sexy = sexy / total;
    neutral = neutral / total;
    drawing = drawing / total;
    hentai = hentai / total;
  } else {
    neutral = 1;
  }

  return {
    porn: Math.min(1, Math.max(0, porn)),
    sexy: Math.min(1, Math.max(0, sexy)),
    neutral: Math.min(1, Math.max(0, neutral)),
    drawing: Math.min(1, Math.max(0, drawing)),
    hentai: Math.min(1, Math.max(0, hentai))
  };
}

// Detectar tonos de piel en la imagen (análisis RGB básico)
function contarPixelesDePiel(buffer, metadata) {
  let count = 0;

  try {
    // Muestrear cada 10 píxeles para ser rápido
    const stride = 10;
    
    for (let i = 0; i < buffer.length; i += stride * 4) {
      const r = buffer[i];
      const g = buffer[i + 1];
      const b = buffer[i + 2];
      const a = buffer[i + 3];

      // Si es totalmente transparente, ignorar
      if (a === 0) continue;

      // Detección de tono de piel (rangos aproximados)
      if (
        r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15
      ) {
        count++;
      }
    }
  } catch (e) {
    console.warn("⚠️ Error contando píxeles:", e.message);
  }

  return count;
}