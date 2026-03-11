import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// === CONFIGURACIÓN MONGODB ===
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/?directConnection=true";
if (!MONGODB_URI) throw new Error("Falta MONGODB_URI");

// Conexión cacheada para serverless (Vercel)
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// === MODELO DE ADMIN ===
const ADMINSchema = new mongoose.Schema({
  admin: { type: String, required: true },
  password: { type: String, required: true },
  adminpass: { type: String, default: "false" }, // usamos string para compatibilidad front
}, { collection: "admins" });

const Admin = mongoose.models.Admin || mongoose.model("Admin", ADMINSchema);

// === HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  try {
    // Conexión única
    if (!cached.conn) {
      if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
      cached.conn = await cached.promise;
    }

    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.status(400).json({ success: false, error: "JSON inválido" });
    }

    // ---------------- GET → Listar admins ----------------
if (req.method === "GET") {
  const admins = await Admin.find().sort({ admin: -1 });
  return res.status(200).json({ success: true, data: admins });
}


    // ---------------- POST → Crear / Login ----------------
    if (req.method === "POST") {
      // LOGIN
      if (body.login) {
        const user = await Admin.findOne({ admin: body.admin });
        if (!user) return res.status(404).json({ success: false, message: "Admin no encontrado" });
        const passOK = await bcrypt.compare(body.password, user.password);
        if (!passOK) return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
        return res.status(200).json({ success: true, admin: user.admin, adminpass: user.adminpass });
      }

      // CREAR NUEVO ADMIN
      if (!body.admin || !body.password) return res.status(400).json({ success: false, message: "Faltan datos" });
      const hashed = await bcrypt.hash(body.password, 10);
      const nuevo = await Admin.create({ admin: body.admin, password: hashed });
      return res.status(201).json({ success: true, admin: { id: nuevo._id, admin: nuevo.admin, adminpass: nuevo.adminpass } });
    }

    // ---------------- PUT → Dar / Quitar admin ----------------
    if (req.method === "PUT") {
      const { id, adminpass } = body;
      if (!id || adminpass === undefined) return res.status(400).json({ success: false, message: "Faltan datos" });

      const actualizado = await Admin.findByIdAndUpdate(id, { adminpass: String(adminpass) }, { new: true });
      if (!actualizado) return res.status(404).json({ success: false, message: "Admin no encontrado" });
      return res.status(200).json({ success: true, admin: actualizado });
    }

    // ---------------- DELETE → Borrar admin ----------------
    if (req.method === "DELETE") {
      const { id } = body;
      if (!id) return res.status(400).json({ success: false, message: "Falta ID" });
      const eliminado = await Admin.findByIdAndDelete(id);
      if (!eliminado) return res.status(404).json({ success: false, message: "Admin no encontrado" });
      return res.status(200).json({ success: true, message: "Admin eliminado" });
    }

    // ---------------- METHOD NOT ALLOWED ----------------
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ success: false, message: `Método ${req.method} no permitido` });

  } catch (error) {
    console.error("Error en API /personas:", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}