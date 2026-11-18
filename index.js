// ==============================
//  ELEMENTOS DOM
// ==============================
const titular = document.getElementById("titular");
const btnPANadmins = document.getElementById("btnLogAdmins");
const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementById("cats");
const buscador = document.querySelector("#buscador");
const div_mesages = document.querySelector(".mensage");
const btnPrev = document.getElementById("prev");
const btnNext = document.getElementById("next");
const paginaActual = document.getElementById("paginaActual");
const show = document.getElementById("show");
const loggedBUTNS = document.getElementById("loged");

// ==============================
//  SESIÓN
// ==============================

function logued_Q() {
  const adminpass = localStorage.getItem("adminpass");
  const nombre_usuario = localStorage.getItem("admin");

  if (nombre_usuario) {
    titular.textContent = `Hola ${nombre_usuario}!`;
    titular.classList.remove("no-ver");
    loggedBUTNS.classList.remove("no-ver");
    console.log(loggedBUTNS);

    if (adminpass === "true") {
      btnPANadmins.classList.remove("no-ver");
    } else {
      btnPANadmins.classList.add("no-ver");
    }
  } else {
    titular.classList.add("no-ver");
    btnPANadmins.classList.add("no-ver");
  }

};








// ==============================
//  GLOBALES
// ==============================
let globalArchivos = [];
let currentPage = 1;
let totalPages = 1;
const LIMIT = 20;
let currentMode = "home"; // por defecto
let currentCategoria = "";
let currentTexto = "";
let catsGetted = ""

// ==============================
//  API
// ==============================
async function cargarDesdeMongo(page = 1) {
  try {
    const params = new URLSearchParams({
      mode: currentMode,
      page,
      limit: LIMIT,
    });

    if (currentMode === "searchname" || currentMode === "searchcat") {
      if (currentCategoria !== "") params.append("categoria", currentCategoria);
      if (currentTexto !== "") params.append("nombre", currentTexto); // ojo: backend espera "nombre", no "texto"
    }

    const res = await fetch(`/api/db?${params.toString()}` || `https://akr-studios-gallery.vercel.app/api/db`);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();

    globalArchivos = data.data || [];
    currentPage = data.page;
    totalPages = data.totalPages;

    return globalArchivos;
  } catch (err) {
    console.error("Error Mongo:", err);
    return [];
  }
}
//funcion para tomar videos random:
function getRandomASMRLink() {
    const videos = [
        "https://youtu.be/YpmJlZJX-h8?si=QRFc5cG-lSP02TZN",
        "https://youtu.be/Wb_U9TaG4og?si=nr8WDRWYtPMoLYOL",
        "https://youtu.be/TAqQz7TL3-c?si=1OiBRJBJap68zbeX",
        "https://youtu.be/Ant6POXHapI?si=y3e34aKO05-OzrXK",
        "https://youtu.be/9bImo955c7E?si=3CTQm2ftMAqNWNPC",
        "https://youtu.be/Hngyw7p2KFA?si=G28Yfj_f3cFauZ63",
        "https://youtu.be/Pj0NfyrtmiA?si=4udO-pqqykYRDBkt",
        "https://www.youtube.com/live/099ZzTj5Jns?si=1NJv41HsshvWSe39",
        "https://youtu.be/EpIsV4wru1Q?si=DPCqMDUEg2E2BrUs",
        "https://youtu.be/RINCgYzWCds?si=yM0XOVJN48RHxdXj"
    ];

    return videos[Math.floor(Math.random() * videos.length)];
}

