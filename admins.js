import { archivos } from "./bd3";

// ===============================
// --- VERIFICACIÓN DE ADMIN ---
const adminpass = localStorage.getItem("adminpass") === "true";
if (!adminpass) {
  alert("No tienes permisos para acceder a esta página.");
  window.location.href = "./index.html";
}

// ===============================
// --- ELEMENTOS DEL DOM ---
const botonPB = document.getElementById("panel_de_borrado");
const botonPersonas = document.getElementById("panel_de_admins");

const fotos = document.getElementById("imagenes-contenedor");
const personas = document.querySelector(".lista-personas");
const buscador = document.getElementById("buscador");
const cats = document.getElementById("cats");
const show = document.getElementById("show");

// ===============================
// --- VARIABLES GLOBALES ---
let globalArchivos = [];
let paginaActual = 1;
const limite = 10;
let totalPaginas = 1;

// ===============================
// --- UI NAV ---
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate?.(200);
});

// ===============================
// --- FUNCIONES GENERALES ---
function hideAll() {
  fotos.classList.add("no-ver");
  personas.classList.add("no-ver");
}

// ===============================
// --- PANEL BOTONES ---
botonPB.addEventListener("click", () => {
  hideAll();
  fotos.classList.remove("no-ver");
  cargarImagenesPaginadas(paginaActual);
});

botonPersonas.addEventListener("click", () => {
  hideAll();
  personas.classList.remove("no-ver");
  cargarAdmins();
});

// ===============================
// --- CARGAR IMÁGENES DESDE MONGO ---
async function cargarDesdeMongo() {
  const res = await fetch(`/api/db?page=${paginaActual}&limit=${limite}`);
  const data = await res.json();
  globalArchivos = data.data;
  totalPaginas = data.totalPages;
  return data;
}

// ===============================
// --- RENDER IMÁGENES ---
function renderizarImagenes(archivos) {
  fotos.innerHTML = "";
  archivos.forEach(a => {
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <img class="la-imagen" src="${a.ub}" alt="${a.nombre}" />
      <div class="detalles">
        <ul>
          <li>Por/De: ${a.por}</li>
          <li>Categoría: ${a.categ}</li>
          <li>id: ${a.id}</li>
        </ul>
        <h3 class="producto-titulo">${a.nombre}</h3>
        <button class="descargarBtn" data-id="${a._id}">ELIMINAR</button>
      </div>
    `;
    fotos.appendChild(div);
  });
  vincularBotonesEliminar();
  renderizarPaginacion();
}

// ===============================
// --- VINCULAR BOTONES ELIMINAR ---
function vincularBotonesEliminar() {
  document.querySelectorAll(".descargarBtn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      const archivo = globalArchivos.find(a => a._id === id);
      if (!archivo) return;
      if (!confirm(`¿Eliminar "${archivo.nombre}"?`)) return;

      await fetch(`/api/db?_id=${id}`, { method: "DELETE" });
      cargarImagenesPaginadas(paginaActual);
    });
  });
}

// ===============================
// --- FILTRADO
// ===============================
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;

  let filtrados = globalArchivos;
  if (tipoBusqueda === "nombre") filtrados = globalArchivos.filter(a => a.nombre.toLowerCase().includes(texto));
  else if (tipoBusqueda === "por") filtrados = globalArchivos.filter(a => a.por.toLowerCase().includes(texto));
  else filtrados = globalArchivos.filter(a => String(a.categ).toLowerCase() === tipoBusqueda.toLowerCase());

  if (filtrados.length === 0) {
    show.classList.remove("no-ver");
    show.innerText = `NO HAY RESULTADOS PARA "${buscador.value.toUpperCase()}"`;
  } else show.classList.add("no-ver");

  renderizarImagenes(filtrados);
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// ===============================
// --- CARGAR CATEGORÍAS
// ===============================
function loadCats(categorias) {
  cats.innerHTML = `<option value="nombre">name</option><option value="por">contribuidor</option>`;
  categorias.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    cats.appendChild(opt);
  });
}

// ===============================
// --- PAGINACIÓN ---
function renderizarPaginacion() {
  const cont = document.getElementById("paginacion") || document.createElement("div");
  cont.id = "paginacion";
  cont.innerHTML = "";
  fotos.after(cont);

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.disabled = i === paginaActual;
    btn.addEventListener("click", () => {
      paginaActual = i;
      cargarImagenesPaginadas(paginaActual);
    });
    cont.appendChild(btn);
  }
}

async function cargarImagenesPaginadas(pagina = 1) {
  paginaActual = pagina;
  const data = await cargarDesdeMongo();
  renderizarImagenes(data.data);
}

// ===============================
// --- PANEL ADMIN ---
async function cargarAdmins() {
  const res = await fetch("/api/personas");
  const globalAdmins = await res.json();
  renderizarPersonas(globalAdmins);
}

function renderizarPersonas(admins) {
  personas.innerHTML = "";
  admins.forEach(admin => {
    const div = document.createElement("div");
    div.classList.add("persona");
    div.innerHTML = `
      <h3>Nombre del usuario: ${admin.admin}</h3>
      <h3>Admin pass: <span>${admin.adminpass}</span></h3>
      <div class="jaiba">
        <button class="almeja eliminar" id="${admin._id}">ELIMINAR</button>
        <button class="almeja get-up" id="${admin._id}">Give admin</button>
        <button class="almeja get-down" id="${admin._id}">Remove admin</button>
      </div>
    `;
    personas.appendChild(div);
  });
  vincularBotonesAdmins();
}

function vincularBotonesAdmins() {
  // Eliminar
  document.querySelectorAll(".eliminar").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.id;
      if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
      await fetch("/api/personas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      cargarAdmins();
    });
  });

  // Dar admin
  document.querySelectorAll(".get-up").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.id;
      await fetch("/api/personas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminpass: true })
      });
      cargarAdmins();
    });
  });

  // Quitar admin
  document.querySelectorAll(".get-down").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.id;
      await fetch("/api/personas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminpass: false })
      });
      cargarAdmins();
    });
  });
}

// ===============================
// --- INICIALIZACIÓN
// ===============================
(async function init() {
  await cargarImagenesPaginadas(paginaActual);

  const archivosInit = await cargarDesdeMongo();
  const catsUnicos = [...new Set(archivosInit.data.map(a => a.categ))];
  loadCats(catsUnicos);

  cargarAdmins();
})();
