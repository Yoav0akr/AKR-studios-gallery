// ==============================
//  SESIÓN
// ==============================
const admin = localStorage.getItem("admin");
const adminpass = localStorage.getItem("adminpass");

if (!admin) {
  window.location.href = "../existente.html";
}

// ==============================
//  ELEMENTOS DEL PERFIL
// ==============================
const nombreEl = document.getElementById("perfil-nombre");
const emailEl = document.getElementById("perfil-email");
const rolEl = document.getElementById("perfil-rol");
const descEl = document.getElementById("perfil-desc");
const contenedorImgs = document.getElementById("imagenes-contenedor-perfil");

// ==============================
//  CONFIG PAGINACIÓN
// ==============================
let currentPage = 1;
const limit = 20;
let totalPages = 1;

// ==============================
//  CARGAR PERFIL
// ==============================
async function cargarPerfil() {
  try {
    const res = await fetch(`/api/api_perfil?admin=${admin}`);
    const data = await res.json();

    if (!data.success) throw data.error || "Error al cargar perfil";

    const profile = data.profile;

    nombreEl.innerText = profile.admin;
    emailEl.innerText = profile.email || "—";
    rolEl.innerText = profile.role;
    descEl.innerText = "Usuario activo en el sistema.";
  } catch (err) {
    console.error("Error perfil:", err);
    alert("No se pudo cargar el perfil.");
  }
}

// ==============================
//  CARGAR FOTOS DEL USUARIO
// ==============================
async function cargarMisFotos(page = 1) {
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    const data = await res.json();

    // Filtrar solo las fotos del usuario
    const fotosUsuario = (data.data || []).filter(f => f.por === admin);

    totalPages = Math.ceil(fotosUsuario.length / limit) || 1;
    currentPage = page;

    // Mostrar solo las fotos de la página actual
    const start = (page - 1) * limit;
    const end = start + limit;
    const fotosPagina = fotosUsuario.slice(start, end);

    pintarFotos(fotosPagina);
    pintarPaginador(totalPages);
  } catch (err) {
    console.error("Error fotos:", err);
    contenedorImgs.innerHTML = "<p>No se pudieron cargar las fotos.</p>";
  }
}

// ==============================
//  PINTAR FOTOS
// ==============================
function pintarFotos(fotos) {
  contenedorImgs.innerHTML = "";

  if (!fotos.length) {
    contenedorImgs.innerHTML = "<p>No has subido contenido.</p>";
    return;
  }

  fotos.forEach(img => {
    const div = document.createElement("div");
    div.className = "imagen";

    div.innerHTML = `
      <h4>${img.nombre}</h4>
      <img src="${img.ub}" alt="${img.nombre}" class="la-imagen">
      <p><b>Categoría:</b> ${img.categ.join(", ")}</p>
      <div class="toDO">
        <button class="descargarBtn yes" data-id="${img._id}">Descargar</button>
        <button class="eliminarBtn not" data-id="${img._id}">Eliminar</button>
      </div>
    `;

    contenedorImgs.appendChild(div);
  });

  vincularEliminar();
  vincularDescargar(fotos);
}

// ==============================
//  DESCARGAR IMAGEN + BLOB
// ==============================
function vincularDescargar(fotos) {
  document.querySelectorAll(".descargarBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const archivo = fotos.find(f => f._id === id);
      if (archivo) download(archivo);
    });
  });
}

async function download(archivo) {
  try {
    const res = await fetch(archivo.ub);
    if (!res.ok) throw new Error("Error al descargar la imagen");

    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = archivo.nombre + "_AKR.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error("Error descargando imagen:", err);
    alert("No se pudo descargar la imagen.");
  }
}

// ==============================
//  ELIMINAR SOLO MIS FOTOS
// ==============================
function vincularEliminar() {
  document.querySelectorAll(".eliminarBtn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("¿Eliminar esta imagen?")) return;

      try {
        const res = await fetch(`/api/db?_id=${id}&admin=${admin}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (!data.success) throw data.error;

        cargarMisFotos(currentPage);
      } catch (err) {
        alert("No tienes permiso para borrar esta imagen o ocurrió un error.");
        console.error(err);
      }
    });
  });
}

// ==============================
//  PAGINADOR
// ==============================
function pintarPaginador(totalPages) {
  let pagContainer = document.getElementById("paginador");
  if (!pagContainer) {
    pagContainer = document.createElement("div");
    pagContainer.id = "paginador";
    contenedorImgs.after(pagContainer);
  }

  pagContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;
    btn.disabled = i === currentPage;
    btn.className = "paginador-btn";
    btn.addEventListener("click", () => cargarMisFotos(i));
    pagContainer.appendChild(btn);
  }
}

// ==============================
//  NAVBAR
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});

// ==============================
//  INIT
// ==============================
cargarPerfil();
cargarMisFotos();
