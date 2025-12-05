import mongoose from "mongoose";
import cloudinary from "cloudinary";

// Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mongo URI
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Debes definir MONGODB_URI en las variables de entorno");
}

// Cache global
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// Schema SIN "codigo"
const ImagenSchema = new mongoose.Schema({
  id: Number,           // ID numérico incremental
  nombre: String,
  ub: String,
  public_id: String,    // Cloudinary
  por: String,
  categ: [String],
  mimidesk: String,
  imgID: String,
});

const Imagen = mongoose.models.Imagen || mongoose.model("Imagen", ImagenSchema);

export default async function handler(req, res) {
  try {
    // Conexión a Mongo
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
      }
      cached.conn = await cached.promise;
    }

    // ======================
    // GET — obtener todas
    // ======================
    if (req.method === "GET") {
      const imagenes = await Imagen.find().sort({ id: -1 });
      return res.status(200).json(imagenes);
    }

    // ======================
    // POST — agregar imagen
    // ======================
    if (req.method === "POST") {
      try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // Auto–ID incremental
        const ultimo = await Imagen.findOne().sort({ id: -1 });
        const nuevoID = ultimo ? ultimo.id + 1 : 1;

        const data = {
          id: nuevoID,
          nombre: body.nombre,
          ub: body.ub,
          public_id: body.public_id,
          por: body.por || "Desconocido",
          categ: Array.isArray(body.categ) ? body.categ : [body.categ],
          mimidesk: body.mimidesk || "",
          imgID: body.imgID || "",
        };

        const nueva = await Imagen.create(data);
        return res.status(201).json(nueva);

      } catch (err) {
        console.error("❌ Error en POST:", err);
        return res.status(400).json({ error: "Datos inválidos o JSON mal formado" });
      }
    }

    // ======================
    // DELETE — borrar imagen
    // ======================
    if (req.method === "DELETE") {
      try {
        const { id, _id } = req.query;

        if (!id && !_id)
          return res.status(400).json({ error: "Falta id o _id" });

        const filtro = id ? { id: Number(id) } : { _id };

        const imagen = await Imagen.findOne(filtro);
        if (!imagen)
          return res.status(404).json({ error: "No se encontró la imagen" });

        // Borrar en Cloudinary
        if (imagen.public_id) {
          try {
            await cloudinary.v2.uploader.destroy(imagen.public_id);
          } catch (cloudErr) {
            console.error("Error Cloudinary:", cloudErr);
          }
        }

        // Borrar en MongoDB
        const eliminado = await Imagen.findOneAndDelete(filtro);

        return res.status(200).json({
          success: true,
          eliminado,
        });

      } catch (err) {
        console.error("❌ Error en DELETE:", err);
        return res.status(500).json({ error: "Error eliminando imagen" });
      }
    }

    // Métodos no soportados
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });

  } catch (err) {
    console.error("Error general:", err);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}
