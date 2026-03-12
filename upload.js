// ==============================
// --- VARIABLES DEL FORMULARIO ---
// ==============================
const EntradaNombre = document.getElementById("nombre_imput");
const EntradaPor = document.getElementById("por-imput");
const EntradaCategs = document.getElementById("categs");
const EntradaGuardar = document.getElementById("manchego");
const EntradaDesc = document.getElementById("mimidesk");
const visualizador = document.querySelector(".visualizador");

// ==============================
// --- AUTO LLENADO DEL USUARIO ---
// ==============================
const usuario = localStorage.getItem("admin") || "";
const email_user = localStorage.getItem("email") || "";

if (usuario.trim() !== "") {
  EntradaPor.value = usuario.trim();
  EntradaPor.disabled = true;
} else {
  EntradaPor.value = "";
  EntradaPor.disabled = false;
}

// ==============================
// --- VARIABLES GLOBALES ---
// ==============================
let archivoSeleccionado = null;
let cloudinaryURL = null;
let procesando = false;

// ==============================
// --- SPINNER ---
// ==============================
const spinner = document.getElementById("spinner");

function mostrarSpinner() {
  if (spinner) spinner.classList.remove("no-ver");
}

function ocultarSpinner() {
  if (spinner) spinner.classList.add("no-ver");
}

// ==============================
// --- VALIDACIÓN GLOBAL ---
// ==============================
async function validarImagen(URLimg) {
  let ses = 0;

  // NSFW
  const nsfwScores = await nsfwFun(URLimg) || {};
  const nsfw = nsfwScores.nsfw || 0;
  ses += nsfw;

  // Rostros
  const facesAllowed = await facesFun(URLimg);
  if (!facesAllowed) {
    ses += 0.5; // penaliza si hay rostro humano
  }

  console.log("🔎 Score total:", ses);

  if (ses >= 0.7) {
    alert("❌ Imagen rechazada por contenido inapropiado");
    visualizador.classList.add("reject");
    cloudinaryURL = null;
    return false;
  }

  console.log("✅ Imagen validada correctamente");
  return true;
}

// ==============================
// --- VISUALIZADOR ---
// ==============================
if (visualizador) {
  visualizador.addEventListener("click", () => {

    if (procesando) {
      alert("⏳ Espera a que termine el análisis actual");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      archivoSeleccionado = file;

      if (visualizador.classList.contains("reject")) {
        visualizador.classList.remove("reject");
      }

      const maxBytes = 20 * 1024 * 1024;
      if (file.size > maxBytes) {
        alert(`❌ Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 20MB`);
        archivoSeleccionado = null;
        return;
      }

      const localURL = URL.createObjectURL(file);

      visualizador.style.backgroundImage = `url(${localURL})`;
      visualizador.style.backgroundSize = "cover";
      visualizador.style.backgroundPosition = "center";
      visualizador.style.backgroundRepeat = "no-repeat";
      visualizador.querySelectorAll("p, span, i").forEach(el => el.style.display = "none");

      procesando = true;
      mostrarSpinner();

      try {
        // SUBIR A CLOUDINARY
        const formData = new FormData();
        formData.append("file", archivoSeleccionado);

        console.log("📤 Subiendo archivo a Cloudinary...");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        console.log("📥 Respuesta /api/upload:", data);

        if (!data.url) {
          alert("❌ Error subiendo a Cloudinary");
          cloudinaryURL = null;
          return;
        }

        cloudinaryURL = data.url;
        console.log("✔ Subido:", cloudinaryURL);

        // VALIDACIÓN GLOBAL
        const validada = await validarImagen(cloudinaryURL);
        if (!validada) return;

        // IA
        const IA = await analize(cloudinaryURL);
        if (IA) {
          EntradaDesc.value = IA.descripcion || "";
          EntradaCategs.value = (IA.categorias || []).join(", ");
        }
        console.log("✅ IA completada");

        alert("✅ Imagen validada correctamente. Puedes guardarla.");

      } catch (err) {
        console.error("❌ Error crítico:", err);
        alert("⚠️ Error procesando imagen");
        cloudinaryURL = null;
      } finally {
        procesando = false;
        ocultarSpinner();
      }
    };
  });
}

// ==============================
// --- NSFW ---
// ==============================
async function nsfwFun(URLimg) {
  try {
    if (!URLimg) {
      console.warn("⚠️ imagen no encontrada");
      throw new Error("imagen no encontrada");
    }
    const res = await fetch("/api/nsfw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageURL: URLimg }),
    });
    return await res.json();
  } catch (error) {
    console.error("❌ fallo en análisis NSFW");
    return {};
  }
}

// ==============================
// --- FACE CHECK ---
// ==============================
async function facesFun(URLimg) {
  try {
    if (!URLimg) {
      console.warn("⚠️ facesFun URL inválida");
      return false; // mejor rechazar
    }
    const res = await fetch("/api/faces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageURL: URLimg }),
    });
    if (!res.ok) {
      console.warn("⚠️ HTTP faces:", res.status);
      return false;
    }
    const data = await res.json();
    console.log("👤 Faces result:", data);
    return !!data.allowed;
  } catch (error) {
    console.error("❌ Error faces:", error);
    return false;
  }
}

// ==============================
// --- ANALIZE ---
// ==============================
async function analize(URLimg) {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageURL: URLimg }),
    });
    const data = await res.json();
    if (data) return data;
  } catch (err) {
    console.warn("⚠️ Error IA:", err);
    EntradaDesc.value = "Auto descripción no disponible";
    return null;
  }
}

// ==============================
// --- GUARDAR EN MONGO ---
// ==============================
async function guardarEnMongo() {
  const nombre = EntradaNombre.value.trim();
  const por = EntradaPor.value.trim() || "Desconocido";
  const texto = EntradaCategs.value.toLowerCase().trim();
  const categ = texto ? texto.split(/\s+/) : [];
  const desk = EntradaDesc.value.trim();

  if (!nombre) return alert("❌ Debes poner un nombre.");
  if (!cloudinaryURL) return alert("❌ Primero sube un archivo.");

  const data = {
    nombre,
    ub: cloudinaryURL,
    por,
    categ,
    mimidesk: desk,
    email: email_user || "null",
  };

  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const resData = await res.json();

    if (!res.ok) {
      console.error(resData);
      alert("❌ Error guardando en la base de datos: " + (resData.error || "desconocido"));
      return;
    }

    alert("✅ Imagen guardada correctamente");
    window.location.href = "./index.html";
  } catch (err) {
    console.error("Error al guardar en Mongo:", err);
    alert("❌ No se pudo guardar.");
  }
}

const manchego = document.getElementById("manchego");
manchego.addEventListener("click", () => {
  guardarEnMongo();
});

// ==============================
// --- NAVBAR ---
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  if (navigator.vibrate) navigator.vibrate(200);
});