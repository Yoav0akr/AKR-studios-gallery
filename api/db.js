import mongoose from "mongoose";

// 🔹 Asegúrate de que la URI exista
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error(
    "Por favor define MONGODB_URI en las variables de entorno de Vercel"
  );
}

// 🔹 Cache global para evitar reconexiones en Vercel
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function handler(req, res) {
  try {
    // 🔹 Conexión a MongoDB
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        }).then((mongoose) => mongoose);
      }
      cached.conn = await cached.promise;
    }

    const conn = cached.conn;

    // --- Esquema ---
    const ImagenSchema = new mongoose.Schema({
      id: Number,
      nombre: String,
      ub: String,
      por: String,
      categ: [String],
    });

    const Imagen = conn.models.Imagen || conn.model("Imagen", ImagenSchema);

    // --- Manejo de métodos ---
    switch (req.method) {
      case "GET": {
        const imagenes = await Imagen.find().sort({ id: 1 });
        return res.status(200).json(imagenes);
      }

    case "POST": {
  try {
    // parsear body si viene como string
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const nueva = await Imagen.create(body);
    return res.status(201).json(nueva);
  } catch (error) {
    console.error("Error creando documento:", error);
    return res.status(400).json({ error: "Datos inválidos o error de MongoDB" });
  }
}

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res.status(405).json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}
