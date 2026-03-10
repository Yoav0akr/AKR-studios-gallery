// ==============================
// --- VARIABLES DEL FORMULARIO ---
// ==============================
const EntradaNombre = document.getElementById("nombre_imput");
const EntradaPor = document.getElementById("por-imput");
const EntradaCategs = document.getElementById("categs");
const EntradaGuardar = document.getElementById("manchego");
const EntradaDesc = document.getElementById("mimidesk");
const visualizador = document.querySelector(".visualizador");

// ==============================
// --- AUTO LLENADO DEL USUARIO ---
// ==============================
const usuario = localStorage.getItem("admin") || "";
const email_user = localStorage.getItem("email") || "";

if (usuario.trim() !== "") {
  EntradaPor.value = usuario.trim();
  EntradaPor.disabled = true;
} else {
  EntradaPor.value = "";
  EntradaPor.disabled = false;
}

// ==============================
// --- VARIABLES GLOBALES ---
// ==============================
let archivoSeleccionado = null;
let cloudinaryURL = null;

// ==============================
// --- SPINNER (CARGANDO) ---
// ==============================
const spinner = document.getElementById("spinner");

function mostrarSpinner() {
  if (spinner) spinner.classList.remove("no-ver");
}

function ocultarSpinner() {
  if (spinner) spinner.classList.add("no-ver");
}

// ==============================
// --- MANEJO DEL VISUALIZADOR ---
// ==============================
if (visualizador) {
  visualizador.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      archivoSeleccionado = file;
      if (visualizador.classList.contains("reject")) {
        visualizador.classList.remove("reject");
      }


      const maxBytes = 20 * 1024 * 1024; // 20MB
      if (file.size > maxBytes) {
        alert(`❌ Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 20MB`);
        archivoSeleccionado = null;
        return;
      }

      // Preview local
      const localURL = URL.createObjectURL(file);
      visualizador.style.backgroundImage = `url(${localURL})`;
      visualizador.style.backgroundSize = "cover";
      visualizador.style.backgroundPosition = "center";
      visualizador.style.backgroundRepeat = "no-repeat";
      visualizador.querySelectorAll("p, span, i").forEach(el => el.style.display = "none");

      // 🔹 Subida automática a Cloudinary
      mostrarSpinner();
      try {
        const formData = new FormData();
        formData.append("file", archivoSeleccionado);

        console.log("📤 Subiendo archivo a Cloudinary...");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        console.log("📥 Respuesta de /api/upload:", data);

        if (!data.url) {
          alert("❌ Error subiendo a Cloudinary: " + (data.error || "desconocido"));
          console.error("Error en respuesta:", data);
          cloudinaryURL = null;
          return;
        }

        cloudinaryURL = data.url;
        console.log("✔ Subido a Cloudinary:", cloudinaryURL);


        // Ahora puedes extraer variables en una sola línea
        const scores = await nsfwFun(cloudinaryURL);
        const { nsfw = 0, sfw = 1 } = scores;

        // 🔹 Lógica de validación NSFW/olimpia
        const facesAllowed = await facesFun(cloudinaryURL);

        if (facesAllowed) {

          if (nsfw <= 0.3) {
            console.log("✅ Imagen ACEPTADA (sfw predominante)");
            try {
              EntradaDesc.value = await DETECT_Desk(cloudinaryURL);
              EntradaCategs.value = await CategsIa(cloudinaryURL);
              console.log("✅ Descripción completada");
            } catch (descErr) {
              console.warn("⚠️ Error obteniendo descripción automática:", descErr);
              EntradaDesc.value = "Auto descripcion no disponible, ingrese una";
            }
            alert("✅ Imagen validada correctamente. Puedes guardarla.");
          } else if (nsfw >= 0.7) {
            alert(`❌ Contenido inapropiado detectado (NSFW: ${(nsfw * 100).toFixed(1)}%|${(sfw * 100).toFixed(1)} )\n\nLa imagen será rechazada.`);
            visualizador.classList.add("reject");
            cloudinaryURL = null;
            console.warn("🚫 Imagen RECHAZADA por NSFW (nsfw = " + nsfw + ")");
          } else {
            console.warn("⚠️ Imagen MARCADA para revisión manual (valores intermedios)" + scores);
            alert("⚠️ Imagen marcada para revisión manual por los moderadores  .");
            visualizador.classList.add("reject");
            cloudinaryURL = null;
          }
        } else {
          visualizador.classList.add("reject");
          alert("❌ Esta imagen contiene una cara humana. Verifica los derechos de uso.");
          cloudinaryURL = null;
        }

      } catch (err) {
        console.error("❌ Error CRÍTICO en subida/análisis:", err.message);
        console.error("Stack trace:", err.stack);
        alert(`⚠️ Error procesando imagen:\n${err.message}`);
        cloudinaryURL = null;
      } finally {
        ocultarSpinner();
      }
    };
  });
}

// ==============================
// --- IA ---
// ==============================


