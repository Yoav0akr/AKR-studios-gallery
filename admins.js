//seccion para el panle de borrado de imagenes subidas

// Verificar si existe un admin habilitado en localStorage
(function () {
  const adminEnabled = localStorage.getItem("AdminEnabled");

  // Si NO existe, redirigir al index
  if (!adminEnabled) {
    window.location.href = "./index.html";
  }
})();


// === CARGAR DESDE MONGO ===
async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/db", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const archivitos = await res.json();
    console.log("Cargado correctamente:", archivitos.length, "documentos");
    return archivitos;
  } catch (err) {
    console.error("Error al cargar desde Mongo:", err);
    return [];
  }
}

// === ELEMENTOS HTML ===
const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");
const buscador = document.querySelector("#buscador");

// === RENDERIZAR IMÁGENES ===
function cargarimagenes(cosas) {
  fotos.innerHTML = ``;
  cosas.forEach(nombre => {
    const div = document.createElement("div");
    div.classList.add("imagen");
    div.innerHTML = `
      <img class="la-imagen" src="${nombre.ub}" alt="${nombre.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${nombre.por}</p></li>
          <li><p>Categoría: ${nombre.categ}</p></li>
        </ul>
        <h3 class="producto-titulo">${nombre.nombre}</h3>
        <button class="descargarBtn" id="${nombre._id || nombre.id}">ELIMINAR</button>
      </div>
    `;
    fotos.append(div);
  });
  actualizarBotonesDescargar();
}

// === CARGAR CATEGORÍAS ===
function loadCats(categorias) {
  cats.innerHTML = `<option value="nombre">name</option><option value="por">contribuidor</option>`;
  categorias.forEach(categ => {
    const option = document.createElement("option");
    option.value = categ;
    option.innerHTML = categ;
    cats.append(option);
  });
}

// === VINCULAR BOTONES DE ELIMINAR ===
function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", eliminarArchivo);
  });
}

// === FUNCIÓN PRINCIPAL: ELIMINAR ARCHIVO ===
async function eliminarArchivo(e) {
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === idboton || item.id === Number(idboton));

  if (!archivo) {
    console.warn("Archivo no encontrado para el botón:", idboton);
    return;
  }

  const confirmar = confirm(`¿Seguro que deseas eliminar "${archivo.nombre}"?`);
  if (!confirmar) return;

  try {
    // 1️⃣ Intentar obtener el public_id desde la URL de Cloudinary
    const match = archivo.ub.match(/upload\/(?:v\d+\/)?(.+?)(\.[a-zA-Z0-9]+)?$/);
    const public_id = match ? match[1] : null;

    // 2️⃣ Eliminar de Cloudinary
    if (public_id) {
      const resCloud = await fetch(`/api/upload?public_id=${public_id}`, { method: "DELETE" });
      const dataCloud = await resCloud.json();

      if (!dataCloud.success) {
        console.warn("⚠️ No se eliminó de Cloudinary:", dataCloud.error || dataCloud);
      } else {
        console.log("🗑️ Eliminado de Cloudinary:", archivo.nombre);
      }
    } else {
      console.warn("⚠️ No se pudo obtener public_id de la URL:", archivo.ub);
    }

    // 3️⃣ Eliminar de MongoDB
    const resMongo = await fetch(`/api/db?_id=${archivo._id}`, { method: "DELETE" });
    const dataMongo = await resMongo.json();

    if (dataMongo.success) {
      alert(`✅ "${archivo.nombre}" eliminado correctamente.`);
      globalArchivos = globalArchivos.filter(item => item._id !== archivo._id);
      cargarimagenes(globalArchivos);
    } else {
      alert(`⚠️ No se pudo eliminar de MongoDB: ${dataMongo.error || "Error desconocido"}`);
    }
  } catch (error) {
    console.error("❌ Error eliminando archivo:", error);
    alert("Error al eliminar archivo. Revisa la consola para más detalles.");
  }
}

