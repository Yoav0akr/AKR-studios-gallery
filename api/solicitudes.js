//registros en mongodb
import mongoose, { Error } from "mongoose";
const MONGODB_URI = process.env.MONGODB_URI||"mongodb+srv://YAKR:YKR@cluster0.bnck7t3.mongodb.net/?appName=Cluster0";
if (!MONGODB_URI) {
  throw new Error("Por favor define MONGODB_URI en las variables de entorno de Vercel, se usara el metododuro");
};

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

//esquema del la solicitud
const SolicitudSchema = new mongoose.Schema(
  {
    IMGnom: String,
    ub: String,
    motivo: String
  },
  { collection: "solicitudes" }
);

const Solicitud = mongoose.models.Solicitud || mongoose.model("Solicitud", SolicitudSchema);

export default async function handler(req, res) {
  try {
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose
          .connect(MONGODB_URI, { bufferCommands: false })
          .then((mongoose) => mongoose);
      }
      cached.conn = await cached.promise;
    }

    //para los diferentes metodos

    //tomar registros
    switch (req.method) {
      case "GET": {
        const solicitudes = await Solicitud.find().sort({ _id:1 });
        return res.status(200).json(solicitudes);
      }
 // para crear nuevas solicitudes

  case "POST": {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
        const nuevaSolicitud = new Solicitud({
          IMGnom: body.IMGnom,
          ub: body.ub,
          motivo: body.motivo
        });
        await nuevaSolicitud.save();
        return res.status(201).json({ success: true, solicitud: nuevaSolicitud });
      }

      //para eliminar las solicitudes al aceptarlas o rechazarlas
      case "DELETE": {
        const { _id } = req.query;
        if (!_id) {
          return res.status(400).json({ success: false, error: "Falta el parámetro _id" });
        }
        const eliminado = await Solicitud.findByIdAndDelete(_id);
        const eliminado_cloudinary =await eliminarArchivoCloudinary(req.query.public_id);
        if (eliminado&&eliminado_cloudinary) {
          return res.status(200).json({ success: true }); 
        } else {
          return res.status(404).json({ success: false, error: "Solicitud no encontrada" });
        }

      }

      default:
        res.setHeader("Allow", ["GET", "POST", "DELETE"]);
        return res.status(405).end(`Método ${req.method} no permitido`);
    }
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  } 
};

//sevicios de cloudinary

import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Necesario para subir archivos con formidable
export const config = { api: { bodyParser: false } };

//eliminar el archivo de cloudinary segun el ub de la solicitud
export async function eliminarArchivoCloudinary(public_id) {
  try {
    const resultado = await cloudinary.v2.uploader.destroy(public_id);
    console.log("✅ Archivo eliminado de Cloudinary:", resultado);
    return resultado;
  } catch (error) {
    console.error("❌ Error al eliminar archivo de Cloudinary:", error);
    throw error;
  }
};





