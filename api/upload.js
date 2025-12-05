// === upload.js ===

// Variables del formulario
const EntradaNombre = document.getElementById("nombre_imput");
const EentradaDeparte = document.getElementById("por-imput");
const EntradaCategs = document.querySelector("#categs");
const Entradadesc = document.querySelector("#mimidesk");
const EntradaGuardar = document.getElementById("manchego");

// Div visualizador
const visualisador = document.querySelector(".visualizador");

// Variable global para almacenar la URL de Cloudinary
let cloudinaryURL = null;
let cloudinaryPublicID = null;
let fileType = null;

// ======================
// 📌 MANEJO DEL CLICK EN EL VISUALIZADOR
// ======================
visualisador.addEventListener("click", () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*,video/*";
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    console.log("📂 Archivo seleccionado:", file.name);

    // LIMITE MANUAL DEL FRONT 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert("El archivo excede los 10MB permitidos.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del servidor:", errorText);
        alert("Error al subir archivo.");
        return;
      }

      const data = await res.json();

      cloudinaryURL = data.url;
      cloudinaryPublicID = data.public_id;
      fileType = data.type;

      console.log("✔ Subido:", data);

      // ======================================
      // 📌 PREVISUALIZAR (imagen o video)
      // ======================================
      visualisador.innerHTML = ""; // limpiamos

      if (fileType === "image") {
        visualisador.style.backgroundImage = `url(${cloudinaryURL})`;
        visualisador.style.backgroundSize = "cover";
        visualisador.style.backgroundPosition = "center";
      } else if (fileType === "video") {
        visualisador.style.backgroundImage = "none";

        const vid = document.createElement("video");
        vid.src = cloudinaryURL;
        vid.controls = true;
        vid.style.width = "100%";
        vid.style.height = "100%";
        vid.style.objectFit = "cover";
        vid.style.borderRadius = "10px";

        visualisador.appendChild(vid);
      }

    } catch (err) {
      console.error("⚠ Error de conexión UPLOAD:", err);
      alert("No se pudo conectar al servidor.");
    }
  };
});

// ======================
// 📌 GUARDAR EN MONGO
// ======================
async function queso() {
  const nombre = EntradaNombre.value.trim();
  const por = EentradaDeparte.value.trim();
  const categRaw = EntradaCategs.value.toLowerCase().trim();
  const mimidesk = Entradadesc.value.trim();

  const arrayCateg = categRaw.length > 0 ? categRaw.split(/\s+/) : [];

  if (!cloudinaryURL) {
    alert("Primero sube una imagen o video.");
    return;
  }

  const data = {
    // id ahora LO GENERA EL SERVIDOR
    nombre,
    ub: cloudinaryURL,
    public_id: cloudinaryPublicID,
    por,
    categ: arrayCateg,
    mimidesk,
    imgID: null,
  };

  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error("Error POST Mongo:", t);
      alert("No se pudo guardar en la base de datos.");
      return;
    }

    alert("Guardado correctamente!");

    // Redirigir sin recargar de forma fea
    window.location.href = "./index.html";

  } catch (err) {
    console.error("⚠ Error guardando en Mongo:", err);
    alert("Error al guardar.");
  }
}

EntradaGuardar.addEventListener("click", queso);

// =====================
// ANIMACION DEL LOGO
// =====================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate?.(200);
});
