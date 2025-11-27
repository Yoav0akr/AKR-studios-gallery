// =============================
// ELEMENTOS HTML
// =============================
const boton_solicitudes = document.getElementById("solicitudes");
const boton_PB = document.getElementById("panel_de_borrado");
const boton_personas = document.getElementById("panel_de_admins");

const fotos = document.getElementById("imagenes-contenedor");
const personas = document.querySelector(".lista-personas");
const divSOLIS = document.querySelector(".div-solicitudes");
const buscador = document.getElementById("buscador");
const cats = document.getElementById("cats");
const show = document.getElementById("show");

// =============================
// FUNCIONES GENERALES
// =============================

// Ocultar todos los paneles
function hideAll() {
  fotos.classList.add("no-ver");
  personas.classList.add("no-ver");
  divSOLIS.classList.add("no-ver");
}

// =============================
// CARGAR IMÁGENES DESDE MONGO
// =============================
let globalArchivos = [];

async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/db", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    globalArchivos = data;
    return data;
  } catch (err) {
    console.error("Error al cargar desde Mongo:", err);
    return [];
  }
}

// Renderizar imágenes
function cargarImagenes(archivos) {
  fotos.innerHTML = "";
  archivos.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <img class="la-imagen" src="${item.ub}" alt="${item.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${item.por}</p></li>
          <li><p>Categoría: ${item.categ}</p></li>
        </ul>
        <h3 class="producto-titulo">${item.nombre}</h3>
        <button class="descargarBtn" data-id="${item._id}">ELIMINAR</button>
      </div>
    `;
    fotos.appendChild(div);
  });
  vincularBotonesEliminar();
}

// Vincular botones eliminar imágenes
function vincularBotonesEliminar() {
  document.querySelectorAll(".descargarBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const archivo = globalArchivos.find(a => a._id === id);
      if (!archivo) return alert("Archivo no encontrado");

      const confirmar = confirm(`¿Seguro que deseas eliminar "${archivo.nombre}"?`);
      if (!confirmar) return;

      try {
        // Eliminar de MongoDB
        const res = await fetch(`/api/db?_id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          globalArchivos = globalArchivos.filter(a => a._id !== id);
          cargarImagenes(globalArchivos);
        }
      } catch (err) {
        console.error(err);
        alert("Error al eliminar archivo");
      }
    });
  });
}

// =============================
// CARGAR SOLICITUDES
// =============================
async function cargarSolicitudes() {
  try {
    const res = await fetch("/api/solicitudes", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();
    renderSolicitudes(data);
  } catch (err) {
    console.error("Error al cargar solicitudes:", err);
  }
}

function renderSolicitudes(solicitudes) {
  divSOLIS.innerHTML = "";
  if (!solicitudes || solicitudes.length === 0) {
    divSOLIS.innerHTML = "<p>No hay solicitudes</p>";
    return;
  }

  solicitudes.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("solicitud");
    div.innerHTML = `
      <h2>Solicitud de eliminación</h2>
      <p>Se solicita borrar</p>
      <img class="la-imagen" src="${item.ub}" alt="${item.nombre}" />
      <h3 class="producto-titulo">${item.nombre}</h3>
      <button class="aceptar" data-id="${item._id}">Aceptar</button>
      <button class="rechazar" data-id="${item._id}">Rechazar</button>
    `;
    divSOLIS.appendChild(div);
  });

  // Vincular botones aceptar/rechazar
  document.querySelectorAll(".aceptar").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      // Lógica de aceptar
      alert(`Aceptado: ${id}`);
    });
  });

  document.querySelectorAll(".rechazar").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      // Lógica de rechazar
      alert(`Rechazado: ${id}`);
    });
  });
}

// =============================
// CARGAR ADMINISTRADORES
// =============================
async function cargarAdmins() {
  try {
    const res = await fetch("/api/adminsDB", { method: "GET" });
    if (!res.ok) throw new Error("Error cargando admins");
    const data = await res.json();
    renderizarPersonas(data);
  } catch (err) {
    console.error(err);
  }
}

function renderizarPersonas(admins) {
  personas.innerHTML = "";
  admins.forEach(admin => {
    const div = document.createElement("div");
    div.classList.add("persona");
    div.innerHTML = `
      <h3 class="nombre">Nombre: ${admin.admin}</h3>
      <h3 class="estado">Admin pass: <span>${admin.adminpass}</span></h3>
      <div class="jaiba">
        <button class="almeja eliminar-not" data-id="${admin._id}">ELIMINAR</button>
        <button class="almeja get-up" data-id="${admin._id}">Give admin</button>
        <button class="almeja get-down" data-id="${admin._id}">Remove admin</button>
      </div>
    `;
    personas.appendChild(div);
  });
  vincularBotonesAdmins();
}

function vincularBotonesAdmins() {
  document.querySelectorAll(".eliminar-not").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("¿Seguro que deseas eliminar este admin?")) return;

      const res = await fetch("/api/adminsDB", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) cargarAdmins();
    });
  });

  document.querySelectorAll(".get-up").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      await fetch("/api/adminsDB", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminpass: true }),
      });
      cargarAdmins();
    });
  });

  document.querySelectorAll(".get-down").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      await fetch("/api/adminsDB", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminpass: false }),
      });
      cargarAdmins();
    });
  });
}

// =============================
// FILTRADO Y BÚSQUEDA
// =============================
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipo = cats.value;
  let filtrados = globalArchivos;

  if (tipo === "nombre") {
    filtrados = globalArchivos.filter(item => item.nombre.toLowerCase().includes(texto));
  } else if (tipo === "por") {
    filtrados = globalArchivos.filter(item => item.por.toLowerCase().includes(texto));
  } else {
    filtrados = globalArchivos.filter(item => {
      const categs = Array.isArray(item.categ) ? item.categ : [item.categ];
      return categs.map(c => c.toLowerCase()).includes(tipo.toLowerCase());
    });
  }

  if (filtrados.length === 0) {
    show.classList.remove("no-ver");
    show.textContent = `NO HAY RESULTADOS PARA "${buscador.value.toUpperCase()}"`;
  } else {
    show.classList.add("no-ver");
  }

  cargarImagenes(filtrados);
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// =============================
// SWITCH PANEL
// =============================
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

// =============================
// INICIALIZACIÓN
// =============================
(async function init() {
  await cargarDesdeMongo();
  cargarImagenes(globalArchivos);

  await cargarSolicitudes();
  await cargarAdmins();
})();
