import mongoose from "mongoose";

//por chatgpt, YAKR de AKR_CodeStudios, yoav0akr

// 🔹 URI de MongoDB desde variable de entorno
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Por favor define MONGODB_URI en las variables de entorno de Vercel");
}

// 🔹 Cache global para evitar múltiples conexiones en Vercel
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// 🔹 Esquema del admin
const ADMINSchema = new mongoose.Schema(
  {
    admin: String,
    password: String,
  },
  { collection: "admins" }
);

const Admin = mongoose.models.Admin || mongoose.model("Admin", ADMINSchema);

// 🔹 Handler principal
export default async function handler(req, res) {
  try {
    // 🔹 Conectar solo una vez (Vercel reusa conexión)
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose
          .connect(MONGODB_URI, { bufferCommands: false })
          .then((mongoose) => mongoose);
      }
      cached.conn = await cached.promise;
    }

    switch (req.method) {
      case "GET": {
        const admins = await Admin.find().sort({ _id: 1 });
        return res.status(200).json(admins);
      }

      case "POST": {
        const body =
          typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // 🔹 Si viene login
        if (body.login === true) {
          const encontrado = await Admin.findOne({
            admin: body.admin,
            password: body.password,
          });

          if (encontrado) {
            return res.status(200).json({ success: true });
          } else {
            return res.status(401).json({ success: false, message: "Acceso denegado" });
          }
        }

        // 🔹 Si NO es login → crear nuevo admin
        const nuevo = await Admin.create({
          admin: body.admin,
          password: body.password,
        });

        return res.status(201).json(nuevo);
      }

      default:
        res.setHeader("Allow", ["GET", "POST"]);
        return res
          .status(405)
          .json({ error: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}
