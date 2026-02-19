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

    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;

      // Guardar archivo temporal
      archivoSeleccionado = file;

      // Validar tamaño
      const maxBytes = 20 * 1024 * 1024; // 20MB
      if (file.size > maxBytes) {
        alert(
          `❌ Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 20MB`
        );
        archivoSeleccionado = null;
        return;
      }

      // Preview en el div completo
      const localURL = URL.createObjectURL(file);
      visualizador.style.backgroundImage = `url(${localURL})`;
      visualizador.style.backgroundSize = "cover";
      visualizador.style.backgroundPosition = "center";
      visualizador.style.backgroundRepeat = "no-repeat";

      // Ocultar elementos internos del div (texto, íconos, etc.)
      visualizador.querySelectorAll("p, span, i").forEach(el => el.style.display = "none");
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
// --- control de categorias y filto de imagioenes inaporpiadas
// ==============================

async function nsfwImage(imagenUrl) {
  const res = await fetch("/api/nsfw", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: imagenUrl }),
  });

  const data = await res.json();
  const isUnsafe = data.nsfw?.detections?.some(d => d.name === "unsafe");
  return isUnsafe;
}




// ==============================
// --- BOTÓN DE GUARDAR MANUAL ---
// ==============================
EntradaGuardar.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!archivoSeleccionado) return alert("❌ Selecciona un archivo primero.");
mostrarSpinner();
  // Subida a Cloudinary
  const formData = new FormData();
  formData.append("file", archivoSeleccionado);

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!data.url) {
      console.error(data);
      alert("❌ Error subiendo a Cloudinary: " + (data.error || "desconocido"));
      return;
    }

    cloudinaryURL = data.url;
    console.log("✔ Subido a Cloudinary:", cloudinaryURL);
    // 🔹 de le prregunta ala api sobre los resultados
    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: cloudinaryURL }),
    });
    const analyzeData = await analyzeRes.json();
    const finCaption = analyzeData.output.captions.map(item => item.caption).join(" ");

    EntradaDesc.value = finCaption




    //si contiene +18 no se guarda en mongo
    if (!(await nsfwImage(cloudinaryURL))) {
      // Guardar en Mongo
      guardarEnMongo();
    } else {
      alert("este contenido es nsfw, osea q que es porno o algo explicito, eres acas o un enfermo mental para subir esto?")
    }

  } catch (err) {
    console.error(err);
    alert("⚠ Error de conexión con el servidor.");
  }finally{
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
