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

        // ======================
        // SUBIR A CLOUDINARY
        // ======================
        const formData = new FormData();
        formData.append("file", archivoSeleccionado);

        console.log("📤 Subiendo archivo a Cloudinary...");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        const data = await res.json();

        console.log("📥 Respuesta /api/upload:", data);

        if (!data.url) {
          alert("❌ Error subiendo a Cloudinary");
          cloudinaryURL = null;
          return;
        }

        cloudinaryURL = data.url;

        console.log("✔ Subido:", cloudinaryURL);

        // ======================
        // NSFW CHECK
        // ======================
        const scores = await nsfwFun(cloudinaryURL) || {};
        const { nsfw = 0, sfw = 1 } = scores;

        console.log("🔎 NSFW:", scores);

        // ======================
        // FACE CHECK
        // ======================
        console.log("🔍 Analizando rostros...");

        const facesAllowed = await facesFun(cloudinaryURL);

        if (!facesAllowed) {

          visualizador.classList.add("reject");
          alert("❌ Esta imagen contiene una cara humana. Verifica los derechos de uso.");
          cloudinaryURL = null;
          return;

        }

        // ======================
        // NSFW VALIDACIÓN
        // ======================
        if (nsfw >= 0.7) {

          alert(`❌ Contenido inapropiado detectado (${(nsfw * 100).toFixed(1)}%)`);
          visualizador.classList.add("reject");
          cloudinaryURL = null;
          return;

        }

        if (nsfw > 0.3) {

          alert("⚠️ Imagen marcada para revisión manual.");
          visualizador.classList.add("reject");
          cloudinaryURL = null;
          return;

        }

        console.log("✅ Imagen segura");

        // ======================
        // IA (PARALELO)
        // ======================
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageURL: cloudinaryURL }),
          });

          const data = await res.json();

          EntradaDesc.value = data.descripcion || "";
          EntradaCategs.value = (data.categorias || []).join(", ");

          console.log("✅ IA completada");

        } catch (err) {

          console.warn("⚠️ Error IA:", err);

          EntradaDesc.value = "Auto descripcion no disponible";

        }

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
      return true;
    }

    const res = await fetch("/api/faces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageURL: URLimg }),
    });

    if (!res.ok) {
      console.warn("⚠️ HTTP faces:", res.status);
      return true;
    }

    const data = await res.json();

    console.log("👤 Faces result:", data);

    return Boolean(data.allowed);

  } catch (error) {

    console.error("❌ Error faces:", error);

    return true;

  }

}
// ==============================
//  NAVBAR
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  if (navigator.vibrate) navigator.vibrate(200);
});
