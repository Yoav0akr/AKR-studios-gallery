import mongoose from "mongoose";
import cloudinary from "cloudinary";

// Configurar Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// URI MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Por favor define MONGODB_URI en las variables de entorno de Vercel");
}

// Cache global
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };


//generar id de imagen como segundo identificador
function generarCodigoAlfanumerico7() {
  const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";
  for (let i = 0; i < 7; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres[indice];
  }
  return codigo;
}

// Schema
const ImagenSchema = new mongoose.Schema({
  id: Number,
  nombre: String,
  ub: String,
  public_id: String,  // <--- NECESARIO para borrar en Cloudinary
  por: String,
  categ: [String],
  mimidesk: String,
  imgID: String,
  codigo: String,
});

const Imagen = mongoose.models.Imagen || mongoose.model("Imagen", ImagenSchema);

// API Handler
export default async function handler(req, res) {
  try {
    // Conexión
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
        });
      }
      cached.conn = await cached.promise;
    }

    switch (req.method) {
      // === GET ===
      case "GET": {
        const imagenes = await Imagen.find().sort({ id: -1 });
        return res.status(200).json(imagenes);
      }

      // === POST ===
      case "POST": {
        try {
          const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
          const nueva = await Imagen.create(body);
          return res.status(201).json(nueva);
        } catch (error) {
          console.error("Error creando documento:", error);
          return res.status(400).json({ error: "Datos inválidos o error de MongoDB" });
        }
      }

      // === DELETE (Mongo + Cloudinary) ===
      case "DELETE": {
        try {
          const { id, _id } = req.query;
          if (!id && !_id)
            return res.status(400).json({ error: "Falta el parámetro id o _id" });

          const filtro = id ? { id: Number(id) } : { _id };

          // Buscar
          const imagen = await Imagen.findOne(filtro);
          if (!imagen)
            return res.status(404).json({ error: "No se encontró la imagen a eliminar" });

          // Borrar en Cloudinary
          if (imagen.public_id) {
            try {
              const resultado = await cloudinary.v2.uploader.destroy(imagen.public_id);

              if (resultado.result === "not found") {
                console.warn("⚠️ No estaba en Cloudinary:", imagen.public_id);
              } else {
                console.log("🗑️ Eliminada en Cloudinary:", imagen.public_id);
              }
            } catch (cloudErr) {
              console.error("❌ Error borrando en Cloudinary:", cloudErr);
              return res.status(500).json({ error: "Error borrando en Cloudinary" });
            }
          }

          // Borrar en Mongo
          const eliminado = await Imagen.findOneAndDelete(filtro);

          return res.status(200).json({
            success: true,
            message: "Imagen eliminada de Mongo y Cloudinary",
            eliminado,
          });
        } catch (error) {
          console.error("Error eliminando documento:", error);
          return res.status(500).json({ error: "Error al eliminar la imagen" });
        }
      }

      // Métodos no permitidos
      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}
