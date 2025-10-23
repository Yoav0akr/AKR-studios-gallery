//import { archivos } from './bd.js';


// Función para llamar los archivos (tu lógica original)
async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/db", {method: "GET" });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const archivitos = await res.json();
console.log("Cargado correctamente:", archivitos.length, "documentos");    alert("Se ha cargado correctamente");

    return archivitos;
  } catch (err) {
    console.error("Error al cargar desde Mongo:", err);
    alert("No se pudo cargar. Revisa la consola.");
    return [];
  }
}


const archivitos = await cargarDesdeMongo()


const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");

//cludinary
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/galeria.json`;

function cargarimagenes(cosas) {
  fotos.innerHTML = "";
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
        <button class="descargarBtn" id="${nombre.id}">Descargar</button>
      </div>
    `;
    fotos.append(div);
  });
  actualizarBotonesDescargar();
}

// ======== CATEGORÍAS =========
function loadCats(categorias) {
  cats.innerHTML = `<option value="nombre">name</option><option value="por">contribuidor</option>`;
  categorias.forEach(categ => {
    const option = document.createElement("option");
    option.value = categ;
    option.innerHTML = categ;
    cats.append(option);
  });
}

// ======== DESCARGA =========
function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", download);
  });
}

function download(e) {
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === idboton || item.id === Number(idboton));

  if (!archivo) {
    console.warn("Archivo no encontrado para el botón:", idboton);
    return;
  }

  const enlace = document.createElement("a");
  enlace.href = archivo.ub;
  enlace.download = archivo.nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

// ======== FILTRADO =========
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;
  let filtrados = globalArchivos;

  if (tipoBusqueda === "nombre") {
    filtrados = globalArchivos.filter(item =>
      item.nombre.toLowerCase().includes(texto)
    );
  } else if (tipoBusqueda === "por") {
    filtrados = globalArchivos.filter(item =>
      item.por.toLowerCase().includes(texto)
    );
  } else {
    buscador.value = "";
    filtrados = globalArchivos.filter(item => {
      const categ = Array.isArray(item.categ)
        ? item.categ.map(c => c.toLowerCase())
        : [String(item.categ).toLowerCase()];
      return categ.includes(tipoBusqueda);
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

// ======== INICIALIZACIÓN =========
let globalArchivos = [];

(async function init() {
  globalArchivos = await cargarDesdeMongo();

  if (!globalArchivos || globalArchivos.length === 0) {
    fotos.innerHTML = "<p>No hay imágenes disponibles.</p>";
    return;
  }

  const Cats_Cconcentrado = [...new Set(globalArchivos.map(doc => doc.categ))];
  loadCats(Cats_Cconcentrado);
  cargarimagenes(globalArchivos);
})();