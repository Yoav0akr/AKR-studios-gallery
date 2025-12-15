import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ==============================
//  MONGODB CONFIG (VERCEL SAFE)
// ==============================
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Falta MONGODB_URI en variables de entorno");
}

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// ==============================
//  SCHEMA ADMIN
// ==============================
const ADMINSchema = new mongoose.Schema({
  admin: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  adminpass: {
    type: String,
    default: "false" // "true" | "false"
  }
}, { collection: "admins" });

const Admin = mongoose.models.Admin || mongoose.model("Admin", ADMINSchema);

// ==============================
//  DB CONNECT
// ==============================
async function connectDB() {
  if (!cached.conn) {
    if (!cached.promise) {
      cached.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false
      });
    }
    cached.conn = await cached.promise;
  }
}

// ==============================
//  HANDLER
// ==============================
export default async function handler(req, res) {
  try {
    await connectDB();

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    // ==============================
    //  GET → EXISTE ADMIN
    // ==============================
    if (req.method === "GET") {
      const { admin } = req.query;
      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Falta admin"
        });
      }

      const existe = await Admin.findOne({ admin });

      return res.status(200).json({
        success: true,
        exists: !!existe
      });
    }

    // ==============================
    //  POST → LOGIN / REGISTRO
    // ==============================
    if (req.method === "POST") {

      // ---------- LOGIN ----------
      if (body.login === true) {
        if (!body.admin || !body.password) {
          return res.status(400).json({
            success: false,
            message: "Faltan credenciales"
          });
        }

        const user = await Admin.findOne({ email: body.email });

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "Usuario no encontrado"
          });
        }

        const passOK = await bcrypt.compare(body.password, user.password);
        if (!passOK) {
          return res.status(401).json({
            success: false,
            message: "Contraseña incorrecta"
          });
        }

        return res.status(200).json({
          success: true,
          admin: user.admin,
          email: user.email,
          adminpass: user.adminpass
        });
      }

      // ---------- REGISTRO ----------
      if (!body.admin || !body.password || !body.email) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos"
        });
      }

      const existe = await Admin.findOne({ admin: body.admin });
      if (existe) {
        return res.status(409).json({
          success: false,
          message: "El admin ya existe"
        });
      }

      const hashed = await bcrypt.hash(body.password, 10);

      const nuevo = await Admin.create({
        admin: body.admin,
        email: body.email,
        password: hashed,
        adminpass: "false"
      });

      return res.status(201).json({
        success: true,
        message: "Usuario creado",
        admin: nuevo.admin,
        adminpass: nuevo.adminpass
      });
    }

    // ==============================
    //  PUT → CAMBIAR adminpass
    // ==============================
    if (req.method === "PUT") {
      if (!body.id || !body.adminpass) {
        return res.status(400).json({
          success: false,
          message: "Faltan datos"
        });
      }

      const actualizado = await Admin.findByIdAndUpdate(
        body.id,
        { adminpass: body.adminpass },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        admin: actualizado.admin,
        adminpass: actualizado.adminpass
      });
    }

    // ==============================
    //  DELETE → BORRAR ADMIN
    // ==============================
    if (req.method === "DELETE") {
      if (!body.id) {
        return res.status(400).json({
          success: false,
          message: "Falta ID"
        });
      }

      await Admin.findByIdAndDelete(body.id);
      return res.status(200).json({
        success: true,
        message: "Admin eliminado"
      });
    }

    // ==============================
    //  METHOD NOT ALLOWED
    // ==============================
    res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
    return res.status(405).json({
      success: false,
      message: `Método ${req.method} no permitido`
    });

  } catch (error) {
    console.error("API adminsDB error:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
}
