// Función para llamar los archivos
async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/db", { method: "GET" });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const archivitos = await res.json();
    console.log("Cargado correctamente:", archivitos.length, "documentos");
    // alert("Se ha cargado correctamente"); // opcional

    return archivitos;
  } catch (err) {
    console.error("Error al cargar desde Mongo:", err);
    // alert("No se pudo cargar. Revisa la consola."); // opcional
    return [];
  }
}

const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");
const buscador = document.querySelector("#buscador");

// Función para renderizar imágenes
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
        <button class="descargarBtn" id="${nombre.id || nombre._id}">Descargar</button>
      </div>
    `;
    fotos.append(div);
  });
  actualizarBotonesDescargar();
}

// Categorías
function loadCats(categorias) {
  cats.innerHTML = `<option value="nombre">name</option><option value="por">contribuidor</option>`;
  categorias.forEach(categ => {
    const option = document.createElement("option");
    option.value = categ;
    option.innerHTML = categ;
    cats.append(option);
  });
}

// Descarga
function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", download);
  });
}

function download(e) {
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === idboton || item.id === Number(idboton));

  if (!archivo) return console.warn("Archivo no encontrado para el botón:", idboton);



 let laurl = archivo.ub;
  if (laurl.includes("res.cloudinary.com")) {
    const separador = laurl.includes("?") ? "&" : "?";
    laurl = `${laurl}${separador}fl_attachment=${encodeURIComponent(archivo.nombre || "archivo")}`;
  }



  const enlace = document.createElement("a");
  enlace.href = laurl;
  enlace.target= "_blank"
  enlace.download = archivo.nombre||"archivo";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

// Filtrado
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
      const categ = Array.isArray(item.categ) ? item.categ.map(c => c.toLowerCase()) : [String(item.categ).toLowerCase()];
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

// Inicialización
let globalArchivos = [];

(async function init() {
  globalArchivos = await cargarDesdeMongo();
  console.log("Datos cargados de Mongo:", globalArchivos);

  if (!globalArchivos || globalArchivos.length === 0) {
    fotos.innerHTML = `<p id="noRES">SI VES ESTE MENSAJE CAMBIA DE PC O CONECTATE BIEN A INTERNET PUT@.</p>`;
    return;
  }

  const Cats_Cconcentrado = [...new Set(globalArchivos.map(doc => doc.categ).flat())];
  loadCats(Cats_Cconcentrado);
  cargarimagenes(globalArchivos);
})();
