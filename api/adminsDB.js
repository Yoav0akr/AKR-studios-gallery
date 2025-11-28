import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // bcryptjs en lugar de bcrypt

// === CONFIGURACIÓN MONGODB ===
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Falta MONGODB_URI en las variables de entorno de Vercel");
}

// Conexión cacheada para Vercel
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// === MODELO DE ADMIN ===
const ADMINSchema = new mongoose.Schema(
  {
    admin: { type: String, required: true },
    password: { type: String, required: true },
    adminpass: { type: Boolean, default: false },
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

    // Parsear body
    let body = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    } catch (e) {
      return res.status(400).json({ success: false, error: "JSON inválido" });
    }

    // ---------------- GET → Listar admins ----------------
    if (req.method === "GET") {
      const admins = await Admin.find().sort({ admin: -1 });
      return res.status(200).json({ success: true, admins });
    }

    // ---------------- POST → Crear o login ----------------
    if (req.method === "POST") {
      // LOGIN
      if (body.login === true) {
        const encontrado = await Admin.findOne({ admin: body.admin });
        if (!encontrado)
          return res
            .status(404)
            .json({ success: false, message: "Admin no encontrado" });

        const passOK = await bcrypt.compare(body.password, encontrado.password);
        if (!passOK)
          return res
            .status(401)
            .json({ success: false, message: "Contraseña incorrecta" });

        return res.status(200).json({ success: true, message: "Login exitoso" });
      }

      // CREAR NUEVO ADMIN
      const hashed = await bcrypt.hash(body.password, 10);
      const nuevo = await Admin.create({ admin: body.admin, password: hashed });

      return res.status(201).json({
        success: true,
        message: "Admin creado",
        admin: { id: nuevo._id, admin: nuevo.admin, adminpass: nuevo.adminpass },
      });
    }

    // ---------------- PUT → Actualizar admin ----------------
    if (req.method === "PUT") {
      if (!body.id) return res.status(400).json({ success: false, error: "Falta ID" });

      const updates = {};
      if (body.admin) updates.admin = body.admin;
      if (body.password) updates.password = await bcrypt.hash(body.password, 10);

      const actualizado = await Admin.findByIdAndUpdate(body.id, updates, { new: true });

      return res.status(200).json({
        success: true,
        message: "Admin actualizado",
        admin: actualizado,
      });
    }

    // ---------------- DELETE → Borrar admin ----------------
    if (req.method === "DELETE") {
      if (!body.id) return res.status(400).json({ success: false, error: "Falta ID" });

      await Admin.findByIdAndDelete(body.id);
      return res.status(200).json({ success: true, message: "Admin eliminado" });
    }

    // ---------------- METHOD NOT ALLOWED ----------------
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ success: false, error: `Método ${req.method} no permitido` });
  } catch (error) {
    console.error("Error en API /adminsDB:", error);
    return res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
}
