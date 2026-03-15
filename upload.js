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
  try {

    const res = await fetch("/api/moderate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageURL: URLimg })
    });

    const data = await res.json();

    console.log("🧠 Moderation:", data);

    if (!data.allowed) {

      if (data.realPerson) {
        alert("❌ No se permiten personas reales, .............???????///////lee las relgas");
      }

      if (data.nsfw > 0.6) {
        alert("❌ Imagen NSFW detectada, lee las relgas ");
      }

      visualizador.classList.add("reject");
      cloudinaryURL = null;

      return false;
    }

    EntradaDesc.value = data.descripcion || "";
    EntradaCategs.value = (data.categorias || []).join(", ");

    return true;

  } catch (err) {
    console.error("⚠️ Error en moderación:", err);
    alert("⚠️ No se pudo analizar la imagen");

    cloudinaryURL = null;
    return false;
  }
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
// --- GUARDAR EN MONGO ---
// ==============================
async function guardarEnMongo() {
  const nombre = EntradaNombre.value.trim();
  const por = EntradaPor.value.trim() || "Desconocido";
  const texto = EntradaCategs.value.toLowerCase().trim();
  const categ = texto ? texto.split(/\s+/) : [];
  const desk = EntradaDesc.value.trim();

  if (!nombre) return alert("❌ Debes poner un nombre.");
  if (!por) return alert("❌ Debes poner un quien lo sube.");
  if (!texto) return alert("❌ Debes poner las categorias de la imagen.");
  if (!desk&& nombre.leng>10) return alert("❌ Debes poner una buena descripcion.");
  if (cloudinaryURL === null) return alert("❌ Primero sube un archivo apropiado.");

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