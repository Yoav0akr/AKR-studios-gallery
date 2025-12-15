// ===============================
// VERIFICAR PERMISOS
// ===============================
const adminpass = localStorage.getItem("adminpass") === "true";
if (!adminpass) {
  alert("No tienes permisos para acceder a esta página.");
  window.location.href = "./index.html";
}

// ===============================
// ELEMENTOS DEL DOM
// ===============================
const botonPB = document.getElementById("panel_de_borrado");
const botonPersonas = document.getElementById("panel_de_admins");

const fotos = document.getElementById("imagenes-contenedor");
const personas = document.querySelector(".lista-personas");
const buscador = document.getElementById("buscador");
const cats = document.getElementById("cats");
const show = document.getElementById("show");
const paginacion = document.getElementById("paginacion");

// ===============================
// FUNCIONES GENERALES
// ===============================
function hideAll() {
  fotos.classList.add("no-ver");
  personas.classList.add("no-ver");
}

// ===============================
// NAVBAR
// ===============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");
logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate?.(200);
});

// ===============================
// BOTONES DE PANEL
// ===============================
botonPB.addEventListener("click", () => {
  hideAll();
  fotos.classList.remove("no-ver");
  cargarImagenesPaginadas(1);
});

botonPersonas.addEventListener("click", () => {
  hideAll();
  personas.classList.remove("no-ver");
  cargarAdmins();
});

// ===============================
// PAGINACIÓN PANEL DE BORRADO
// ===============================
let currentPage = 1;
const limit = 12;
let totalPages = 1;

// ===============================
// PANEL DE BORRADO - IMÁGENES
// ===============================
async function cargarImagenesPaginadas(page = 1) {
  currentPage = page;

  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Error cargando imágenes");
    const data = await res.json();

    const archivos = data.data || [];
    totalPages = data.totalPages || 1;

    fotos.innerHTML = "";

    if (!archivos.length) {
      show.classList.remove("no-ver");
      show.innerText = "NO HAY IMÁGENES DISPONIBLES";
      paginacion.innerHTML = "";
      return;
    } else {
      show.classList.add("no-ver");
    }

    archivos.forEach(a => {
      const div = document.createElement("div");
      div.classList.add("imagen");
      div.innerHTML = `
        <img class="la-imagen" src="${a.ub}" alt="${a.nombre}" />
        <div class="detalles">
          <ul>
            <li>Por: ${a.por}</li>
            <li>Categoría: ${a.categ.join(", ")}</li>
            <li>id: ${a._id}</li>
          </ul>
          <h3 class="producto-titulo">${a.nombre}</h3>
          <button class="eliminarBtn" data-id="${a._id}">ELIMINAR</button>
        </div>
      `;
      fotos.appendChild(div);
    });

    vincularBotonesEliminar();
    renderizarPaginacion();
  } catch (err) {
    console.error(err);
    fotos.innerHTML = "<p>Error cargando imágenes.</p>";
  }
}

function vincularBotonesEliminar() {
  document.querySelectorAll(".eliminarBtn").forEach(btn => {
    btn.onclick = async e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("¿Eliminar esta imagen?")) return;
      try {
        const res = await fetch(`/api/db?_id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Error eliminando");
        cargarImagenesPaginadas(currentPage);
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar la imagen.");
      }
    };
  });
}

function renderizarPaginacion() {
  paginacion.innerHTML = "";
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === currentPage) btn.disabled = true;
    btn.addEventListener("click", () => cargarImagenesPaginadas(i));
    paginacion.appendChild(btn);
  }
}

// ===============================
// PANEL ADMIN - USUARIOS
// ===============================
async function cargarAdmins() {
  try {
    const res = await fetch("/api/personas");
    if (!res.ok) throw new Error("Error cargando admins");
    const admins = await res.json();

    personas.innerHTML = "";
    if (!admins.length) {
      personas.innerHTML = "<p>No hay administradores registrados.</p>";
      return;
    }

    admins.forEach(admin => {
      const div = document.createElement("div");
      div.classList.add("persona");
      div.innerHTML = `
        <h3>Nombre del usuario: ${admin.admin}</h3>
        <p>Admin: ${admin.adminpass}</p>
        <div class="jaiba">
          <button class="eliminar" data-id="${admin._id}">ELIMINAR</button>
          <button class="get-up" data-id="${admin._id}">Dar admin</button>
          <button class="get-down" data-id="${admin._id}">Quitar admin</button>
        </div>
      `;
      personas.appendChild(div);
    });

    vincularBotonesAdmins();
  } catch (err) {
    console.error(err);
    personas.innerHTML = "<p>Error cargando administradores.</p>";
  }
}

function vincularBotonesAdmins() {
  // Evitar duplicar listeners
  const eliminarBtns = document.querySelectorAll(".eliminar");
  eliminarBtns.forEach(btn => {
    btn.onclick = async e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
      try {
        const res = await fetch("/api/personas", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        cargarAdmins();
      } catch (err) {
        console.error(err);
        alert("No se pudo eliminar el usuario.");
      }
    };
  });

  // Dar admin
  document.querySelectorAll(".get-up").forEach(btn => {
    btn.onclick = async e => {
      const id = e.currentTarget.dataset.id;
      try {
        const res = await fetch("/api/personas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, adminpass: true })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        cargarAdmins();
      } catch (err) {
        console.error(err);
        alert("No se pudo dar permisos de admin.");
      }
    };
  });

  // Quitar admin
  document.querySelectorAll(".get-down").forEach(btn => {
    btn.onclick = async e => {
      const id = e.currentTarget.dataset.id;
      try {
        const res = await fetch("/api/personas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, adminpass: false })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        cargarAdmins();
      } catch (err) {
        console.error(err);
        alert("No se pudo quitar permisos de admin.");
      }
    };
  });
}

// ===============================
// INICIALIZACIÓN
// ===============================
(async function init() {
  hideAll();
  fotos.classList.remove("no-ver");
  await cargarImagenesPaginadas(1);
  await cargarAdmins();
})();
