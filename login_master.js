// === Elementos del DOM ===
const inputAdmin = document.querySelector(".entrada_admin");
const inputPassword = document.querySelector(".entrada_admin_passw");
const botonLogin = document.querySelector("#loging");
const mensaje = document.querySelector(".cargador");

// === Mostrar mensajes ===
function mostrarMensaje(texto, tipo = "info") {
  mensaje.textContent = texto;
  mensaje.style.color =
    tipo === "error" ? "red" : tipo === "exito" ? "green" : "black";
}

// === Función para enviar login al backend ===
async function verificarYllevar() {
  const adminIngresado = inputAdmin.value.trim();
  const passIngresada = inputPassword.value.trim();

  if (!adminIngresado || !passIngresada) {
    mostrarMensaje("Completa ambos campos.", "error");
    return;
  }

  mostrarMensaje("Verificando...", "info");

  try {
    const res = await fetch("/api/adminsDB", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin: adminIngresado,
        password: passIngresada,
        login: true,
      }),
    });

    if (!res.ok) {
      // ❌ Usuario incorrecto: mensaje + redirección
      mostrarMensaje("Usuario o contraseña incorrectos ❌", "error");
      alert("Acceso denegado. Serás redirigido al inicio.");
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1000);
      return;
    }

    const data = await res.json();

    if (data.success) {
      mostrarMensaje("Bienvenido ✅", "exito");
      setTimeout(() => {
        window.location.href = "/admin.html"; // Página de panel admin
      }, 600);
    } else {
      mostrarMensaje("Usuario o contraseña incorrectos ❌", "error");
      alert("Acceso denegado. Serás redirigido al inicio.");
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1000);
    }
  } catch (err) {
    console.error(err);
    mostrarMensaje("Error al iniciar sesión.", "error");
    alert("Error al iniciar sesión. Serás redirigido al inicio.");
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 1000);
  }
}

// === Evento del botón ===
botonLogin.addEventListener("click", (e) => {
  e.preventDefault();
  verificarYllevar();
});

// === Permitir Enter para enviar ===
[inputAdmin, inputPassword].forEach((input) =>
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") verificarYllevar();
  })
);
