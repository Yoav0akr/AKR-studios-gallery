import mongoose from "mongoose";
import bcrypt from "bcrypt";

// === CONFIGURACIÓN MONGODB ===
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Falta MONGODB_URI en las variables de entorno de Vercel");
}

// Conexión cacheada para Vercel (Serverless)
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// === MODELO DE ADMIN ===
const ADMINSchema = new mongoose.Schema(
  {
    admin: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    adminpass: { type: Boolean, default: false }
  },
  { collection: "admins" }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", ADMINSchema);

// === LOGS TEMPORALES (en memoria) ===
const logs = [];

// Función para registrar logs en memoria
function log(message) {
  const timestamp = new Date().toISOString();
  logs.push(`[${timestamp}] ${message}`);
  console.log(`[LOG] ${message}`);
}

// === HANDLER PRINCIPAL ===
export default async function handler(req, res) {
  try {
    // Conexión única
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
      }
      cached.conn = await cached.promise;
      log("Conexión a MongoDB establecida");
    }

    // BODY seguro
    const body = req.body || {};

    // -------------------------------------------
    // GET → Obtener lista de admins
    // -------------------------------------------
    if (req.method === "GET") {
      const admins = await Admin.find().sort({ admin: -1 });
      return res.status(200).json({ success: true, admins });
    }

    // -------------------------------------------
    // POST → Login o Crear Admin
    // -------------------------------------------
    if (req.method === "POST") {
      // LOGIN
      if (body.login === true) {
        const encontrado = await Admin.findOne({ admin: body.admin });
        if (!encontrado) {
          log(`Login fallido: admin "${body.admin}" no encontrado`);
          return res.status(404).json({ success: false, message: "Admin no encontrado" });
        }

        const passOK = await bcrypt.compare(body.password, encontrado.password);
        if (!passOK) {
          log(`Login fallido: contraseña incorrecta para "${body.admin}"`);
          return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
        }

        log(`Login exitoso: "${body.admin}"`);
        return res.status(200).json({ success: true, message: "Login exitoso" });
      }

      // CREAR NUEVO ADMIN
      if (!body.admin || !body.password) {
        return res.status(400).json({ success: false, message: "Faltan campos admin/password" });
      }

      const hashed = await bcrypt.hash(body.password, 10);

      const nuevo = await Admin.create({
        admin: body.admin,
        password: hashed,
      });

      log(`Admin creado: "${body.admin}"`);
      return res.status(201).json({ success: true, message: "Admin creado", admin: nuevo });
    }

    // -------------------------------------------
    // PUT → Editar admin
    // -------------------------------------------
    if (req.method === "PUT") {
      if (!body.id) return res.status(400).json({ success: false, message: "Falta ID del admin" });

      const updates = {};
      if (body.admin) updates.admin = body.admin;
      if (body.password) updates.password = await bcrypt.hash(body.password, 10);

      const actualizado = await Admin.findByIdAndUpdate(body.id, updates, { new: true });
      log(`Admin actualizado: "${body.id}"`);
      return res.status(200).json({ success: true, message: "Admin actualizado", admin: actualizado });
    }

    // -------------------------------------------
    // DELETE → Borrar admin
    // -------------------------------------------
    if (req.method === "DELETE") {
      if (!body.id) return res.status(400).json({ success: false, message: "Falta ID del admin" });

      await Admin.findByIdAndDelete(body.id);
      log(`Admin eliminado: "${body.id}"`);
      return res.status(200).json({ success: true, message: "Admin eliminado" });
    }

    // Método no permitido
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({ success: false, message: `Método ${req.method} no permitido` });

  } catch (error) {
    log(`Error en API /adminsDB: ${error.message}`);
    return res.status(500).json({ success: false, message: "Error interno del servidor" });
  }
}
