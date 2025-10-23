//import { archivos } from './bd.js';
import { archivos } from './bd2.js';
const archivitos = archivos;



const fotos = document.querySelector("#imagenes-contenedor");
const cats = document.getElementsByName("cats")[0];
const show = document.getElementById("show");

//cludinary
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ;
const CLOUDINARY_URL=`https://res.cloudinary.com/${CLOUD_NAME}/image/list/galeria.json`;

function cargarimagenes(cosas) {
  fotos.innerHTML = "";
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
        <button class="descargarBtn" id="${nombre.id}">Descargar</button>
      </div>
    `;
    fotos.append(div);
  });
  actualizarBotonesDescargar();
  loadCats(cots);
}

const Cats_Cconcentrado = [...new Set(archivitos.flatMap(doc => doc.categ))];
const cots = Cats_Cconcentrado;

function loadCats(categorias) {
  cats.innerHTML = `<option value="nombre">name</option><option value="por">contribuidor</option>`;
  categorias.forEach(categ => {
    const option = document.createElement("option");
    option.value = categ;
    option.innerHTML = categ;
    cats.append(option);
  });
}

const buscador = document.querySelector("#buscador");

function filtrarYMostrar() {
  const texto = buscador.value.toLowerCase().trim();
  const tipoBusqueda = cats.value;
  let filtrados = archivitos;

  if (tipoBusqueda === "nombre") {
    filtrados = archivitos.filter(item =>
      item.nombre.toLowerCase().includes(texto)
    );
  } else if (tipoBusqueda === "por") {
    filtrados = archivitos.filter(item =>
      item.por.toLowerCase().includes(texto)
    );
  } else {
    buscador.value = "";
    filtrados = archivitos.filter(item => {
      const categ = Array.isArray(item.categ)
        ? item.categ.map(c => c.toLowerCase())
        : [String(item.categ).toLowerCase()];
      return categ.includes(tipoBusqueda);
    });
  }

  if (show) {
    if (filtrados.length === 0) {
      show.classList.remove("no-ver");
      show.innerText = `NO HAY NI VRG DE "${buscador.value.toUpperCase()}"`;
    } else {
      show.classList.add("no-ver");
    }
  }

  cargarimagenes(filtrados);
  cats.value = tipoBusqueda;
}


buscador.addEventListener("input", filtrarYMostrar);
cats.addEventListener("change", filtrarYMostrar);

function actualizarBotonesDescargar() {
  const BotonesDescargar = document.querySelectorAll(".descargarBtn");
  BotonesDescargar.forEach(boton => {
    boton.addEventListener("click", download);
  });
}

function download(e) {
  const idboton = Number(e.currentTarget.id);
  const archivo = archivitos.find(item => item.id === idboton);
  if (!archivo) {
    console.warn("Archivo no encontrado para el botón:", idboton);
    return;
  }

  const enlace = document.createElement('a');
  enlace.href = archivo.ub;
  enlace.download = archivo.nombre;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
}

// Inicializa la galería
cargarimagenes(archivitos);