// ==============================
//  ELEMENTOS DOM
// ==============================
const titular = document.getElementById("titular");
const btnPANadmins = document.getElementById("btnLogAdmins");
const btnLog = document.getElementById("btnLogAdmins");
const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const buscador = document.querySelector("#buscador");
const div_mesages = document.querySelector(".mensage");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const paginaActual = document.getElementById("paginaActual");
const show = document.getElementById("show");

// ==============================
//  SESIÓN
// ==============================
const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");

if (nombre_usuario) {
  titular.textContent = `Hola ${nombre_usuario}!`;
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
//  GLOBALES
// ==============================
let globalArchivos = [];
let currentPage = 1;
let totalPages = 1;
const LIMIT = 20;

// ==============================
//  API
// ==============================
async function cargarDesdeMongo(page = 1) {
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${LIMIT}`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    globalArchivos = data.data || [];
    currentPage = data.page;
    totalPages = data.totalPages;

    return globalArchivos;
  } catch (err) {
    console.error("Error Mongo:", err);
    return [];
  }
}

// ==============================
//  RENDER IMÁGENES
// ==============================
function cargarimagenes(lista) {
  fotos.innerHTML = "";

  if (lista.length === 0) {
    show.classList.remove("no-ver");
    show.textContent = "NO HAY IMÁGENES DISPONIBLES";
    return;
  }

  show.classList.add("no-ver");

  lista.forEach(item => {
    const div = document.createElement("div");
    const descripcion = item.mimidesk || "Sin descripción";

    div.className = "imagen";
    div.innerHTML = `
      <h3 class="producto-titulo">${item.nombre}</h3>
      <img class="la-imagen" src="${item.ub}" alt="${item.nombre}" />
      <div class="detalles">
        <ul>
          <li>Por: ${item.por}</li>
          <li>Categoría: ${(item.categ || []).join(", ")}</li>
          <li>${descripcion}</li>
        </ul>
      </div>
      <div class="desc-soli">
        <button class="descargarBtn">Descargar</button>
      </div>
    `;

    div.querySelector(".descargarBtn")
      .addEventListener("click", () => download(item));

    fotos.appendChild(div);
  });

  ScrollReveal().reveal(".imagen", { delay: 200, reset: true });
}

// ==============================
//  DESCARGA
// ==============================
async function download(archivo) {
  const res = await fetch(archivo.ub);
  const blob = await res.blob();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = archivo.nombre + "_AKR.jpg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==============================
//  CATEGORÍAS (FLATMAP + ASCII)
// ==============================
function renderCategorias(archivos) {
  const categorias = [
    ...new Set(
      archivos
        .flatMap(a => a.categ || [])
        .map(c => c.toLowerCase().trim())
        .filter(Boolean)
    )
  ].sort(); // ASCII

  categorias.forEach(cat => {
    const op = document.createElement("option");
    op.value = cat;
    op.textContent = cat;
    cats.appendChild(op);
  });
}

// ==============================
//  FILTRADO
// ==============================
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipo = cats.value;

  let filtrados = globalArchivos;

  if (tipo === "nombre") {
    filtrados = filtrados.filter(a =>
      a.nombre.toLowerCase().includes(texto)
    );
  } else if (tipo === "por") {
    filtrados = filtrados.filter(a =>
      a.por.toLowerCase().includes(texto)
    );
  } else {
    filtrados = filtrados.filter(a =>
      (a.categ || [])
        .map(c => c.toLowerCase())
        .includes(tipo)
    );
  }

  if (filtrados.length === 0) {
    div_mesages.classList.remove("no-ver");
    div_mesages.textContent = "NO HAY RESULTADOS";
  } else {
    div_mesages.classList.add("no-ver");
  }

  cargarimagenes(filtrados);
}

// ==============================
//  EVENTOS
// ==============================
buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

btnPrev.addEventListener("click", async () => {
  if (currentPage > 1) {
    await init(currentPage - 1);
  }
});

btnNext.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    await init(currentPage + 1);
  }
});

// ==============================
//  INIT
// ==============================
async function init(page = 1) {
  await cargarDesdeMongo(page);
  renderCategorias(globalArchivos);
  cargarimagenes(globalArchivos);
  paginaActual.textContent = `Página ${currentPage} de ${totalPages}`;
}

// ==============================
//  NAVBAR
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  if (navigator.vibrate) navigator.vibrate(200);
});

// ==============================
//  START
// ==============================
init();
