// ===============================
// VERIFICAR PERMISOS
// ===============================
const adminpass = localStorage.getItem("adminpass") === "true";
if (!adminpass) {
  alert("No tienes permisos para acceder a esta página.");
 window.location.href = "./index.html";
};
// ===============================
// ELEMENTOS DEL DOM
// ===============================
const botonPB = document.getElementById("panel_de_borrado");
const botonPersonas = document.getElementById("panel_de_admins");
const fotos = document.getElementById("imagenes-contenedor");
const personas = document.querySelector(".lista-personas");
const paginacion = document.getElementById("paginacion");
const show = document.getElementById("show");

// ===============================
// FUNCIONES GENERALES
// ===============================
function hideAll() {
  fotos.classList.add("no-ver");
  personas.classList.add("no-ver");
  paginacion.classList.add('no-ver');
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
// CARGAR IMÁGENES
// ===============================
async function cargarImagenesPaginadas(page = 1) {
  currentPage = page;
  try {
    const res = await fetch(`/api/db?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error("Error cargando imágenes");
    const data = await res.json();
    const archivos = data.data || [];
    totalPages = data.totalPages || 1;
    fotos.innerHTML = '';

    if (!archivos.length) {
      show.classList.remove("no-ver");
      show.innerText = "NO HAY IMÁGENES DISPONIBLES";
      paginacion.innerHTML = '';
      return;
    }
    show.classList.add("no-ver");

    archivos.forEach(a => {
      const div = document.createElement("div");
      div.classList.add("imagen");
      div.innerHTML = `
        <img class="la-imagen" src="${a.ub}" alt="${a.nombre}" />
        <div class="detalles">
          <ul>
            <li>Por: ${a.por}</li>
            <li>Categoría: ${a.categ.join(", ")}</li>
          </ul>
          <h3 class="producto-titulo">${a.nombre}</h3>
          <button class="eliminarBtn" data-id="${a._id}">ELIMINAR</button>
        </div>
      `;
      fotos.appendChild(div);
    });

    vincularBotonesEliminar();
    paginacion.classList.remove("no-ver")
    renderizarPaginacion();

  } catch (err) {
    console.error(err);
    fotos.innerHTML ='<p class="msg">Error cargando imágenes.</p>';
  }
}

function vincularBotonesEliminar() {
  document.querySelectorAll(".eliminarBtn").forEach(btn => {
    btn.onclick = async e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("¿Eliminar esta imagen?")) return;
      try {
        const res = await fetch(`/api/db?_id=${id}`, { method: "DELETE" });
        const data = res.headers.get("content-type")?.includes("application/json")
          ? await res.json()
          : { success: res.ok };
        if (!res.ok || !data.success) throw new Error(data.message || "Error eliminando imagen");
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
//^^^^de aqui a abajo es lo importante^^^^^^^^
// // ===============================
// CARGAR ADMINS
// ===============================
async function cargarAdmins(data) {
  if (!Array.isArray(data)) {
    console.error("cargarAdmins esperaba un array, recibió:", data);
    return;
  }
  personas.innerHTML = ""; // limpiar antes de renderizar
  data.forEach(admin => {
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
}
// ===============================
// INICIALIZACIÓN
// ===============================
async function init() {
  await cargarImagenesPaginadas(1);
  const admins = await query1("GET");
  if (admins && admins.data) {
    await cargarAdmins(await admins.data);
    await vincularbotonesADMINS();
  }

};


function vincularbotonesADMINS() {
  const eliminarADMIN = document.querySelectorAll(".eliminar");
  const get_upADMIN = document.querySelectorAll(".get-up");
  const get_downADMIN = document.querySelectorAll(".get-down");

  // 🔴 Eliminar usuario
  eliminarADMIN.forEach(button => {
    button.onclick = async e => {
      const btn = e.currentTarget;
      const id_borrar = btn.dataset.id;
      if (!confirm("¿Eliminar este usuario?")) return;
      btn.disabled = true;
      btn.textContent = "Eliminando...";
      try {
        const res = await query1("DELETE", id_borrar);
        if (res) {
          alert("Usuario eliminado");
          personas.innerHTML = "";
          const admins = await query1("GET");
          if (admins.data) cargarAdmins(admins.data);
          vincularbotonesADMINS();
        }
      } catch (err) {
        console.error(err);
        alert("Error al eliminar usuario");
      } finally {
        btn.disabled = false;
        btn.textContent = "ELIMINAR";
      }
    };
  });

  // 🟢 Dar admin
  get_upADMIN.forEach(button => {
    button.onclick = async e => {
      const btn = e.currentTarget;
      const id = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = "Otorgando...";
      try {
        const res = await query2("PUT", { adminpass: "true",id: id });
        if (res) {
          alert("Admin otorgado");
          personas.innerHTML = "";
          const admins = await query1("GET");
          if (admins.data) cargarAdmins(admins.data);
          vincularbotonesADMINS();
        }
      } catch (err) {
        console.error(err);
        alert("Error al otorgar admin");
      } finally {
        btn.disabled = false;
        btn.textContent = "Dar admin";
      }
    };
  });

  // 🔵 Quitar admin
  get_downADMIN.forEach(button => {
    button.onclick = async e => {
      const btn = e.currentTarget;
      const ids = btn.dataset.id;
      btn.disabled = true;
      btn.textContent = "Revocando...";
      try {
        const res = await query2("PUT", { adminpass: "false",id:ids});
        if (res) {
          alert("Admin revocado");
          personas.innerHTML = "";
          const admins = await query1("GET");
          if (admins.data) cargarAdmins(admins.data);
          vincularbotonesADMINS();
        }
      } catch (err) {
        console.error(err);
        alert("Error al revocar admin");
      } finally {
        btn.disabled = false;
        btn.textContent = "Quitar admin";
      }
    };
  });
};//finale de la funcion de veinculacion

//funcion para hacer queris (para no tener que hacer una query a cada rato)
async function query1(metodo, id = null) {
  const allowedMethods = ["GET", "DELETE"];
  if (!allowedMethods.includes(metodo)) {
    alert("Método no permitido en query1");
    return null;
  }

  let url = "/api/personas";
  const options = { method: metodo };

  if (metodo === "DELETE" && id) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify({ id });
  }

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      alert(`Error en query1: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    alert("Error en query1: " + err.message);
    return null;
  }
}

async function query2(metodo, cuerpo = null) {
  const allowedMethods = ["POST", "PUT"];
  if (!allowedMethods.includes(metodo)) {
    alert("Método no permitido en query2");
    return null;
  }

  let url = "/api/personas";

  const options = {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : null
  };

  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      alert(`Error en query2: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    alert("Error en query2: " + err.message);
    return null;
  }
}

init();