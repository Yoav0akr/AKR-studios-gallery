// ==============================
// ELEMENTOS DEL DOM
// ==============================
const divlog = document.getElementById("loged");
const btnLog = document.getElementById("btnLogAdmins");
const titular = document.getElementById("titular");
const btnPANadmins = document.getElementById("btnLogAdmins");
const btnPerfil = document.getElementById("Mi_perfil");

const fotos = document.getElementById("imagenes-contenedor");
const cats = document.getElementById("cats");
const buscador = document.getElementById("buscador");
const div_mesages = document.querySelector(".mensage");
const paginaActual = document.getElementById("paginaActual");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");

// ==============================
// CONTROL DE SESIÓN
// ==============================
const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");

if (nombre_usuario) {
  titular.innerText = ` Hola ${nombre_usuario}!`;
  titular.classList.remove("no-ver");

  if (adminpass === "true") {
    btnPANadmins.classList.remove("no-ver");
  } else {
    btnPANadmins.classList.add("no-ver");
  }
} else {
  titular.classList.add("no-ver");
  btnPANadmins.classList.add("no-ver");
}

// ==============================
// EVENTOS DE BOTONES
// ==============================
btnPerfil.addEventListener("click", () => {
  window.location.href = "./area de prefiles/Mi_perfil.html";
});

btnLog.addEventListener("click", () => {
  window.location.href = "./admins.html";
});

// ==============================
// VARIABLES GLOBALES
// ==============================
let globalArchivos = [];
window.currentPage = 1;
window.totalPages = 1;
const limit = 20;

// ==============================
// FUNCIONES PARA CARGAR DATOS
// ==============================
async function cargarDesdeMongo(page = 1, limit = 20) {
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Error " + res.status);

    const resultado = await res.json();
    globalArchivos = resultado.data;

    window.totalPages = resultado.totalPages || 1;
    window.currentPage = resultado.page || 1;

    return resultado.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ==============================
// FUNCIONES DE RENDER
// ==============================
function cargarimagenes(cosas) {
  fotos.innerHTML = "";
  cosas.forEach(item => {
    const descripcion = item.mimidesk || "sin descripcion";
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <h3 class="producto-titulo">${item.nombre}</h3>
      <img class="la-imagen" id="${item.id}" src="${item.ub}" alt="${item.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${item.por}</p></li>
          <li><p>Categoría: ${item.categ}</p></li>
          <li><p>Descripción: ${descripcion}</p></li>
          <li><p>id: ${item.id}</p></li>
        </ul>
      </div>
      <div class="desc-soli">
        <button class="descargarBtn" id="${item.id}">Descargar</button>
      </div>
    `;
    fotos.appendChild(div);
  });

  actualizarBotonesDescargar();
}

// ==============================
// DESCARGA DE IMÁGENES
// ==============================
function actualizarBotonesDescargar() {
  const botones = document.querySelectorAll(".descargarBtn");
  botones.forEach(boton => {
    boton.addEventListener("click", async (e) => {
      const idboton = e.currentTarget.id;
      const archivo = globalArchivos.find(item => item.id == idboton);
      if (!archivo) return;

      const res = await fetch(archivo.ub);
      const blob = await res.blob();

      const enlace = document.createElement("a");
      enlace.href = URL.createObjectURL(blob);
      enlace.download = `${archivo.nombre}_AKRestudiosGallery.jpg`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
    });
  });
}

// ==============================
// FILTRADO
// ==============================
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;

  let filtrados = globalArchivos;

  if (tipoBusqueda === "nombre") {
    filtrados = globalArchivos.filter(item => item.nombre.toLowerCase().includes(texto));
  } else if (tipoBusqueda === "por") {
    filtrados = globalArchivos.filter(item => item.por.toLowerCase().includes(texto));
  } else {
    filtrados = globalArchivos.filter(item => {
      const categs = Array.isArray(item.categ) ? item.categ.map(c => c.toLowerCase()) : [String(item.categ).toLowerCase()];
      return categs.includes(tipoBusqueda.toLowerCase());
    });
  }

  if (filtrados.length === 0) {
    div_mesages.classList.remove("no-ver");
    div_mesages.innerText = `NO HAY RESULTADOS PARA "${buscador.value.toUpperCase()}"`;
  } else {
    div_mesages.classList.add("no-ver");
  }

  cargarimagenes(filtrados);
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// ==============================
// PAGINACIÓN
// ==============================
async function init(page = 1) {
  await cargarDesdeMongo(page);
  cargarimagenes(globalArchivos);

  // Actualizar estado de botones
  paginaActual.textContent = `Página ${window.currentPage} de ${window.totalPages}`;
  btnPrev.disabled = window.currentPage <= 1;
  btnNext.disabled = window.currentPage >= window.totalPages;
}

btnPrev.addEventListener("click", () => {
  if (window.currentPage > 1) init(window.currentPage - 1);
});

btnNext.addEventListener("click", () => {
  if (window.currentPage < window.totalPages) init(window.currentPage + 1);
});

// ==============================
// INICIALIZACIÓN
// ==============================
init();
