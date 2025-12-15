import mongoose from "mongoose";

// === CONFIGURACIÓN MONGODB ===
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.3.8";

if (!MONGODB_URI) {
  throw new Error("Falta MONGODB_URI en las variables de entorno de Vercel");
}

// Conexión cacheada para Vercel
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// === MODELO DE ADMIN ===
const ADMINSchema = new mongoose.Schema(
  {
    admin: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // ⚠️ texto plano por ahora
    email: { type: String, required: true },
    adminpass: {
      type: String,
      default: "usuario", // valores posibles: "usuario", "admin", "moderador", etc.
    },
  },
  { collection: "admins" }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", ADMINSchema);

// === HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  try {
    // Conexión única en serverless
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
          bufferCommands: false,
        });
      }
      cached.conn = await cached.promise;
    }

    // ---------------- GET → Listar admins ----------------
    if (req.method === "GET") {
      const { admin } = req.query;

      if (!admin) {
        return res
          .status(400)
          .json({ success: false, error: "Falta parámetro 'admin'" });
      }

      const admin_mandar = await Admin.findOne({ admin });

      if (!admin_mandar) {
        return res
          .status(404)
          .json({ success: false, error: "Admin no encontrado" });
      }

      return res.status(200).json({
        success: true,
        nombre: admin_mandar.admin,
        email: admin_mandar.email,
        adminpass: admin_mandar.adminpass, // string: "usuario", "admin", etc.
      });
    }

    // ---------------- METHOD NOT ALLOWED ----------------
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ success: false, error: `Método ${req.method} no permitido` });
  } catch (error) {
    console.error("Error en API /perfil:", error);
    return res
      .status(500)
      .json({ success: false, error: "Error interno del servidor" });
  }
}