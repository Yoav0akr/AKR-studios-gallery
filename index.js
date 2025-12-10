// ======================
// ELEMENTOS DEL DOM
// ======================
const divlog = document.getElementById("loged");
const btnLog = document.getElementById("btnLogAdmins");
const titular = document.getElementById("titular");
const btnPerfil = document.getElementById("Mi_perfil");
const fotos = document.getElementById("imagenes-contenedor");
const cats = document.getElementById("cats");
const buscador = document.getElementById("buscador");
const div_mesages = document.querySelector(".mensage");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const paginaActual = document.getElementById("paginaActual");

// ======================
// SESIÓN DE USUARIO
// ======================
const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");

if (nombre_usuario) {
  titular.innerText = `Hola ${nombre_usuario}!`;
  titular.classList.remove("no-ver");
  if (adminpass === "true") {
    btnLog.classList.remove("no-ver");
  } else {
    btnLog.classList.add("no-ver");
  }
} else {
  titular.classList.add("no-ver");
  btnLog.classList.add("no-ver");
}

btnPerfil?.addEventListener("click", () => {
  window.location.href = "./area de prefiles/Mi_perfil.html";
});

btnLog?.addEventListener("click", () => {
  window.location.href = "./admins.html";
});

// ======================
// VARIABLES GLOBALES
// ======================
let globalArchivos = [];
let currentPage = 1;
let totalPages = 1;
const LIMIT = 20;

// ======================
// FUNCIONES DE PAGINACIÓN Y CARGA
// ======================
async function cargarDesdeMongo(page = 1, limit = LIMIT) {
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Error " + res.status);
    const resultado = await res.json();

    globalArchivos = resultado.data;
    currentPage = resultado.page;
    totalPages = resultado.totalPages;

    actualizarPaginador();
    return resultado.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

function actualizarPaginador() {
  if (paginaActual) paginaActual.textContent = `Página ${currentPage} de ${totalPages}`;
  btnPrev.disabled = currentPage <= 1;
  btnNext.disabled = currentPage >= totalPages;
}

// ======================
// RENDERIZADO DE IMÁGENES
// ======================
function cargarimagenes(cosas) {
  fotos.innerHTML = "";
  cosas.forEach(item => {
    const div = document.createElement("div");
    const descripcion = item.mimidesk || "Sin descripción";

    div.classList.add("imagen");
    div.innerHTML = `
      <h3 class="producto-titulo">${item.nombre}</h3>
      <img class="la-imagen" id="${item.id}" src="${item.ub}" alt="${item.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${item.por}</p></li>
          <li><p>Categoría: ${item.categ.join(", ")}</p></li>
          <li><p>Descripción: ${descripcion}</p></li>
          <li><p>id: "${item.id}"</p></li>
        </ul>
      </div>
      <div class="desc-soli">
        <button class="descargarBtn" id="${item.id}">Descargar</button>
      </div>
    `;
    fotos.appendChild(div);
  });
  actualizarBotonesDescargar();
  actualizarVisualizador();
}

// ======================
// DESCARGAR IMÁGENES
// ======================
function actualizarBotonesDescargar() {
  const botones = document.querySelectorAll(".descargarBtn");
  botones.forEach(boton => {
    boton.addEventListener("click", async e => {
      const id = e.currentTarget.id;
      const archivo = globalArchivos.find(a => a.id === Number(id));
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

// ======================
// VISUALIZAR IMÁGENES
// ======================
function actualizarVisualizador() {
  const imgs = document.querySelectorAll(".la-imagen");
  imgs.forEach(img => {
    img.addEventListener("click", e => {
      const id = Number(e.currentTarget.id);
      const archivo = globalArchivos.find(a => a.id === id);
      if (!archivo) return;
      buscador.value = archivo.nombre;
      cats.value = "nombre";
      filtrarYMostrar();
    });
  });
}

// ======================
// FILTRADO
// ======================
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipo = cats.value;
  let filtrados = globalArchivos;

  if (tipo === "nombre") {
    filtrados = globalArchivos.filter(i => i.nombre.toLowerCase().includes(texto));
  } else if (tipo === "por") {
    filtrados = globalArchivos.filter(i => i.por.toLowerCase().includes(texto));
  } else {
    filtrados = globalArchivos.filter(i => i.categ.map(c => c.toLowerCase()).includes(tipo.toLowerCase()));
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

// ======================
// BOTONES DE PAGINACIÓN
// ======================
btnPrev?.addEventListener("click", async () => {
  if (currentPage > 1) await init(currentPage - 1);
});

btnNext?.addEventListener("click", async () => {
  if (currentPage < totalPages) await init(currentPage + 1);
});

// ======================
// INICIALIZACIÓN
// ======================
async function init(page = 1) {
  const archivos = await cargarDesdeMongo(page);
  cargarimagenes(archivos);
}
init();

// ======================
// LOGO / NAVBAR ROTAR
// ======================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo?.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate?.(200);
});

ScrollReveal().reveal('.imagen', { delay: 700, reset: true });
