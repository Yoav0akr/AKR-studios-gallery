// ==============================
//  SESIÓN
// ==============================
const admin = localStorage.getItem("admin");
const adminpass = localStorage.getItem("adminpass");

if (!admin) {
  window.location.href = "../existente.html";
}

// ==============================
//  ELEMENTOS PERFIL
// ==============================
const nombreEl = document.getElementById("perfil-nombre");
const emailEl = document.getElementById("perfil-email");
const rolEl = document.getElementById("perfil-rol");
const descEl = document.getElementById("perfil-desc");

// ==============================
//  CONTENEDOR IMÁGENES
// ==============================
const contenedorImgs = document.getElementById("imagenes-contenedor-perfil");

// ==============================
//  CARGAR PERFIL
// ==============================
async function cargarPerfil() {
  try {
    const res = await fetch(`/api/api_perfil?admin=${admin}`);
    const data = await res.json();

    if (!data.success) throw data.error;

    nombreEl.innerText = data.user.admin;
    emailEl.innerText = data.user.email || "—";
    rolEl.innerText =
      data.user.adminpass === "true" ? "Administrador" : "Usuario";

    descEl.innerText = "Usuario activo en el sistema.";
  } catch (err) {
    console.error("Error perfil:", err);
  }
}

// ==============================
//  CARGAR MIS FOTOS
// ==============================
async function cargarMisFotos() {
  try {
    const res = await fetch(`/api/db?por=${admin}`);
    const data = await res.json();

    if (!data.success) throw data.error;

    pintarFotos(data.data);
  } catch (err) {
    console.error("Error fotos:", err);
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

      <div class="desc-soli">
        <a href="${img.ub}" download class="descargarBtn yes">
          Descargar
        </a>
        <button class="eliminarBtn not" data-id="${img._id}">
          Eliminar
        </button>
      </div>
    `;

    contenedorImgs.appendChild(div);
  });

  vincularEliminar();
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
        const res = await fetch(
          `/api/db?_id=${id}&admin=${admin}`,
          { method: "DELETE" }
        );

        const data = await res.json();
        if (!data.success) throw data.error;

        cargarMisFotos();
      } catch (err) {
        alert("No tienes permiso para borrar esta imagen");
      }
    });
  });
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
