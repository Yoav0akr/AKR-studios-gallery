import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs-node';

let nsfwModel = null;

async function loadModel() {
  if (!nsfwModel) {
    nsfwModel = await nsfwjs.load(tf); // 👈 importante pasar tf
  }
  return nsfwModel;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ error: "Debes enviar la propiedad imageUrl" });
  }

  try {
    const model = await loadModel();

    // Descargar la imagen
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // Decodificar en tensor
    const imageTensor = tf.node.decodeImage(Buffer.from(buffer), 3);

    // Clasificar
    const predictions = await model.classify(imageTensor);

    // Liberar memoria
    imageTensor.dispose();

    // Transformar salida
    const scores = {};
    predictions.forEach(p => {
      scores[p.className.toLowerCase()] = p.probability;
    });

    return res.status(200).json({
      url: imageUrl,
      nsfwNUMS: scores,
      predidciones: predictions // 👈 opcional: lista completa con className y probability
    });
  } catch (error) {
    console.error("Error en nsfw:", error);
    return res.status(500).json({ error: error.message });
  }
}