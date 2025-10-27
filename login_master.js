// === Elementos del DOM ===
const inputAdmin = document.querySelector(".entrada_admin");
const inputPassword = document.querySelector(".entrada_admin_passw");
const botonLogin = document.querySelector(".btnLoging");
const mensaje = document.querySelector(".cargador1"); // coincide con tu HTML

// === Variable global para almacenar admins ===
let globalAdmins = [];

// === Mostrar mensajes ===
function mostrarMensaje(texto, tipo = "info") {
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.style.color =
    tipo === "error" ? "red" : tipo === "exito" ? "green" : "black";
}

// === Cargar admins desde MongoDB ===
async function cargarAdmins() {
  try {
    const res = await fetch("/api/adminsDB", { method: "GET" });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const admins = await res.json();
    globalAdmins = admins;
    console.log("Admins cargados:", globalAdmins);
  } catch (err) {
    console.error("Error al cargar admins:", err);
    mostrarMensaje("No se pudo cargar la base de datos.", "error");
  }
}

// === Verificar login ===
function verificarYllevar() {
  const adminIngresado = inputAdmin.value.trim();
  const passIngresada = inputPassword.value.trim();


  if (!adminIngresado || !passIngresada) {
    mostrarMensaje("Completa ambos campos.", "error");
    return;
  }

  mostrarMensaje("Verificando...", "info");


  const encontrado = globalAdmins.find(
    (a) => a.admin === adminIngresado && a.password === passIngresada
  );
  console.log(encontrado)

  if (encontrado) {
    mostrarMensaje(`Bienvenido, ${encontrado.admin} ✅`, "exito");
    setTimeout(() => {
      window.location.href = "./admins.html"; // página del panel de admins
    }, 600);
  } else {
    mostrarMensaje("Usuario o contraseña incorrectos ❌", "error");
    alert("Acceso denegado. Serás redirigido al inicio.");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1500);
  }
}

// === Inicializar ===
document.addEventListener("DOMContentLoaded", async () => {
  await cargarAdmins();

  botonLogin.addEventListener("click", (e) => {
    e.preventDefault();
    verificarYllevar();
  });

  [inputAdmin, inputPassword].forEach((input) =>
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") verificarYllevar();
    })
  );
});
