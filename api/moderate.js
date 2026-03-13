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

        if (!imgRes.ok) {
            throw new Error("No se pudo descargar la imagen");
        }

        const arrayBuffer = await imgRes.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        const headers = {
            Authorization: `Bearer ${process.env.HF_API_KEY}`,
            "Content-Type": "application/octet-stream"
        };

        // =========================
        // FUNCIÓN CON RETRY
        // =========================

        async function queryHF(url, retries = 2) {

            for (let i = 0; i <= retries; i++) {

                const r = await fetch(url, {
                    method: "POST",
                    headers,
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
            clipData,
            capData
        ] = await Promise.all([

            queryHF("https://router.huggingface.co/hf-inference/models/Falconsai/nsfw_image_detection"),

            queryHF("https://router.huggingface.co/hf-inference/models/arnabdhar/YOLOv8-Face-Detection"),

            fetch(
                "https://router.huggingface.co/hf-inference/models/openai/clip-vit-base-patch32",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.HF_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        inputs: imageURL,
                        parameters: {
                            candidate_labels: [
                                "photo of a person",
                                "real human face",
                                "anime character",
                                "cartoon character",
                                "digital illustration",
                                "furry character",
                                "animal character"
                            ]
                        }
                    })
                }
            ).then(r => r.json()),

            queryHF("https://router.huggingface.co/hf-inference/models/Salesforce/blip-image-captioning-base")

        ]);

        // =========================
        // NSFW
        // =========================

        let nsfwScore = 0;

        if (Array.isArray(nsfwData)) {

            const nsfw = nsfwData.find(x =>
                x.label?.toLowerCase() === "nsfw"
            );

            nsfwScore = nsfw?.score || 0;

        }

        // =========================
        // FACE DETECTION
        // =========================

        const faceDetected =
            Array.isArray(faceData) && faceData.length > 0;


        // =========================
        // FOTO REAL DETECTION
        // =========================

        let realPhotoScore = 0;

        if (Array.isArray(clipData)) {

            const real = clipData.find(x =>
                x.label?.toLowerCase().includes("photo") ||
                x.label?.toLowerCase().includes("real")
            );

            realPhotoScore = real?.score || 0;

        }

        // =========================
        // CATEGORIAS
        // =========================

        let categorias = [];

        if (Array.isArray(clipData)) {

            categorias = clipData
                .slice(0, 5)
                .map(x => x.label);

        }

        // =========================
        // DESCRIPCION
        // =========================

        let descripcion = "";

        if (Array.isArray(capData)) {

            descripcion = capData[0]?.generated_text || "";

        }
//traduccion de la descropcion======
        let descripcionES = descripcion;

        if (descripcion) {

            const transRes = await fetch(
                "https://router.huggingface.co/hf-inference/models/Helsinki-NLP/opus-mt-en-es",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.HF_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        inputs: descripcion
                    })
                }
            );

            const transData = await transRes.json();

            if (Array.isArray(transData)) {
                descripcionES = transData[0]?.translation_text || descripcion;
            }

        }

        // =========================
        // CATEGORIAS DESDE TEXTO
        // =========================

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

            categorias = posibles.filter(tag => text.includes(tag));

        }

        // =========================
        // RESULTADO
        // =========================

        const realPersonDetected =
            faceDetected && realPhotoScore > 0.6;

        const allowed =
            nsfwScore < 0.6 && !realPersonDetected; F

        return res.status(200).json({

            allowed,
            nsfw: nsfwScore,
            realPerson: realPersonDetected,
            categorias,
            descripcion:descripcionES

        });

    } catch (error) {

        console.error("Moderation error:", error);

        return res.status(500).json({
            allowed: true,
            error: "moderation_failed"
        });

    }

}