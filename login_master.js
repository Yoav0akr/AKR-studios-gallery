// === Cargar administradores desde la base ===
async function cargarDesdeMongo() {
  try {
    const res = await fetch("/api/adminDB", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const admins = await res.json();
    console.log("Cargado correctamente:", admins.length, "documentos");
    return admins;
  } catch (err) {
    console.error("Error al cargar desde Mongo:", err);
    alert("No se pudo cargar la base de datos.");
    return [];
  }
}

// === Variables globales ===
let globalAdmins = [];

// === Elementos del DOM ===
const inputAdmin = document.querySelector(".entrada_admin");
const inputPassword = document.querySelector(".entrada_admin_passw");
const botonLogin = document.querySelector(".loging");
const mensaje = document.querySelector(".cargador");

// === Inicialización ===
(async function init() {
  globalAdmins = await cargarDesdeMongo();
  console.log("Admins disponibles:", globalAdmins);
})();

// === Verificar credenciales ===
function verificarYllevar() {
  const adminIngresado = inputAdmin.value.trim();
  const passIngresada = inputPassword.value.trim();

  if (!adminIngresado || !passIngresada) {
    mostrarMensaje("Completa ambos campos.", "error");
    return;
  }

  const encontrado = globalAdmins.find(
    (a) => a.admin === adminIngresado && a.password === passIngresada
  );

  if (encontrado) {
    mostrarMensaje("Bienvenido, " + encontrado.admin + " ✅", "exito");

    // Crear enlace invisible
    const enlace = document.createElement("a");
    enlace.href = "/aaaaaaaaeeee"; // 👈 tu HTML de destino
    enlace.style.display = "none";
    document.body.appendChild(enlace);

    // Click automático tras pequeño delay
    setTimeout(() => {
      enlace.click();
      document.body.removeChild(enlace);
    }, 600);
  } else {
    mostrarMensaje("Usuario o contraseña incorrectos ❌", "error");
  }
}

// === Mostrar mensajes ===
function mostrarMensaje(texto, tipo = "info") {
  mensaje.textContent = texto;
  mensaje.style.color =
    tipo === "error" ? "red" : tipo === "exito" ? "green" : "black";
}

// === Evento del botón ===
botonLogin.addEventListener("click", (e) => {
  e.preventDefault();
  verificarYllevar();
});