//categorias
async function CategsIa(URL_Image) {
  try {
    if (!URL_Image) {
      throw new Error("URL_Image no está definida");
    }

    console.log("📝 Pidiendo categs a Hugging Face...");
    const analyzeRes = await fetch("/api/categs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: URL_Image }),
    });

    console.log(`📥 Status del servidor: ${analyzeRes.status}`);

    if (!analyzeRes.ok) {
      throw new Error(`HTTP Error ${analyzeRes.status}: ${analyzeRes.statusText}`);
    }

    const analyzeData = await analyzeRes.json();
    console.log("📥 Respuesta de /api/categs", analyzeData);

    if (analyzeData.error) {
      throw new Error(`API Error: ${analyzeData.error}`);
    }

    // Aquí ya esperamos un array de categorías
    const categs = Array.isArray(analyzeData.categorias)
      ? analyzeData.categorias
      : ["sin_categorias"];

    console.log("✅ Categorías obtenidas:", categs);
    return categs;
  } catch (err) {
    console.error("❌ Error en CategsIa():", err.message);
    throw err;
  }
};

//descripciones
async function DETECT_Desk(URL_Image) {
  try {
    if (!URL_Image) {
      throw new Error("URL_Image no está definida");
    }

    console.log("📝 Pidiendo descripción a Hugging Face...");
    const analyzeRes = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ URL: URL_Image }),
    });

    console.log(`📥 Status del servidor: ${analyzeRes.status}`);

    if (!analyzeRes.ok) {
      throw new Error(`HTTP Error ${analyzeRes.status}: ${analyzeRes.statusText}`);
    }

    const analyzeData = await analyzeRes.json();
    console.log("📥 Respuesta de /api/analyze:", analyzeData);

    if (analyzeData.error) {
      throw new Error(`API Error: ${analyzeData.error}`);
    }

    // Manejar diferentes formatos de respuesta
    let finCaption = "Descripción no disponible";

    if (analyzeData.output?.captions && Array.isArray(analyzeData.output.captions)) {
      finCaption = analyzeData.output.captions
        .map(item => item.caption || item.text || "")
        .filter(text => text.length > 0)
        .join(" ");
    } else if (analyzeData.output?.text) {
      finCaption = analyzeData.output.text;
    } else if (typeof analyzeData.output === 'string') {
      finCaption = analyzeData.output;
    }

    console.log("✅ Descripción obtenida:", finCaption);
    return finCaption || "Descripción no disponible";

  } catch (err) {
    console.error("❌ Error en DETECT_Desk():", err.message);
    throw err;
  }
}

//fincones nsfw

async function nsfwFun(URLimg) {
  try {
    if (!URLimg) {
      throw new Error("imagen no encontrada");
      console.log("imagen no encontrada");
    };

    const res = await fetch("/api/nsfw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageURL: URLimg }),
    });

    const ses = await res.json();

    return ses;

  } catch (error) {
    console.error("fallo en funcion de analisis")
  }

}

//funciones para olimpia:
async function facesFun(URLimg) {
  try {

    if (!URLimg) {
      console.warn("⚠️ facesFun recibió URL inválida:", URLimg);
      return true; // no bloquear por fallo
    }

    const res = await fetch("/api/faces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageURL: URLimg }),
    });

    if (!res.ok) {
      console.warn("⚠️ Error HTTP en faces:", res.status);
      return true;
    }

    const ses = await res.json();

    console.log("👤 Resultado faces:", ses);

    return Boolean(ses.allowed);

  } catch (error) {

    console.error("❌ fallo en función de análisis de rostros", error);

    return true;

  }
}

// ==============================
// --- GUARDAR EN MONGO ---
// ==============================
async function guardarEnMongo() {
  try {
    const nombre = EntradaNombre.value.trim();
    const por = EntradaPor.value.trim() || "Desconocido";
    const texto = EntradaCategs.value.toLowerCase().trim();
    const categ = texto ? texto.split(/\s+/) : [];
    const desk = EntradaDesc.value.trim();

    if (!nombre) {
      alert("❌ Debes poner un nombre.");
      return;
    }
    if (!cloudinaryURL) {
      alert("❌ Primero sube un archivo validado.");
      return;
    }

    const data = {
      nombre,
      ub: cloudinaryURL,
      por,
      categ,
      mimidesk: desk,
      email: email_user || "null",
    };

    console.log("💾 Guardando en MongoDB:", data);
    const res = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const resData = await res.json();
    console.log("📥 Respuesta de /api/db:", resData);

    if (!res.ok) {
      console.error("❌ Error en respuesta:", resData);
      alert("❌ Error guardando: " + (resData.error || "desconocido"));
      return;
    }

    alert("✅ Imagen guardada correctamente");
    window.location.href = "./index.html";
  } catch (err) {
    console.error("❌ Error en guardarEnMongo():", err);
    alert("❌ No se pudo guardar: " + err.message);
  }
}

// ==============================
// --- BOTÓN DE GUARDAR MANUAL ---
// ==============================
if (EntradaGuardar) {
  EntradaGuardar.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!archivoSeleccionado) {
      alert("❌ Selecciona un archivo primero.");
      return;
    }

    try {
      if (cloudinaryURL) {
        await guardarEnMongo();
      } else {
        alert("❌ Imagen no validada o no subida. Verifica los pasos anteriores.");
      }
    } catch (err) {
      console.error("❌ Error en evento guardar:", err);
      alert("⚠️ Error: " + err.message);
    }
  });
}

EntradaNombre.addEventListener('input', () => {
  EntradaNombre.value = EntradaNombre.value.slice(0, 30);
});

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