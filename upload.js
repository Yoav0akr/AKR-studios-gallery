const EntradaNombre = document.getElementById("nombre_imput");
const EentradaDeparte = document.getElementById("por-imput");
const EntradaCategs = document.querySelector("#categs");
const EntradaGuardar = document.querySelector("#manchego");

function queso() {
  const texto = EntradaCategs.value.toLowerCase().trim();
  const array = texto.split(/\s+/);

  const nombre = EntradaNombre.value.trim();
  const por = EentradaDeparte.value.trim();
  const url = null; // si luego usas Cloudinary, reemplaza con la URL

  guardarEnMongo(nombre, url, por, array);
}

EntradaGuardar.addEventListener("click", queso);

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
