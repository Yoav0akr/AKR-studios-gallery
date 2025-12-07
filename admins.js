const adminpass = localStorage.getItem("adminpass") === "true";
if (!adminpass) {
  alert("No tienes permisos para acceder a esta página.");
  window.location.href = "./index.html";
}


// ===============================
// ELEMENTOS DEL DOM
// ===============================
const boton_solicitudes = document.getElementById("solicitudes");
const boton_PB = document.getElementById("panel_de_borrado");
const boton_personas = document.getElementById("panel_de_admins");

const fotos = document.getElementById("imagenes-contenedor");
const personas = document.querySelector(".lista-personas");
const divSOLIS = document.querySelector(".div-solicitudes");
const buscador = document.getElementById("buscador");
const cats = document.getElementById("cats");
const show = document.getElementById("show");

// ===============================
// FUNCIONES GENERALES
// ===============================
function hideAll() {
  fotos.classList.add("no-ver");
  personas.classList.add("no-ver");
  divSOLIS.classList.add("no-ver");
}

// para rotar el logo y desplegar/ocultar nav
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});

// ===============================
// PANELES
// ===============================
boton_PB.addEventListener("click", () => {
  hideAll();
  fotos.classList.remove("no-ver");
});

boton_solicitudes.addEventListener("click", () => {
  hideAll();
  divSOLIS.classList.remove("no-ver");
});

boton_personas.addEventListener("click", () => {
  hideAll();
  personas.classList.remove("no-ver");
});

// ===============================
// CARGAR IMÁGENES DESDE MONGO
// ===============================
let globalArchivos = [];

async function cargarDesdeMongo() {
  const res = await fetch("/api/db", { method: "GET" });
  const data = await res.json();
  globalArchivos = data;
  return data;
}

// ===============================
// RENDER IMÁGENES
// ===============================
function cargarImagenes(archivos) {
  fotos.innerHTML = "";
  archivos.forEach(a => {
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <img class="la-imagen" src="${a.ub}" alt="${a.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${a.por}</p></li>
          <li><p>Categoría: ${a.categ}</p></li>
                      <li><p>id: ${a.id}}</p></li>

        </ul>
        <h3 class="producto-titulo">${a.nombre}</h3>
        <button class="descargarBtn" data-id="${a._id}">ELIMINAR</button>
      </div>
    `;
    fotos.appendChild(div);
  });
  vincularBotonesEliminar();
}

// ===============================
// VINCULAR BOTONES ELIMINAR IMÁGENES
// ===============================
function vincularBotonesEliminar() {
  document.querySelectorAll(".descargarBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const archivo = globalArchivos.find(a => a._id === id);
      if (!archivo) return;

      if (!confirm(`¿Eliminar "${archivo.nombre}"?`)) return;

      await fetch(`/api/db?_id=${id}`, { method: "DELETE" });
      globalArchivos = globalArchivos.filter(a => a._id !== id);
      cargarImagenes(globalArchivos);
    });
  });
}

// ===============================
// FILTRADO
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
  } else {
    show.classList.add("no-ver");
  }

  cargarImagenes(filtrados);
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// ===============================
// CARGAR CATEGORÍAS
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
// PANEL SOLICITUDES
// ===============================
async function cargarSolicitudes() {
  const res = await fetch("/api/solicitudes");
  const solicitudes = await res.json();

  divSOLIS.innerHTML = "";
  solicitudes.forEach(s => {
    const div = document.createElement("div");
    div.classList.add("solicitud");
    div.innerHTML = `
      <h2>Solicitud de eliminación</h2>
      <p>motivo:${s.motivo}</p>
      <img class="la-imagen" src="${s.ub}" alt="${s.nombre}" />
      <h3 class="producto-titulo">${s.nombre}</h3>
      <button class="aceptar" data-id="${s._id}">Aceptar</button>
      <button class="rechazar" data-id="${s._id}">Rechazar</button>
    `;
    divSOLIS.appendChild(div);
    const numerito = document.getElementById("numerito");
    numerito.innerText = solicitudes.length;
  });
}

// ===============================
// PANEL ADMIN
// ===============================

async function cargarAdmins() {
  const res = await fetch("/api/personas");
  globalAdmins = await res.json();
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
        <button class="almeja eliminar" data-id="${admin._id}">ELIMINAR</button>
        <button class="almeja get-up" data-id="${admin._id}">Give admin</button>
        <button class="almeja get-down" data-id="${admin._id}">Remove admin</button>
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
      const id = e.currentTarget.dataset.id;
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
      const id = e.currentTarget.dataset.id;
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
      const id = e.currentTarget.dataset.id;
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
// INICIALIZACIÓN
// ===============================
(async function init() {
  const archivos = await cargarDesdeMongo();
  cargarImagenes(archivos);

  const cats_unicos = [...new Set(archivos.map(a => a.categ))];
  loadCats(cats_unicos);

  await cargarSolicitudes();
  await cargarAdmins();
})();
