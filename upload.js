// === upload.js ===

// --- VARIABLES DEL FORMULARIO ---
const EntradaNombre = document.getElementById("nombre_imput");
const EntradaPor = document.getElementById("por-imput");
const EntradaCategs = document.getElementById("categs");
const EntradaGuardar = document.getElementById("manchego");
const EntradaDesc = document.getElementById("mimidesk");

// --- AUTO LLENADO DEL USUARIO ---
const usuario = localStorage.getItem("admin") || "";
const email_user = localStorage.getItem("email") || "";

EntradaPor.value = usuario;
EntradaPor.disabled = true;

// --- DIV VISUALIZADOR ---
const visualizador = document.querySelector(".visualizador");
let cloudinaryURL = null;

// --- MANEJO DEL VISUALIZADOR ---
if (visualizador) {
  visualizador.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      console.log("📂 Archivo seleccionado:", file.name);

      // Validar tamaño (máx 20MB)
      const maxBytes = 20 * 1024 * 1024;
      if (file.size > maxBytes) {
        alert(
          `❌ El archivo pesa demasiado.\nMáximo: 20MB\nActual: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        );
        return;
      }

      // Preview local
      const localURL = URL.createObjectURL(file);
      visualizador.style.backgroundImage = `url(${localURL})`;
      visualizador.style.backgroundSize = "cover";
      visualizador.style.backgroundPosition = "center";

      const p = visualizador.querySelector("p");
      if (p) {
        p.style.position = "relative";
        p.style.zIndex = "1";
      }

      // SUBIDA A CLOUDINARY
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

          // Guardar automáticamente en Mongo
          guardarEnMongo();
        } else {
          console.error(data);
          alert("❌ Error al subir archivo: " + (data.error || "desconocido"));
          cloudinaryURL = null;
        }
      } catch (err) {
        console.error(err);
        alert("⚠ Error de conexión con el servidor.");
        cloudinaryURL = null;
      }
    };
  });
}

// --- GUARDAR EN MONGO ---
async function guardarEnMongo() {
  const nombre = EntradaNombre.value.trim();
  const por = EntradaPor.value.trim();
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

    alert("✅ Imagen guardada correctamente con tu email");
    window.location.href = "./index.html";
  } catch (err) {
    console.error("Error al guardar en Mongo:", err);
    alert("❌ No se pudo guardar.");
  }
}

// --- BOTÓN DE GUARDAR MANUAL ---
EntradaGuardar.addEventListener("click", (e) => {
  e.preventDefault();
  if (cloudinaryURL) guardarEnMongo();
});

// --- UI NAV ---
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");
if (logo && navs) {
  logo.addEventListener("click", () => {
    logo.classList.toggle("rotado");
    navs.classList.toggle("navhiden");
    navigator.vibrate?.(200);
  });
}
