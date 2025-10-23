import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

export default async function handler(req, res) {
  if (!cached.conn) {
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
      }).then((mongoose) => mongoose);
    }
    cached.conn = await cached.promise;
  }

  const conn = cached.conn;

  // --- Esquema adaptado a tu estructura ---
  const ImagenSchema = new mongoose.Schema({
    id: Number,
    nombre: String,
    ub: String,          // URL de la imagen (local o Cloudinary)
    por: String,         // autor o estudio
    categ: [String],     // lista de categorías
  });

  const Imagen = conn.models.Imagen || conn.model("Imagen", ImagenSchema);

  switch (req.method) {
    case "GET": {
      const imagenes = await Imagen.find().sort({ id: 1 });
      return res.status(200).json(imagenes);
    }

    case "POST": {
      const nueva = await Imagen.create(req.body);
      return res.status(201).json(nueva);
    }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Método ${req.method} no permitido`);
  }
}

