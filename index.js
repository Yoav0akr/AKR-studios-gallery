// ==============================
//  ELEMENTOS DOM
// ==============================
const divlog = document.getElementById("loged");
const btnLog = document.getElementById("btnLogAdmins");
const titular = document.getElementById("titular");
const btnPANadmins = document.getElementById("btnLogAdmins");
const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");
const buscador = document.querySelector("#buscador");
const div_mesages = document.querySelector(".mensage");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const paginaActual = document.getElementById("paginaActual");

// ==============================
//  CONTROL DE SESIÓN
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
//  EVENTOS BOTONES
// ==============================
document.getElementById("Mi_perfil").addEventListener("click", () => {
  window.location.href = "./area de prefiles/Mi_perfil.html";
});

btnLog.addEventListener("click", () => {
  window.location.href = "./admins.html";
});

// ==============================
//  GLOBAL
// ==============================
let globalArchivos = [];
window.currentPage = 1;
window.totalPages = 1;

// ==============================
//  CARGAR DATOS DESDE API
// ==============================
async function cargarDesdeMongo(page = 1, limit = 20) {
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Error " + res.status);
    const resultado = await res.json();

    globalArchivos = resultado.data;
    window.totalPages = resultado.totalPages;
    window.currentPage = resultado.page;

    return resultado.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ==============================
//  RENDER DE IMÁGENES
// ==============================
function cargarimagenes(cosas) {
  fotos.innerHTML = "";
  cosas.forEach(nombre => {
    const div = document.createElement("div");
    const descripcion = nombre.mimidesk || "sin descripcion";

    div.classList.add("imagen");
    div.innerHTML = `
      <h3 class="producto-titulo">${nombre.nombre}</h3>
      <img class="la-imagen" id="${nombre.id}" src="${nombre.ub}" alt="${nombre.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${nombre.por}</p></li>
          <li><p>Categoría: ${nombre.categ.join(", ")}</p></li>
          <li><p>Descripción: ${descripcion}</p></li>
          <li><p>id: "${nombre.id}"</p></li>
        </ul>
      </div>
      <div class="desc-soli">
        <button class="descargarBtn" id="${nombre.id}">Descargar</button>
      </div>
    `;
    fotos.append(div);
  });

  actualizarBotonesDescargar();
  actualizarVisualizacion();
}

// ==============================
//  DESCARGA DE IMÁGENES
// ==============================
async function download(e) {
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item.id === Number(idboton));
  if (!archivo) return console.warn("Archivo no encontrado:", idboton);

  const res = await fetch(archivo.ub);
  const blob = await res.blob();

  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.target = "_blank";
  enlace.download = archivo.nombre + "_AKRestudiosGallery.jpg";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

// ==============================
//  VISUALIZACIÓN DE IMAGEN
// ==============================
function actualizarVisualizacion() {
  const visualizar = document.querySelectorAll(".la-imagen");
  visualizar.forEach(boton => {
    boton.addEventListener("click", (e) => {
      const estafoto = Number(e.currentTarget.id);
      const archivo = globalArchivos.find(item => item.id === estafoto);
      if (!archivo) return;
      cats.value = "nombre";
      buscador.value = archivo.nombre;
      filtrarYMostrar();
    });
  });
}

// ==============================
//  BOTONES DESCARGAR
// ==============================
function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", download);
  });
}

// ==============================
//  FILTRADO
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
//  PAGINACIÓN
// ==============================
btnPrev.addEventListener("click", async () => {
  if (window.currentPage > 1) await init(window.currentPage - 1);
  window.location.href = "./index.html";
});

btnNext.addEventListener("click", async () => {
  if (window.currentPage < window.totalPages) await init(window.currentPage + 1);
  window.location.href = "./index.html";
});

// ==============================
//  INICIALIZACIÓN
// ==============================
async function init(page = 1) {
  await cargarDesdeMongo(page);
  cargarimagenes(globalArchivos);
  paginaActual.textContent = `Página ${window.currentPage} de ${window.totalPages}`;
}

// ==============================
//  NAVBAR LOGO
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});

ScrollReveal().reveal('.imagen', { delay: 700, reset: true });

// ==============================
//  INICIAR
// ==============================
init();
