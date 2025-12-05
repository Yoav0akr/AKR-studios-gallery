// === upload.js ===

// Variables del formulario
const EntradaNombre = document.getElementById("nombre_imput");
const EentradaDeparte = document.getElementById("por-imput");
const EntradaCategs = document.querySelector("#categs");
const EntradaGuardar = document.querySelector("#manchego");
const Entradadesc = document.querySelector("#mimidesk");

// Div visualizador
const visualisador = document.querySelector(".visualizador");

// URL de Cloudinary que se usará después para enviar a Mongo
let cloudinaryURL = null;

// --- MANEJO DEL VISUALIZADOR ---
if (visualisador) {
  visualisador.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*"; // Acepta imagen y video
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      console.log("📂 Archivo seleccionado:", file.name);

      // ===== LIMITE DE 10MB =====
      const maxSizeMB = 10;
      const maxBytes = maxSizeMB * 1024 * 1024;

      if (file.size > maxBytes) {
        alert(
          `❌ El archivo pesa demasiado.\n\nMáximo: ${maxSizeMB} MB\nActual: ${(file.size / 1024 / 1024).toFixed(2)} MB`
        );
        return;
      }

      // ===== PREVIEW LOCAL =====
      const localURL = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      // NO quitamos el <p>, solo el fondo o videos previos
      visualisador.style.backgroundImage = "";
      // Quitamos solo videos antiguos
      Array.from(visualisador.querySelectorAll("video")).forEach(v => v.remove());

      if (isImage) {
        visualisador.style.backgroundImage = `url(${localURL})`;
        visualisador.style.backgroundSize = "cover";
        visualisador.style.backgroundPosition = "center";
      }

      if (isVideo) {
        const video = document.createElement("video");
        video.src = localURL;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
  
        video.style.objectFit = "cover";
        video.style.borderRadius = "10px";
        video.style.top = "0";
        video.style.left = "0";

        visualisador.append(video);
      }

      // Deja el P visible arriba:
      visualisador.querySelector("p").style.position = "relative";
      visualisador.querySelector("p").style.zIndex = "1";

      // ===== SUBIR A CLOUDINARY =====
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.url) {
          console.log("✔ Subido a Cloudinary:", data.url);
          cloudinaryURL = data.url;
        } else {
          alert("❌ Error al subir: " + data.error);
        }
      } catch (err) {
        console.error(err);
        alert("⚠ Error de conexión con el servidor.");
      }
    };
  });
}

// --- GUARDAR EN BASE DE DATOS ---
function queso() {
  const nombre = EntradaNombre.value.trim();
  const por = EentradaDeparte.value.trim();
  const texto = EntradaCategs.value.toLowerCase().trim();
  const categ = texto.split(/\s+/);
  const desk = Entradadesc.value.trim();

  if (!cloudinaryURL) {
    alert("Primero sube un archivo antes de guardar.");
    return;
  }

  guardarEnMongo(nombre, cloudinaryURL, por, categ, desk);
}

EntradaGuardar.addEventListener("click", queso);

// --- GUARDAR EN MONGO ---
async function guardarEnMongo(nombre, url, por, categ, mimidesk) {
  const data = { id: Date.now(), nombre, ub: url, por, categ, mimidesk };

  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Error " + res.status);

    alert("Se ha guardado correctamente");
    const enlace = document.createElement("a");
    enlace.href = "./index.html";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

  } catch (err) {
    console.error("Error al guardar en Mongo:", err);
    alert("No se pudo guardar.");
  }
}

// --- UI NAV ---
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");
logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});
