const emailInput = document.getElementById("email_input");
const nombreInput = document.getElementById("nombre_input");
const passwordInput = document.getElementById("password_input");
const btn = document.getElementById("manchego");

// Crear usuario
async function crearUsuario() {
  const email = emailInput.value.trim();
  const admin = nombreInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !admin || !password) {
    alert("Llena todos los campos");
    return;
  }

  try {
    // 1️⃣ Verificar si el admin ya existe
    const check = await fetch(`/api/adminsDB?admin=${admin}`);
    const existe = await check.json();

    if (existe.exists) {
      alert("Ese usuario ya existe");
      nombreInput.value = "";
      return;
    }

    // 2️⃣ Crear admin
    const res = await fetch("/api/adminsDB", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        admin,
        email,
        password
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Error creando usuario");
      return;
    }

    alert("Cuenta creada correctamente");

    // Guardar sesión
    localStorage.setItem("admin", admin);
    localStorage.setItem("email", email);
    localStorage.setItem("adminpass", "false");

    window.location.href = "/index.html";

  } catch (err) {
    console.error("Error:", err);
    alert("Error de conexión");
  }
}

// Evento
btn.addEventListener("click", crearUsuario);

// NAV
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
});
