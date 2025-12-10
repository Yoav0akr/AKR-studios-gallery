const divlog = document.getElementById("loged");
const btnLog = document.getElementById("btnLogAdmins");


// Control de inicio (se ve si se inició sesión)
const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");
const titular = document.getElementById("titular");
const btnPANadmins = document.getElementById("btnLogAdmins");
//verifcar si nombre de usuario no es nulo
if (nombre_usuario) {
  //al existir usuario logeado el titular se mostrara con el nombrede de usuario
  titular.innerText = ` Hola ${nombre_usuario}!`;
  titular.classList.remove("no-ver");
  //si admin pass es true se muestra el boton para ir al panel de administracion
  if (adminpass.value=== "true") {
    btnPANadmins.classList.remove("no-ver");
    
  } else {
    btnPANadmins.classList.add("no-ver");
  };
} else {
  titular.classList.add("no-ver");
  btnPANadmins.classList.add("no-ver");
};
// al ahcer clic en solicitar
const btnPerfil = document.getElementById("Mi_perfil");
btnPerfil.addEventListener("click", () => {
  window.location.href = "./area de prefiles/Mi_perfil.html";
});

//a la hcaer click en PANEL DE ADMINISTRACION
btnLog.addEventListener("click", () => {
  window.location.href = "./admins.html";
});

// ==============================
//  FUNCIONES PARA MONGO
// ==============================





// Se cargan archivos de bd3.js si falla la conexión a Mongo
import { archivos } from './bd3.js';
let archivitos = archivos;

// Función para llamar los archivos
async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/db", { method: "GET" });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    archivitos = await res.json(); // aquí solo asignamos, no redeclaramos
    console.log("Cargado correctamente:", archivitos.length, "documentos");
    // alert("Se ha cargado correctamente"); // opcional

    return archivitos;
  } catch (err) {
    console.error("Error al cargar desde Mongo, se cargarán archivos internos de prueba", err);
    // alert("No se pudo cargar. Revisa la consola."); // opcional
    return archivitos; // devolvemos los archivos de prueba en vez de []
  }
}

const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");
const buscador = document.querySelector("#buscador");


// Función para renderizar imágenes
function cargarimagenes(cosas) {
  fotos.innerHTML = ` `;
  cosas.forEach(nombre => {
    const div = document.createElement("div");
    const descripcion = nombre.mimidesk || "sin descripcion";

    div.classList.add("imagen");
    div.innerHTML = `
    <h3 class="producto-titulo">${nombre.nombre}</h3>
      <img class="la-imagen" id="${nombre.nombre || nombre.nombre}"src="${nombre.ub}" alt="${nombre.nombre}" />
      <div class="detalles">
        <ul>
          <li><p>Por/De: ${nombre.por}</p></li>
          <li><p>Categoría: ${nombre.categ}</p></li>
          <li><p>Descrpcion: ${descripcion}</p></li>
            <li><p>id: "${nombre.id}"</p></li>
        </ul>
      </div>
      <div class="desc-soli">
      <button class="descargarBtn" id="${nombre.id || nombre._id}">Descargar</button>
     
      </div>
    `;
    fotos.append(div);
  });
  actualizardivsVIsualizar();
  actualizarBotonesDescargar();
}

// Categorías
function loadCats(categorias) {
  categorias.forEach(categ => {
    const option = document.createElement("option");
    option.value = categ;
    option.innerHTML = categ;
    cats.append(option);
  });
}

// Descarga
function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", download);
  });
}
// visualizar
const visualizar = document.querySelectorAll(".la-imagen");
function actualizardivsVIsualizar() {
  visualizar.forEach(boton => {
    boton.addEventListener("click", noSeXd);
  });
}
function noSeXd(e) {
  const estafoto = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === estafoto || item.id === Number(estafoto));
  cats.value = "nombre";
  buscador.value = archivo;
  filtrarYMostrar()
}

async function download(e) {
  //descarga de archivos con blob
  const idboton = e.currentTarget.id;
  const archivo = globalArchivos.find(item => item._id === idboton || item.id === Number(idboton));
  if (!archivo) return console.warn("Archivo no encontrado para el botón:", idboton);
  const url = archivo.ub;
  const res = await fetch(url);
  const blob = await res.blob();

  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.target = "_blank"
  enlace.download = archivo.nombre + "_AKRestudiosGallery.jpg";
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  //liberar memoria

};

// Filtrado
const div_mesages = document.querySelector(".mensage");
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
      const categ = Array.isArray(item.categ) ? item.categ.map(c => c.toLowerCase()) : [String(item.categ).toLowerCase()];
      return categ.includes(tipoBusqueda.toLowerCase());
    });
  }

  if (show) {
    if (filtrados.length === 0) {
      div_mesages.classList.remove("no-ver");
      div_mesages.innerText = `NO HAY RESULTADOS PARA "${buscador.value.toUpperCase()}"`;
    } else {
      div_mesages.classList.add("no-ver");
    }
  }

  cargarimagenes(filtrados);
  cats.value = tipoBusqueda;
}

buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

// Inicialización
let globalArchivos = [];

(async function init() {
  globalArchivos = await cargarDesdeMongo();
  console.log("Datos cargados de Mongo:", globalArchivos);

  if (!globalArchivos || globalArchivos.length === 0) {

    const div = document.createElement("div");
    div.classList.add("noRES");
    div.innerHTML =
      `<p id="noRES">SI VES ESTE MENSAJE CAMBIA DE PC O CONECTATE BIEN A INTERNET PUT@.</p>`;
    div_mesages.append(div);
    return;
  }
  const Cats_Cconcentrado = [...new Set(globalArchivos.map(doc => doc.categ).flat())];
  loadCats(Cats_Cconcentrado);
  cargarimagenes(globalArchivos);
})();


// para rotar el logo y desplegar/ocultar nav
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});
ScrollReveal().reveal('.imagen');