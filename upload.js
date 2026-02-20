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

// ==============================
// --- MANEJO DEL VISUALIZADOR ---
// ==============================
if (visualizador) {
  visualizador.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      archivoSeleccionado = file;

      const maxBytes = 20 * 1024 * 1024; // 20MB
      if (file.size > maxBytes) {
        alert(`❌ Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 20MB`);
        archivoSeleccionado = null;
        return;
      }

      // Preview local
      const localURL = URL.createObjectURL(file);
      visualizador.style.backgroundImage = `url(${localURL})`;
      visualizador.style.backgroundSize = "cover";
      visualizador.style.backgroundPosition = "center";
      visualizador.style.backgroundRepeat = "no-repeat";
      visualizador.querySelectorAll("p, span, i").forEach(el => el.style.display = "none");

      // 🔹 Subida automática a Cloudinary
      mostrarSpinner();
      try {
        const formData = new FormData();
        formData.append("file", archivoSeleccionado);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!data.url) {
          alert("❌ Error subiendo a Cloudinary: " + (data.error || "desconocido"));
          return;
        }

        cloudinaryURL = data.url;
        console.log("✔ Subido a Cloudinary:", cloudinaryURL);

        // --- Análisis NSFW ---
        const scores = await nsfwImage(cloudinaryURL);
        const { porn = 0, sexy = 0, neutral = 0 } = scores;

        if (neutral >= 0.4 && porn <= 0.3) {
          // Imagen aceptada → sugerimos descripción
          EntradaDesc.value = await DETECT_Desk(cloudinaryURL);
          console.log("Imagen aceptada:", scores);
        } else if (porn >= 0.6) {
          alert(`❌ Contenido inapropiado (NSFW: ${Math.round(porn * 100)}%) → redirigiendo al inicio`);
          cloudinaryURL = null;
          window.location.href = "./index.html";
        } else if (sexy >= 0.7 && porn < 0.6) {
          alert(`⚠ Contenido muy sugerente (Sexy: ${Math.round(sexy * 100)}%) → redirigiendo al inicio`);
          cloudinaryURL = null;
          window.location.href = "./index.html";
        } else {
          // Caso intermedio → revisión manual
          alert("⚠ Imagen marcada para revisión manual.");
          cloudinaryURL = null;
        }

      } catch (err) {
        console.error("Error en subida/análisis:", err);
        alert("⚠ Error de conexión con el servidor.");
      } finally {
        ocultarSpinner();
      }
    };
  });
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

// ==============================
// --- analisis con ia
// ==============================

//para nsfw
async function nsfwImage(imagenUrl) {
  const res = await fetch("/api/nsfw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: imagenUrl }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Error en nsfw:", data.error || data);
    return { porn: 1, sexy: 0, neutral: 0 }; // bloquear por seguridad con valores seguros
  }

  // Aquí decides el umbral de bloqueo
  const scores = data.nsfwNUMS || {};

  return scores;
}


//para las categorias

async function DETECT_Desk(URL_Image) {
  const analyzeRes = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ URL: URL_Image }),
  });
  const analyzeData = await analyzeRes.json();

  if (analyzeData.error) {
    console.error("Error en análisis:", analyzeData.error);
    alert("❌ No se pudo analizar la imagen.");
  } else {
    const finCaption = analyzeData.output.captions.map(item => item.caption).join(" ");
    //retornamos la respuesta:
    return finCaption
  }
}





// ==============================
// --- BOTÓN DE GUARDAR MANUAL ---
// ==============================
EntradaGuardar.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!archivoSeleccionado) return alert("❌ Selecciona un archivo primero.");
  try {

    if (cloudinaryURL) {
      guardarEnMongo();
    } else {
      alert("imagen inapropiada detectada")
    }

  } catch (err) {
    console.error(err);
    alert("⚠ Error de conexión con el servidor.");
  } finally {
    ocultarSpinner();
  }
});

// ==============================
// --- UI NAV ---
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");
if (logo && navs) {
  logo.addEventListener("click", () => {
    logo.classList.toggle("rotado");
    navs.classList.toggle("navhiden");
    navigator.vibrate?.(200);
  });
}

//espinner de carga
const spinner = document.getElementById("spinner");

function mostrarSpinner() {
  spinner.classList.remove("no-ver");
}

function ocultarSpinner() {
  spinner.classList.add("no-ver");
}
