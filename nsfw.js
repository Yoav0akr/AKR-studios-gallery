import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';

let nsfwModel = null;

async function loadModel() {
  if (!nsfwModel) {
    nsfwModel = await nsfwjs.load(); // usa tfjs del navegador
  }
  return nsfwModel;
}

export async function nsfwImage(imageElement) {
  const model = await loadModel();
  const predictions = await model.classify(imageElement);

  const scores = {};
  predictions.forEach(p => {
    scores[p.className.toLowerCase()] = p.probability;
  });

  return scores;
}
