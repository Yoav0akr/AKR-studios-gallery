import mongoose from "mongoose";

// =====================
// MONGO CONNECTION (Vercel safe)
// =====================
const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// =====================
// ADMIN MODEL (flexible)
// =====================
const AdminSchema = new mongoose.Schema(
  {
    admin: String,
    email: String,
    adminpass: String
  },
  {
    collection: "admins",
    strict: false
  }
);

const Admin =
  mongoose.models.Admin || mongoose.model("Admin", AdminSchema);

// =====================
// HANDLER
// =====================
export default async function handler(req, res) {
  try {
    // 🔌 connect once
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI);
      }
      cached.conn = await cached.promise;
    }

    // ⛔ solo GET
    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res
        .status(405)
        .json({ success: false, error: "Método no permitido" });
    }

    const { admin } = req.query;

    if (!admin) {
      return res.status(400).json({
        success: false,
        error: "Falta admin"
      });
    }

    // 🔎 buscar usuario
    const user = await Admin.findOne({ admin }).select(
      "-password -__v"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado"
      });
    }

    // 🎭 rol futuro-proof
    const roleMap = {
      true: "Administrador",
      false: "Usuario"
    };

    const role =
      roleMap[String(user.adminpass)] || "Usuario";

    return res.status(200).json({
      success: true,
      profile: {
        admin: user.admin,
        email: user.email || null,
        role,
        adminpass: user.adminpass
      }
    });
  } catch (err) {
    console.error("PROFILE API ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Error interno"
    });
  }
}
