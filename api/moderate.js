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

        // =========================
        // DESCARGAR IMAGEN
        // =========================

        const imgRes = await fetch(imageURL);

        if (!imgRes.ok) {
            throw new Error("No se pudo descargar la imagen");
        }

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const headersBinary = {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/octet-stream"
        };

        const headersJSON = {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/json"
        };

        // =========================
        // FUNCION CON RETRY
        // =========================

        async function queryHF(url, retries = 2) {

            for (let i = 0; i <= retries; i++) {

                const r = await fetch(url, {
                    method: "POST",
                    headers: headersBinary,
                    body: buffer
                });

                const data = await r.json();

                if (!data?.error) return data;

                if (data.error.includes("loading") && i < retries) {

                    console.log("⏳ Model loading, retry...");
                    await new Promise(r => setTimeout(r, 3000));
                    continue;

                }

                console.warn("HF error:", data.error);
                return null;

            }

            return null;

        }

        // =========================
        // LLAMADAS EN PARALELO
        // =========================

        const [
            nsfwData,
            faceData,
            captionData,
            clipData
        ] = await Promise.all([

            queryHF(
                "https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection"
            ),

            queryHF(
                "https://router.huggingface.co/hf-inference/models/arnabdhar/YOLOv8-Face-Detection"
            ),

            queryHF(
                "https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base"
            ),

            fetch(
                "https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32",
                {
                    method: "POST",
                    headers: headersJSON,
                    body: JSON.stringify({
                        inputs: imageURL,
                        parameters: {
                            candidate_labels: [
                                "photo",
                                "real person",
                                "anime character",
                                "cartoon",
                                "digital illustration",
                                "furry character",
                                "animal",
                                "landscape",
                                "city",
                                "vehicle",
                                "technology"
                            ]
                        }
                    })
                }
            ).then(r => r.json())

        ]);

        // =========================
        // NSFW
        // =========================

        let nsfwScore = 0;

        if (Array.isArray(nsfwData)) {

            const nsfw = nsfwData.find(
                x => x.label?.toLowerCase() === "nsfw"
            );

            nsfwScore = nsfw?.score || 0;

        }

        // =========================
        // DETECCION DE CARAS
        // =========================

        const faceDetected =
            Array.isArray(faceData) && faceData.length > 0;

        // =========================
        // CLIP ANALISIS
        // =========================

        let realPhotoScore = 0;
        let clipCategorias = [];

        if (Array.isArray(clipData)) {

            clipCategorias = clipData
                .filter(x => x.score > 0.25)
                .map(x => x.label);

            const real = clipData.find(x =>
                x.label.toLowerCase().includes("photo") ||
                x.label.toLowerCase().includes("real")
            );

            realPhotoScore = real?.score || 0;

        } else if (clipData?.error) {

            console.warn("CLIP error:", clipData.error);

        }

        // =========================
        // DESCRIPCION AUTOMATICA
        // =========================

        let descripcion = "";

        if (Array.isArray(captionData)) {
            descripcion = captionData[0]?.generated_text || "";
        }

        // =========================
        // TRADUCCION
        // =========================

        let descripcionES = descripcion;

        if (descripcion) {

            const transRes = await fetch(
                "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-es",
                {
                    method: "POST",
                    headers: headersJSON,
                    body: JSON.stringify({
                        inputs: descripcion
                    })
                }
            );

            const transData = await transRes.json();

            if (Array.isArray(transData) && transData[0]?.translation_text) {
                descripcionES = transData[0].translation_text;
            } else if (transData?.error) {
                console.warn("Translator error:", transData.error);
            }

        }

        // =========================
        // CATEGORIAS DESDE TEXTO
        // =========================

        let categorias = [];

        if (descripcion) {

            const text = descripcion.toLowerCase();

            const posibles = [
                "furry",
                "wolf",
                "fox",
                "cat",
                "dog",
                "anime",
                "cartoon",
                "robot",
                "car",
                "landscape",
                "mountain",
                "forest",
                "city",
                "building",
                "character",
                "animal",
                "technology"
            ];

            categorias = posibles.filter(tag =>
                text.includes(tag)
            );

        }

        // combinar con categorias CLIP

        categorias = [...new Set([
            ...categorias,
            ...clipCategorias
        ])];

        // =========================
        // DETECCION PERSONA REAL
        // =========================

        const realPersonDetected =
            faceDetected && realPhotoScore > 0.7;

        // =========================
        // PERMITIR O BLOQUEAR
        // =========================

        const allowed =
            nsfwScore < 0.6 && !realPersonDetected;

        // =========================
        // RESPUESTA
        // =========================

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