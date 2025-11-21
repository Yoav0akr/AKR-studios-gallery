import mongoose from "mongoose";

// 🔹 URI de MongoDB desde variable de entorno
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Por favor define MONGODB_URI en las variables de entorno de Vercel");
}

// 🔹 Cache global para evitar múltiples conexiones en Vercel
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// 🔹 SCHEMA Y MODELO fuera del handler
const ImagenSchema = new mongoose.Schema({
  id: Number,
  nombre: String,
  ub: String,
  por: String,
  categ: [String],
  desk: String,
});

const Imagen = mongoose.models.Imagen || mongoose.model("Imagen", ImagenSchema);

// 🔹 HANDLER
export default async function handler(req, res) {
  try {
    // 🔹 Conexión a MongoDB
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
        });
      }
      cached.conn = await cached.promise;
    }

    // 🔹 Manejo de métodos
    switch (req.method) {
      // === OBTENER TODAS ===
      case "GET": {
        const imagenes = await Imagen.find().sort({ id: -1 });
        return res.status(200).json(imagenes);
      }

      // === CREAR NUEVA ===
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

      // === ELIMINAR UNA SOLA IMAGEN ===
      case "DELETE": {
        try {
          const { id, _id } = req.query; // puedes enviar ?id= o ?_id=
          if (!id && !_id)
            return res.status(400).json({ error: "Falta el parámetro id o _id" });

          const filtro = id ? { id: Number(id) } : { _id };
          const eliminado = await Imagen.findOneAndDelete(filtro);

          if (!eliminado)
            return res.status(404).json({ error: "No se encontró la imagen a eliminar" });

          return res.status(200).json({
            success: true,
            message: "Imagen eliminada correctamente",
            eliminado,
          });
        } catch (error) {
          console.error("Error eliminando documento:", error);
          return res.status(500).json({ error: "Error al eliminar la imagen" });
        }
      }

      // === MÉTODOS NO PERMITIDOS ===
      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}
