import mongoose from "mongoose";
import cloudinary from "cloudinary";

// ======================
// Configuración Cloudinary
// ======================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================
// URI de MongoDB
// ======================
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Debes definir MONGODB_URI en las variables de entorno");
}

// ======================
// Cache global de Mongoose
// ======================
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// ======================
// Schema de imagen
// ======================
const ImagenSchema = new mongoose.Schema({
  id: Number,           // ID numérico incremental
  nombre: String,
  ub: String,
  public_id: String,    // Cloudinary
  por: String,
  categ: [String],
  mimidesk: String,
  imgID: String,
  email: String,
}, {
  collection: "imagens"
});

const Imagen = mongoose.models.Imagen || mongoose.model("Imagen", ImagenSchema);

// ======================
// Handler principal
// ======================
export default async function handler(req, res) {
  try {
    // ----------------------
    // Conectar a MongoDB
    // ----------------------
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
      }
      cached.conn = await cached.promise;
    }

    // ======================
    // GET — obtener todas con paginación
    // ======================
    if (req.method === "GET") {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Contar total de documentos
      const totalDocs = await Imagen.countDocuments();

      // Traer documentos paginados, orden descendente por id
      const data = await Imagen.find().sort({ id: -1 }).skip(skip).limit(limit);

      return res.status(200).json({
        page,
        limit,
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        data
      });
    }


    // ======================
    // POST — agregar nueva imagen
    // ======================
    if (req.method === "POST") {
      try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // ID incremental
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
          email: body.email || "",
        };

        const nueva = await Imagen.create(data);
        return res.status(201).json(nueva);
      } catch (err) {
        console.error("❌ Error en POST:", err);
        return res.status(400).json({ error: "Datos inválidos o JSON mal formado" });
      }
    }

    // ======================
    // DELETE — eliminar imagen
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

        // Borrar de Cloudinary
        if (imagen.public_id) {
          try {
            await cloudinary.v2.uploader.destroy(imagen.public_id);
          } catch (cloudErr) {
            console.error("Error Cloudinary:", cloudErr);
          }
        }

        // Borrar de MongoDB
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

    // ======================
    // Métodos no soportados
    // ======================
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });

  } catch (err) {
    console.error("Error general:", err);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}