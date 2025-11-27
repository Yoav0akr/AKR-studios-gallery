import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
    adminpass: { type: Boolean, default: false } // por si quieres manejar roles después
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

    // -------------------------------------------
    // GET → Obtener lista de admins
    // -------------------------------------------
    if (req.method === "GET") {
      const admins = await Admin.find().sort({ admin: -1 });
      return res.status(200).json(admins);
    }

    // Parsear body por seguridad
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    // -------------------------------------------
    // POST → Login o Crear Admin
    // -------------------------------------------
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

        return res.status(200).json({
          success: true,
          message: "Login exitoso",
        });
      }

      // CREAR NUEVO ADMIN
      const hashed = await bcrypt.hash(body.password, 10);

      const nuevo = await Admin.create({
        admin: body.admin,
        password: hashed,
      });

      return res.status(201).json({
        success: true,
        message: "Admin creado",
        admin: nuevo,
      });
    }

    // -------------------------------------------
    // PUT → Editar admin (contraseña, nombre…)
    // -------------------------------------------
    if (req.method === "PUT") {
      if (!body.id) {
        return res.status(400).json({ error: "Falta ID del admin" });
      }

      const updates = {};

      if (body.admin) updates.admin = body.admin;

      if (body.password) {
        updates.password = await bcrypt.hash(body.password, 10);
      }

      const actualizado = await Admin.findByIdAndUpdate(body.id, updates, {
        new: true,
      });

      return res.status(200).json({
        success: true,
        message: "Admin actualizado",
        admin: actualizado,
      });
    }

    // -------------------------------------------
    // DELETE → Borrar admin
    // -------------------------------------------
    if (req.method === "DELETE") {
      if (!body.id) {
        return res.status(400).json({ error: "Falta ID del admin" });
      }

      await Admin.findByIdAndDelete(body.id);

      return res
        .status(200)
        .json({ success: true, message: "Admin eliminado" });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res
      .status(405)
      .json({ error: `Método ${req.method} no permitido` });
  } catch (error) {
    console.error("Error en API /adminsDB:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
