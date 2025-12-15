
// Control de inicio (se ve si se inició sesión)

const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");
const email_place = document.getElementById("perfil-email");
const rol_place = document.getElementById("perfil-rol");
const myPhoto = document.getElementById("imagenes-contenedor-perfil");
//llenar los areas
function llenar_perfil(nombre, email, adminpass, fotos_subidas) {
  email_place.innerText = email;
  rol_place.innerText = adminpass === "true" ? "Administrador" : "Usuario";
  document.getElementById("perfil-nombre").innerText = nombre;
}

//cargar datos del usuario
let globalArchivos = [];

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
};

//filtar fotos de usuario
const userPictuers = async (nombre_usuario) => {
  const todas_las_fotos = await cargarDesdeMongo(1, 1000);
  return todas_las_fotos.filter((foto) => foto.por === nombre_usuario);
}
const fotos = userPictuers(nombre_usuario);
cargarimagenes(fotos);





//funcion general para mostrar fotos de usuario
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
        <button class="eliminarBtn" id="${nombre.id}">eliminar</button>

      </div>
    `;
    myPhoto.append(div);
  });

  actualizarBotonesDescargar();
  vincularBotonesEliminar();
  actualizarVisualizacion();
}
// vincular  botones eliminar
function vincularBotonesEliminar() {
  document.querySelectorAll(".eliminarBtn").forEach(btn => {
    btn.addEventListener("click", async e => {
      const id = e.currentTarget.dataset.id;
      if (!confirm("¿Eliminar esta imagen?")) return;
      try {
        await fetch(`../api/db?_id=${id}`, { method: "DELETE" });
        cargarDesdeMongo
      } catch (err) {
        console.error("Error eliminando imagen:", err);
      }
    });
  });
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

if (adminpass !== "true") {
  window.location.href = "../nuevo.html";
}