// ==============================
//  RENDER IMÁGENES
// ==============================
function cargarimagenes(lista) {
  fotos.innerHTML = "";

  if (lista.length === 0) {
    show.classList.remove("no-ver");
    show.textContent = "NO HAY IMÁGENES DISPONIBLES, O CONECTATE A INTERNET";
    show.classList.add("mensage")
    return;
  }
 






  show.classList.add("no-ver");
  fotos.innerHTML = `      <div class="imagen novedad">
        <img class="la-imagen" style="position: relative;" src="./novedad(1).png" />
        <div style="
        position: absolute;
        flex-direction: column;
        align-self: center;
        justify-self: center;
            top: 35%;
      
        ">
          <p   style="font-size: 3vw; text-align: center; mix-blend-mode: difference; color: #ffffff;   font-weight: 16vw;">Esta pagina es una pagina para todo publico</p>

          <a  class= "menu" href="${getRandomASMRLink()}">No me gusta</a>
        </div>
      </div>`;
  lista.forEach(item => {
    const div = document.createElement("div");
    const descripcion = item.mimidesk || "Sin descripción";

    div.className = "imagen";
    div.innerHTML = `

      <img class="la-imagen" src="${item.ub}" alt="${item.nombre}" />
      <li>  <h3 class="producto-titulo" >${item.nombre}</h3 ></li>
      <div class="detalles">
        <ul>
        <li>Por: ${item.por}</li>
        <li>Categoría: ${(item.categ || []).join(", ")}</li>
          <li>${descripcion}</li>
        </ul>
      </div>
      <div class="desc-soli">
        <button class="descargarBtn">Descargar</button>
      </div>
`;

    div.querySelector(".descargarBtn")
      .addEventListener("click", () => download(item));

    fotos.appendChild(div);
  });
}

// ==============================
//  DESCARGA
// ==============================
async function download(archivo) {
  const res = await fetch(archivo.ub);
  const blob = await res.blob();

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = archivo.nombre + "_AKR.jpg";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ==============================
//  CATEGORÍAS lod
// ==============================
function renderCategorias(archivos) {
  cats.innerHTML = ""; // limpiar

  archivos.forEach(cat => {
    const op = document.createElement("option");

    if (cat === "") {
      op.value = "all";
      op.textContent = "Todas las categorías";
    } else {
      op.value = cat;
      op.textContent = cat;
    }

    cats.appendChild(op);
  });
}
// ==============================
//  EVENTOS DE BÚSQUEDA
// ==============================
buscador.addEventListener("input", async () => {
  currentMode = "searchname";
  currentTexto = buscador.value.trim().toLowerCase();
  await init(1);
});

cats.addEventListener("click", async () => {
  if (cats.value === "all") {
    currentMode = "home";
    currentCategoria = "";
    await init(1);
  }
});

cats.addEventListener("change", async () => {
  console.warn("se diaparo");
  if (cats.value === "all") {
    console.warn("se diaparo1");
    // location.reload();

  } else {
    currentMode = "searchcat";
    currentCategoria = cats.value;
    await init(1);
  }

});

// ==============================
//  PAGINACIÓN
// ==============================
btnPrev.addEventListener("click", async () => {
  if (currentPage > 1) {
    await init(currentPage - 1);
  }
});

btnNext.addEventListener("click", async () => {
  if (currentPage < totalPages) {
    await init(currentPage + 1);
  }
});

// ==============================
//  INIT
// ==============================
async function init(page = 1) {
  await cargarDesdeMongo(page);
  renderCategorias(await GET_categs());
  cargarimagenes(globalArchivos);
  paginaActual.textContent = `Página ${currentPage} de ${totalPages} `;
  logued_Q();
}

// ==============================
//  NAVBAR
// ==============================
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  if (navigator.vibrate) navigator.vibrate(200);
});

// ==============================
//  funciones tipo llamada api
// ==============================

//llamar categorias desde api/db
async function GET_categs() {
  try {
    const params = new URLSearchParams({
      mode: "cats",
    });
    const res = await fetch(`/api/db?${params.toString()}` || `https://akr-studios-gallery.vercel.app/api/db?${params.toString()}`);
    if (!res.ok) throw new Error(res.status);

    const data = await res.json();   // <- parseamos la respuesta
    const catsRes = data.cats || []; // <- asumimos que backend devuelve { cats: [...] }
    return catsRes;
  } catch (err) {
    console.error("Error Mongo:", err);
    return [];
  }
}


// ==============================
//  START
// ==============================
init();