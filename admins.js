// === CARGAR DESDE MONGO ===
async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/db", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const archivitos = await res.json();
    console.log("Cargado correctamente:", archivitos.length, "documentos");
    return archivitos;
  } catch (err) {
    console.error("Error al cargar desde Mongo:", err);
    return [];
  }
}

// === ELEMENTOS HTML ===
const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");
const buscador = document.querySelector("#buscador");

// === RENDERIZAR IMÁGENES ===
function cargarimagenes(cosas) {
  fotos.innerHTML = ``;
  cosas.forEach(nombre => {
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <img class="la-imagen" src="${nombre.ub}" alt="${nombre.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${nombre.por}</p></li>
          <li><p>Categoría: ${nombre.categ}</p></li>
        </ul>
        <h3 class="producto-titulo">${nombre.nombre}</h3>
        <button class="descargarBtn" id="${nombre._id || nombre.id}">ELIMINAR</button>
      </div>
    `;
    fotos.append(div);
  });
  actualizarBotonesDescargar();
}

// === CARGAR CATEGORÍAS ===
function loadCats(categorias) {
  cats.innerHTML = `<option value="nombre">name</option><option value="por">contribuidor</option>`;
  categorias.forEach(categ => {
    const option = document.createElement("option");
    option.value = categ;
    option.innerHTML = categ;
    cats.append(option);
  });
}

// === VINCULAR BOTONES DE ELIMINAR ===
function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", eliminarArchivo);
  });
}

// === FUNCIÓN PRINCIPAL: ELIMINAR ARCHIVO ===
async function eliminarArchivo(e) {
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === idboton || item.id === Number(idboton));

  if (!archivo) {
    console.warn("Archivo no encontrado para el botón:", idboton);
    return;
  }

  const confirmar = confirm(`¿Seguro que deseas eliminar "${archivo.nombre}"?`);
  if (!confirmar) return;

  try {
    // 1️⃣ Intentar obtener el public_id desde la URL de Cloudinary
    const match = archivo.ub.match(/upload\/(?:v\d+\/)?(.+?)(\.[a-zA-Z0-9]+)?$/);
    const public_id = match ? match[1] : null;

    // 2️⃣ Eliminar de Cloudinary
    if (public_id) {
      const resCloud = await fetch(`/api/upload?public_id=${public_id}`, { method: "DELETE" });
      const dataCloud = await resCloud.json();

      if (!dataCloud.success) {
        console.warn("⚠️ No se eliminó de Cloudinary:", dataCloud.error || dataCloud);
      } else {
        console.log("🗑️ Eliminado de Cloudinary:", archivo.nombre);
      }
    } else {
      console.warn("⚠️ No se pudo obtener public_id de la URL:", archivo.ub);
    }

    // 3️⃣ Eliminar de MongoDB
    const resMongo = await fetch(`/api/db?_id=${archivo._id}`, { method: "DELETE" });
    const dataMongo = await resMongo.json();

    if (dataMongo.success) {
      alert(`✅ "${archivo.nombre}" eliminado correctamente.`);
      globalArchivos = globalArchivos.filter(item => item._id !== archivo._id);
      cargarimagenes(globalArchivos);
    } else {
      alert(`⚠️ No se pudo eliminar de MongoDB: ${dataMongo.error || "Error desconocido"}`);
    }
  } catch (error) {
    console.error("❌ Error eliminando archivo:", error);
    alert("Error al eliminar archivo. Revisa la consola para más detalles.");
  }
}

// === FILTRADO Y BÚSQUEDA ===
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;
  let filtrados = globalArchivos;

  if (tipoBusqueda === "nombre") {
    filtrados = globalArchivos.filter(item => item.nombre.toLowerCase().includes(texto));
  } else if (tipoBusqueda === "por") {
    filtrados = globalArchivos.filter(item => item.por.toLowerCase().includes(texto));
  } else {
    buscador.value = "";
    filtrados = globalArchivos.filter(item => {
      const categ = Array.isArray(item.categ)
        ? item.categ.map(c => c.toLowerCase())
        : [String(item.categ).toLowerCase()];
      return categ.includes(tipoBusqueda.toLowerCase());
    });
  }

  if (show) {
    if (filtrados.length === 0) {
      show.classList.remove("no-ver");
      show.innerText = `NO HAY RESULTADOS PARA "${buscador.value.toUpperCase()}"`;
    } else {
      show.classList.add("no-ver");
    }
  }

  cargarimagenes(filtrados);
  cats.value = tipoBusqueda;
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// === INICIALIZACIÓN ===
let globalArchivos = [];

(async function init() {
  globalArchivos = await cargarDesdeMongo();
  console.log("Datos cargados de Mongo:", globalArchivos);

  if (!globalArchivos || globalArchivos.length === 0) {
    const div = document.createElement("div");
    div.classList.add("noRES");
    div.innerHTML = `<p id="noRES">SI VES ESTE MENSAJE CAMBIA DE PC O CONECTATE BIEN A INTERNET PUT@.</p>`;
    fotos.append(div);
    return;
  }

  const Cats_Cconcentrado = [...new Set(globalArchivos.map(doc => doc.categ).flat())];
  loadCats(Cats_Cconcentrado);
  cargarimagenes(globalArchivos);
})();
