import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ==============================
//  MONGODB CONFIG (VERCEL SAFE)
// ==============================
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("Falta MONGODB_URI en variables de entorno");

let cached = global.mongoose || (global.mongoose = { conn: null, promise: null });

// ==============================
//  SCHEMA ADMIN
// ==============================
const ADMINSchema = new mongoose.Schema({
  admin: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  adminpass: { type: String, default: "false" }, // seguimos con string para compatibilidad
}, { collection: "admins" });

const Admin = mongoose.models.Admin || mongoose.model("Admin", ADMINSchema);

// ==============================
//  DB CONNECT
// ==============================
async function connectDB() {
  if (!cached.conn) {
    if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
    cached.conn = await cached.promise;
  }
}

// ==============================
//  HANDLER SIMPLIFICADO
// ==============================
export default async function handler(req, res) {
  try {
    await connectDB();
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    // ---------- GET → TODOS LOS ADMINS ----------
    if (req.method === "GET") {
      const admins = await Admin.find({});
      return res.status(200).json(admins);
    }

    // ---------- POST → LOGIN / REGISTRO ----------
    if (req.method === "POST") {
      // LOGIN
      if (body.login) {
        if (!body.email || !body.password) return res.status(400).json({ success: false, message: "Faltan credenciales" });
        const user = await Admin.findOne({ email: body.email });
        if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        const passOK = await bcrypt.compare(body.password, user.password);
        if (!passOK) return res.status(401).json({ success: false, message: "Contraseña incorrecta" });

        return res.status(200).json({
          success: true,
          admin: user.admin,
          email: user.email,
          adminpass: user.adminpass
        });
      }

      // REGISTRO
      if (!body.admin || !body.email || !body.password) return res.status(400).json({ success: false, message: "Faltan datos para registro" });
      const existe = await Admin.findOne({ email: body.email });
      if (existe) return res.status(409).json({ success: false, message: "Email ya registrado" });

      const hashed = await bcrypt.hash(body.password, 10);
      const nuevo = await Admin.create({
        admin: body.admin,
        email: body.email,
        password: hashed,
        adminpass: "false"
      });

      return res.status(201).json({ success: true, admin: nuevo.admin, email: nuevo.email, adminpass: nuevo.adminpass });
    }

    // ---------- PUT → DAR / QUITAR ADMIN ----------
if (req.method === "PUT") {
  const { _id, adminpass } = body;
  if (!_id || adminpass === undefined) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  // Convertimos siempre a string
  const actualizado = await Admin.findByIdAndUpdate(
    _id,
    { adminpass: String(adminpass) },
    { new: true }
  );

  if (!actualizado) return res.status(404).json({ success: false, message: "Admin no encontrado" });
  return res.status(200).json({ success: true, admin: actualizado.admin, email: actualizado.email, adminpass: actualizado.adminpass });
}

    // ---------- DELETE → BORRAR ADMIN ----------
    if (req.method === "DELETE") {
      const { _id } = body;
      if (!_id) return res.status(400).json({ success: false, message: "Falta ID" });

      const eliminado = await Admin.findByIdAndDelete(_id);
      if (!eliminado) return res.status(404).json({ success: false, message: "Admin no encontrado" });

      return res.status(200).json({ success: true, message: "Admin eliminado" });
    }

    // MÉTODO NO PERMITIDO
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ success: false, message: `Método ${req.method} no permitido` });

  } catch (error) {
    console.error("API adminsDB error:", error);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}