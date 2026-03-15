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

// ======================
// DESCARGAR IMAGEN
// ======================

const imgRes = await fetch(imageURL);

if (!imgRes.ok) {
throw new Error("Image download failed");
}

const arrayBuffer = await imgRes.arrayBuffer();
const buffer = new Uint8Array(arrayBuffer);

const headers = {
Authorization: `Bearer ${process.env.HF_API_KEY}`,
"Content-Type": "application/octet-stream"
};

// ======================
// FUNCION HUGGINGFACE
// ======================

async function queryHF(model, retries = 2) {

for (let i = 0; i <= retries; i++) {

const r = await fetch(
`https://router.huggingface.co/hf-inference/models/${model}`,
{
method: "POST",
headers,
body: buffer
}
);

if (!r.ok) {
console.warn("HF HTTP error:", r.status);
return null;
}

let data;

try {
data = await r.json();
} catch {
return null;
}

if (!data?.error) return data;

if (data.error.includes("loading") && i < retries) {

console.log("⏳ model loading...");
await new Promise(r => setTimeout(r, 2500));
continue;

}

console.warn("HF error:", data.error);
return null;

}

return null;

}

// ======================
// LLAMADAS EN PARALELO
// ======================

const [nsfwData, captionData, clipData] =
await Promise.all([

queryHF("Falconsai/nsfw_image_detection"),

queryHF("Salesforce/blip-image-captioning-base"),

queryHF("openai/clip-vit-base-patch32")

]);

// ======================
// NSFW SCORE
// ======================

let nsfwScore = 0;

if (Array.isArray(nsfwData)) {

const nsfw = nsfwData.find(
x => x.label?.toLowerCase() === "nsfw"
);

nsfwScore = nsfw?.score || 0;

}

// ======================
// CLIP ANALISIS
// ======================

let realPhotoScore = 0;
let categorias = [];

if (Array.isArray(clipData)) {

categorias = clipData
.filter(x => x.score > 0.35)
.map(x => x.label)
.filter(x =>
!x.includes("photo") &&
!x.includes("real")
);

const real = clipData.find(x =>
x.label.toLowerCase().includes("photo") ||
x.label.toLowerCase().includes("real")
);

realPhotoScore = real?.score || 0;

}

// ======================
// CAPTION
// ======================

let descripcion = "";

if (Array.isArray(captionData)) {
descripcion = captionData[0]?.generated_text || "";
}

// ======================
// TRADUCCION
// ======================

let descripcionES = descripcion;

if (descripcion) {

try {

const t = await fetch(
"https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-es",
{
method: "POST",
headers: {
Authorization: `Bearer ${process.env.HF_API_KEY}`,
"Content-Type": "application/json"
},
body: JSON.stringify({ inputs: descripcion })
}
);

const data = await t.json();

if (Array.isArray(data)) {
descripcionES = data[0]?.translation_text || descripcion;
}

} catch {}

}

// ======================
// TAGS DESDE TEXTO
// ======================

if (descripcion) {

const posibles = [
"furry","wolf","fox","cat","dog",
"anime","cartoon","robot",
"car","landscape","city",
"forest","mountain",
"technology","animal"
];

const text = descripcion.toLowerCase();

const tags = posibles.filter(tag =>
text.includes(tag)
);

categorias = [...new Set([
...categorias,
...tags
])];

}

// limitar tags

categorias = categorias.slice(0,6);

// ======================
// DETECCION PERSONA REAL
// ======================

const realPersonDetected =
realPhotoScore > 0.75;

// ======================
// DECISION FINAL
// ======================

const allowed =
nsfwScore < 0.6 && !realPersonDetected;

// ======================
// RESPUESTA
// ======================

console.log({
nsfwScore,
realPhotoScore,
allowed,
categorias,
descripcionES
});

return res.status(200).json({

allowed,
nsfw: nsfwScore,
realPerson: realPersonDetected,
categorias,
descripcion: descripcionES

});

} catch (error) {

console.error("Moderation error:", error);

return res.status(500).json({
allowed: true,
error: "moderation_failed"
});

}

}