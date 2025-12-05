// ==============================
//  IMPORTS Y CONFIG
// ==============================
import mongoose from "mongoose";
import cloudinary from "cloudinary";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Falta la variable MONGODB_URI.");
}

let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

// ==============================
//  CONEXIÓN A MONGODB
// ==============================
async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ==============================
//  SCHEMA DE SOLICITUDES
// ==============================
const SolicitudSchema = new mongoose.Schema(
  {
    codigo: String,       // <── FALTABA
    id_foto: String,      // <── FALTABA en POST
    solicitante: String,
    motivo: String,
    descripcion: String,
    fecha: String,
    public_id: String,
  },
  { collection: "solicitudes" }
);

const Solicitud =
  mongoose.models.Solicitud || mongoose.model("Solicitud", SolicitudSchema);

// ==============================
//  FUNCIÓN PARA CÓDIGO ALFANUMÉRICO
// ==============================
function generarCodigoAlfanumerico7() {
  const caracteres =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let codigo = "";
  for (let i = 0; i < 7; i++) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return codigo;
}

// ==============================
//  CLOUDINARY
// ==============================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function eliminarArchivoCloudinary(public_id) {
  try {
    if (!public_id) return null;
    return await cloudinary.v2.uploader.destroy(public_id);
  } catch (error) {
    console.error("Error Cloudinary:", error);
    return null;
  }
}

// ==============================
//  HANDLER
// ==============================
export default async function handler(req, res) {
  try {
    await connectDB();

    switch (req.method) {
      case "GET": {
        const solicitudes = await Solicitud.find().sort({ _id: 1 });
        return res.status(200).json(solicitudes);
      }

      case "POST": {
        const body =
          typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const nuevaSolicitud = new Solicitud({
          codigo: generarCodigoAlfanumerico7(),
          id_foto: body.id_foto,       // <── ahora sí
          solicitante: body.solicitante,
          motivo: body.motivo,
          descripcion: body.descripcion,
          fecha: body.fecha,
          public_id: body.public_id,
        });

        await nuevaSolicitud.save();
        return res.status(201).json({ success: true, solicitud: nuevaSolicitud });
      }

      case "DELETE": {
        const { _id, public_id } = req.query;

        if (!_id)
          return res
            .status(400)
            .json({ success: false, error: "Falta el parámetro _id" });

        await Solicitud.findByIdAndDelete(_id);
        await eliminarArchivoCloudinary(public_id);

        return res.status(200).json({ success: true });
      }

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res
          .status(405)
          .end(`Método ${req.method} no permitido`);
    }
  } catch (error) {
    console.error("Error en API:", error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
}