// === FILTRADO Y BÚSQUEDA ===
function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;
  let filtrados = globalArchivos;

  if (tipoBusqueda === "nombre") {
    filtrados = globalArchivos.filter(item => item.nombre.toLowerCase().includes(texto));
  } else if (tipoBusqueda === "por") {
    filtrados = globalArchivos.filter(item => item.por.toLowerCase().includes(texto));
  } else {
    buscador.value = "";
    filtrados = globalArchivos.filter(item => {
      const categ = Array.isArray(item.categ)
        ? item.categ.map(c => c.toLowerCase())
        : [String(item.categ).toLowerCase()];
      return categ.includes(tipoBusqueda.toLowerCase());
    });
  }

  if (show) {
    if (filtrados.length === 0) {
      show.classList.remove("no-ver");
      show.innerText = `NO HAY RESULTADOS PARA "${buscador.value.toUpperCase()}"`;
    } else {
      show.classList.add("no-ver");
    }
  }

  cargarimagenes(filtrados);
  cats.value = tipoBusqueda;
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// === INICIALIZACIÓN ===
let globalArchivos = [];

(async function init() {
  globalArchivos = await cargarDesdeMongo();
  console.log("Datos cargados de Mongo:", globalArchivos);

  if (!globalArchivos || globalArchivos.length === 0) {
    const  c4 =document.querySelector(".c4")
    const div = document.createElement("div");
    div.classList.add("noRES");
    div.innerHTML = `<p id="noRES">SI VES ESTE MENSAJE CAMBIA DE PC O CONECTATE BIEN A INTERNET PUT@.</p>`;
    c4.append(div);
    return;
  }

  const Cats_Cconcentrado = [...new Set(globalArchivos.map(doc => doc.categ).flat())];
  loadCats(Cats_Cconcentrado);
  cargarimagenes(globalArchivos);
})();


//aqui el admin selleciona que hacer (si borrar por solicitudes o por gusto/necesidad)
    //interruptores
const boton_solicitudes = document.querySelector("#solicitudes");
const boton_PB= document.getElementById("panel_de_borrado");
    //contenedores
const divSOLIS = document.querySelector(".div-solicitudes");

//ocultar todo
function hideAll (){
divSOLIS.classList.add("no-ver");
fotos.classList.add("no-ver");
}

 //mostrar cosas

 boton_PB.addEventListener("click", ()=>{
hideAll();
fotos.classList.remove("no-ver");
 });

 boton_solicitudes.addEventListener("click",()=>{
hideAll();
divSOLIS.classList.remove("no-ver")
 });

//cargar solicitudes de eliminacion
async function cargarSolicitudesDesdeMongo() {
  try {
    const res = await fetch("/api/solicitudes", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const solicitudes_random = await res.json();
    console.log("Cargado correctamente:", solicitudes_random.length, "solicitudes");
    return solicitudes_random;
  } catch (err) {
    console.error("Error al cargar solicitudes desde Mongo:", err);
    return [];
  }
}
  //llamar a la funcion para cargar las solicitudes
(async function initSolicitudes() {

  try{
  const solicitudes_random = await cargarSolicitudesDesdeMongo();
  console.log("Solicitudes cargadas de Mongo:", solicitudes_random);
  cargarSolicitudesDesdeMongo(solicitudes_random);
}catch (error) {
    console.error("Error cargando solicitudes:", error);
  }})();



//funion para acrgar las solicitudes
function cargarsolicitudes(solicitudes_random) {

  if(!solicitudes_random){
    divSOLIS.innerHTML="<h1>no hay solicitudes</h1>";
  }else{  divSOLIS.innerHTML = ``;
  solicitudes_random.forEach(solicitud=> {
    const div = document.createElement("div");
    div.classList.add("solicitud");
    div.innerHTML = `
     <h2>Solicitud de eliminacion</h2>        
        <p>se solicita: borrar</p>
        <img class="la-imagen" src="${solicitud.ub}" alt="${solicitud.nombre}" />
        <h3 class="producto-titulo">${solicitud.nombre}</h3>
      <button class="aceptar" id="${solicitud.nombre}">Aceptar</button>
      <button class="rechazar"id="${solicitudnombre}">Rechazar</button>
    `;
    divSOLIS.append(div);
    const solis = document.querySelector(".solis")
    solis.innerHTML= solicitudes_random.length

  });}};

//al dar al boton de aceptar


// para rotar el logo y ocultar nav
const  navs = document.querySelector(".nav")
const logo = document.querySelector(".logo");
logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});