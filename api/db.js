import mongoose from "mongoose";
import cloudinary from "cloudinary";

// ======================
// Configuración Cloudinary
// ======================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ======================
// URI de MongoDB
// ======================
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Debes definir MONGODB_URI en las variables de entorno");
}

// ======================
// Cache global de Mongoose
// ======================
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

// ======================
// Schema de imagen
// ======================
const ImagenSchema = new mongoose.Schema({
  id: Number,           // opcional, si quieres mantener un id incremental
  nombre: String,
  ub: String,
  public_id: String,    // Cloudinary
  por: String,
  categ: [String],
  mimidesk: String,
  imgID: String,
  email: String,
}, {
  collection: "imagens" // <- tu colección real
});

const Imagen = mongoose.models.Imagen || mongoose.model("Imagen", ImagenSchema);

// ======================
// Handler principal
// ======================
export default async function handler(req, res) {
  try {
    // ----------------------
    // Conectar a MongoDB
    // ----------------------
    if (!cached.conn) {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
      }
      cached.conn = await cached.promise;
    }

    // ======================
    // GET — obtener documentos con modos y paginación
    // ======================
    if (req.method === "GET") {
      const mode = (req.query.mode || "").toLowerCase();
      const { userId, categoria, nombre } = req.query;

      // --- Paginación ---
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      let filtro = {};

      switch (mode) {
        case "cats":
          // Solo devolver categorías distintas
          const categorias = await Imagen.distinct("categ");
          return res.json({ cats: categorias });

        case "home":
          filtro = {};
          console.log("busqueda por general(osea que se busca solo para cada init)")
          break;

        case "user":
          if (!userId) {
            return res.status(400).json({ error: "Falta userId" });
          }
          filtro = { por: userId };
          console.log("busqueda por usuario");
          break;
          
          case "searchcat":
            if (!categoria) {
              return res.status(400).json({ error: "Falta categoria" });
            }
              filtro = { categ: categoria };
            
            console.log("busqueda por categiria");
            break;
            
            case "searchname":
              if (!nombre) {
                return res.status(400).json({ error: "Falta nombre" });
              }
              filtro = { nombre: nombre };
              console.log("busqueda por nombre");
          break;

        default:
          filtro = {};
      }

      // Contar total de documentos según filtro
      const totalDocs = await Imagen.countDocuments(filtro);

      // Traer documentos paginados según filtro
      const data = await Imagen.find(filtro)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit);

      return res.status(200).json({
        mode: mode || "home",
        page,
        limit,
        totalDocs,
        totalPages: Math.ceil(totalDocs / limit),
        data,
      });
    }

    // ======================
    // POST — agregar nueva imagen
    // ======================
    if (req.method === "POST") {
      try {
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // ID incremental opcional
        const ultimo = await Imagen.findOne().sort({ id: -1 });
        const nuevoID = ultimo ? ultimo.id + 1 : 1;

        const data = {
          id: nuevoID,//id de la imagen
          nombre: body.nombre,//nombre de la iamgen
          ub: body.ub,//url de la imagen
          public_id: body.public_id,//su id publico
          por: body.por || "Desconocido",//quein lo sube
          categ: Array.isArray(body.categ) ? body.categ : [body.categ],//categorias
          mimidesk: body.mimidesk || "",//la descripcin de la imagen
          imgID: body.imgID || "",//imagen id
          email: body.email || "",//email de quien lo sube(esta en el local storage)
        };

        const nueva = await Imagen.create(data);
        return res.status(201).json(nueva);
      } catch (err) {
        console.error("❌ Error en POST:", err);
        return res.status(400).json({ error: "Datos inválidos o JSON mal formado" });
      }
    }

    // ======================
    // DELETE — eliminar imagen
    // ======================
    if (req.method === "DELETE") {
      try {
        const { id, _id } = req.query;

        if (!id && !_id)
          return res.status(400).json({ error: "Falta id o _id" });

        const filtro = id ? { id: Number(id) } : { _id };
        const imagen = await Imagen.findOne(filtro);

        if (!imagen)
          return res.status(404).json({ error: "No se encontró la imagen" });

        // Borrar de Cloudinary
        if (imagen.public_id) {
          try {
            await cloudinary.v2.uploader.destroy(imagen.public_id);
          } catch (cloudErr) {
            console.error("Error Cloudinary:", cloudErr);
          }
        }

        // Borrar de MongoDB
        const eliminado = await Imagen.findOneAndDelete(filtro);

        return res.status(200).json({
          success: true,
          eliminado,
        });
      } catch (err) {
        console.error("❌ Error en DELETE:", err);
        return res.status(500).json({ error: "Error eliminando imagen" });
      }
    }

    // ======================
    // Métodos no soportados
    // ======================
    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });

  } catch (err) {
    console.error("Error general:", err);
    return res.status(500).json({ error: "Error conectando a MongoDB" });
  }
}
