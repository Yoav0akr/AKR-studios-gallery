// === upload.js ===
// Controla la subida de imágenes desde upload.html

document.addEventListener("DOMContentLoaded", () => {
  const visualisador = document.querySelector(".visualizador");

  if (!visualisador) {
    console.warn("⚠️ No se encontró el div #visualisador en el HTML.");
    return;
  }

  visualisador.addEventListener("click", () => {
    // Crear input para elegir archivo
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
        // Llamar al endpoint serverless /api/upload
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.url) {
          console.log("✅ Imagen subida con éxito:", data.url);

          // Aquí llamas tu función original de Mongo
          guardarenmongo(data.url); // <-- sigue usando tu versión existente
        } else {
          console.error("❌ Error al subir imagen:", data.error);
          alert("Error al subir imagen: " + data.error);
        }
      } catch (err) {
        console.error("⚠️ Error de conexión o servidor:", err);
        alert("Error de conexión con el servidor.");
      }
    };
  });
});

