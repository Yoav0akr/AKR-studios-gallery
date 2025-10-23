// === upload.js ===
// Controla la subida de imágenes + guardado en MongoDB desde tu formulario

// Variables del formulario
const EntradaNombre = document.getElementById("nombre_imput");
const EentradaDeparte = document.getElementById("por-imput");
const EntradaCategs = document.querySelector("#categs");
const EntradaGuardar = document.querySelector("#manchego");

// Div visualizador
const visualisador = document.querySelector(".visualizador");

// Variable global para almacenar la URL de Cloudinary
let cloudinaryURL = null;

// Manejo del clic en el div visualisador
if (visualisador) {
  visualisador.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      console.log("📂 Archivo seleccionado:", file.name);

      const formData = new FormData();
      formData.append("file", file);

      try {
        // Enviar archivo al endpoint serverless /api/upload
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.url) {
          console.log("✅ Imagen subida a Cloudinary:", data.url);
          cloudinaryURL = data.url;

          // Opcional: mostrar miniatura en el div visualizador
          visualisador.style.backgroundImage = `url(${cloudinaryURL})`;
          visualisador.style.backgroundSize = "cover";
          visualisador.style.backgroundPosition = "center";
        } else {
          console.error("❌ Error al subir imagen:", data.error);
          alert("Error al subir imagen: " + data.error);
        }
      } catch (err) {
        console.error("⚠️ Error de conexión con el servidor:", err);
        alert("Error de conexión con el servidor.");
      }
    };
  });
} else {
  console.warn("⚠️ No se encontró el div #visualisador en el HTML.");
}

// Función que se ejecuta al hacer click en el botón de guardar
function queso() {
  const texto = EntradaCategs.value.toLowerCase().trim();
  const array = texto.split(/\s+/);

  const nombre = EntradaNombre.value.trim();
  const por = EentradaDeparte.value.trim();
  const url = cloudinaryURL; // toma la URL subida a Cloudinary

  if (!url) {
    alert("Primero sube una imagen antes de guardar.");
    return;
  }

  guardarEnMongo(nombre, url, por, array);
}

// Evento del botón de guardar
EntradaGuardar.addEventListener("click", queso);

// Función para guardar en MongoDB (tu lógica original)
async function guardarEnMongo(nombre, url, por, categ) {
  const data = { id: Date.now(), nombre, ub: url, por, categ };

  try {
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const saved = await res.json();
    console.log("Guardado en Mongo:", saved);
    alert("Se ha guardado correctamente");
  } catch (err) {
    console.error("Error al guardar en Mongo:", err);
    alert("No se pudo guardar. Revisa la consola.");
  }
}
