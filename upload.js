// === upload.js ===


// Variables del formulario
const EntradaNombre = document.getElementById("nombre_imput");
const EentradaDeparte = document.getElementById("por-imput");
const EntradaCategs = document.querySelector("#categs");
const EntradaGuardar = document.querySelector("#manchego");
const Entradadesc = document.querySelector("#mimidesk");

//auto llenado del nombre del admin que sube la imagen
const adminpass = localStorage.getItem('adminpass');
const usuario = localStorage.getItem('admin');
const email_user = localStorage.getItem('email');
//se auto llena el nombre del usuario en el input y se deshabilita
    EentradaDeparte.value = usuario;
    EentradaDeparte.enabled = false;


// Div visualizador
const visualisador = document.querySelector(".visualizador");

// URL de Cloudinary que se usará después para enviar a Mongo
let cloudinaryURL = null;

// --- MANEJO DEL VISUALISADOR ---
if (visualisador) {
  visualisador.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*"; // ✅ Solo imágenes
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      console.log("📂 Archivo seleccionado:", file.name);

      // ===== LIMITE DE 20MB =====
      const maxSizeMB = 20;
      const maxBytes = maxSizeMB * 1024 * 1024;

      if (file.size > maxBytes) {
        alert(
          `❌ El archivo pesa demasiado.\n\nMáximo: ${maxSizeMB} MB\nActual: ${(file.size / 1024 / 1024).toFixed(2)} MB`
        );
        return;
      }

      // ===== PREVIEW LOCAL =====
      const localURL = URL.createObjectURL(file);
      visualisador.style.backgroundImage = `url(${localURL})`;
      visualisador.style.backgroundSize = "cover";
      visualisador.style.backgroundPosition = "center";

      // Elimina cualquier video antiguo (por si acaso)
      Array.from(visualisador.querySelectorAll("video")).forEach(v => v.remove());

      // Deja el <p> visible arriba
      const p = visualisador.querySelector("p");
      if (p) {
        p.style.position = "relative";
        p.style.zIndex = "1";
      }

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
  const email_result = email_user || "null";
  const data = { id: Date.now(), nombre, ub: url, por, categ, mimidesk, email: email_result };

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
