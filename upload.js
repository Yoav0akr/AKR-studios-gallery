

const  EntradaNombre = document.getElementById("nombre_imput");
const EentradaDeparte = document.getElementById("por-imput");
const EntradaCategs = document.querySelector("#categs");
const EntradaGuardar = document.querySelector("#manchego")
  function queso() {
    const texto = EntradaCategs.value.toLowerCase().trim();
    const array = texto.trim().split(/\s+/);
    guardarEnMongo(EntradaNombre,"null",EentradaDeparte,array)
}

EntradaGuardar.addEventListener("click", queso)

async function guardarEnMongo(nombre, url, por, categ) {
  const data = {
    id: Date.now(), // ID único temporal
    nombre,
    ub: url,        // URL que obtienes de Cloudinary
    por,
    categ
  };

  const res = await fetch("./api/db.js", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const saved = await res.json();
  console.log("Guardado en Mongo:", saved);
  alert("se ha guardado")

}

