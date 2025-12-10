// -----------------------------
// ELEMENTOS DEL DOM
// -----------------------------
const divlog = document.getElementById("loged");
const btnLog = document.getElementById("btnLogAdmins");
const titular = document.getElementById("titular");
const btnPANadmins = document.getElementById("btnLogAdmins");
const btnPerfil = document.getElementById("Mi_perfil");
const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");
const buscador = document.querySelector("#buscador");
const div_mesages = document.querySelector(".mensage");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const paginaActualSpan = document.getElementById("paginaActual");
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

// -----------------------------
// CONTROL DE SESIÓN
// -----------------------------
const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");

if (nombre_usuario) {
  titular.innerText = `Hola ${nombre_usuario}!`;
  titular.classList.remove("no-ver");

  if (adminpass === "true") btnPANadmins.classList.remove("no-ver");
  else btnPANadmins.classList.add("no-ver");
} else {
  titular.classList.add("no-ver");
  btnPANadmins.classList.add("no-ver");
}

btnPerfil.addEventListener("click", () => {
  window.location.href = "./area de prefiles/Mi_perfil.html";
});
btnLog.addEventListener("click", () => {
  window.location.href = "./admins.html";
});

// -----------------------------
// VARIABLES DE PAGINACIÓN
// -----------------------------
let globalArchivos = [];
let currentPage = 1;
let totalPages = 1;
const limit = 8; // elementos por página

// -----------------------------
// CARGAR DESDE MONGO
// -----------------------------
async function cargarDesdeMongo(page = 1, limit = 8) {
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Error " + res.status);
    const resultado = await res.json();
    globalArchivos = resultado.data;
    totalPages = resultado.totalPages;
    currentPage = resultado.page;
    return resultado.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// -----------------------------
// FUNCIONES DE RENDER
// -----------------------------
function cargarimagenes(cosas) {
  fotos.innerHTML = "";
  cosas.forEach(nombre => {
    const descripcion = nombre.mimidesk || "sin descripcion";
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <h3 class="producto-titulo">${nombre.nombre}</h3>
      <img class="la-imagen" id="${nombre.id || nombre._id}" src="${nombre.ub}" alt="${nombre.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${nombre.por}</p></li>
          <li><p>Categoría: ${nombre.categ}</p></li>
          <li><p>Descripcion: ${descripcion}</p></li>
          <li><p>id: "${nombre.id || nombre._id}"</p></li>
        </ul>
      </div>
      <div class="desc-soli">
        <button class="descargarBtn" id="${nombre.id || nombre._id}">Descargar</button>
      </div>
    `;
    fotos.appendChild(div);
  });
  actualizarBotonesDescargar();
  actualizarVisualizador();
  actualizarPaginaActual();
}

function actualizarBotonesDescargar() {
  const botones = document.querySelectorAll(".descargarBtn");
  botones.forEach(boton => boton.addEventListener("click", download));
}

function actualizarVisualizador() {
  const visualizar = document.querySelectorAll(".la-imagen");
  visualizar.forEach(img => img.addEventListener("click", noSeXd));
}

function actualizarPaginaActual() {
  if (paginaActualSpan) {
    paginaActualSpan.textContent = `Página ${currentPage} de ${totalPages}`;
  }
}

// -----------------------------
// DESCARGA DE IMÁGENES
// -----------------------------
async function download(e) {
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === idboton || item.id === Number(idboton));
  if (!archivo) return console.warn("Archivo no encontrado:", idboton);

  const res = await fetch(archivo.ub);
  const blob = await res.blob();
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = archivo.nombre + "_AKRestudiosGallery.jpg";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

// -----------------------------
// FILTRO Y BUSCADOR
// -----------------------------
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;

  let filtrados = globalArchivos;

  if (tipoBusqueda === "nombre") filtrados = globalArchivos.filter(i => i.nombre.toLowerCase().includes(texto));
  else if (tipoBusqueda === "por") filtrados = globalArchivos.filter(i => i.por.toLowerCase().includes(texto));
  else {
    filtrados = globalArchivos.filter(i => {
      const categs = Array.isArray(i.categ) ? i.categ.map(c => c.toLowerCase()) : [String(i.categ).toLowerCase()];
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

// -----------------------------
// VISUALIZAR IMAGENES AL CLIC
// -----------------------------
function noSeXd(e) {
  const estafoto = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === estafoto || item.id === Number(estafoto));
  if (!archivo) return;
  cats.value = "nombre";
  buscador.value = archivo.nombre;
  filtrarYMostrar();
}

// -----------------------------
// INICIALIZACIÓN Y PAGINACIÓN
// -----------------------------
async function init(page = 1) {
  const archivos = await cargarDesdeMongo(page, limit);
  cargarimagenes(archivos);
}

btnPrev.addEventListener("click", async () => {
  if (currentPage > 1) await init(currentPage - 1);
});

btnNext.addEventListener("click", async () => {
  if (currentPage < totalPages) await init(currentPage + 1);
});

// -----------------------------
// NAV Y LOGO
// -----------------------------
logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate?.(200);
});

// -----------------------------
// SCROLLREVEAL
// -----------------------------
ScrollReveal().reveal('.imagen', { delay: 700, reset: true });

// -----------------------------
// INICIO
// -----------------------------
init();
