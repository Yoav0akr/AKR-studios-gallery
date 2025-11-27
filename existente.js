const btnLogin = document.getElementById("manchego");
const nombreInput = document.getElementById("nombre_imput");
const passInput = document.getElementById("por-imput");

btnLogin.addEventListener("click", async () => {
  const nombre = nombreInput.value.trim();
  const pass = passInput.value.trim();

  if (!nombre || !pass) {
    alert("Rellena ambos campos!");
    return;
  }

  try {
    // Consultar todos los usuarios
    const res = await fetch("./api/adminsDB");
    if (!res.ok) throw new Error("Error al consultar usuarios");

    const usuarios = await res.json();

    // Buscar el usuario por nickname
    const usuario = usuarios.find(u => u.admin === nombre);

    if (!usuario) {
      alert("Usuario no encontrado!");
      return;
    }

    // Validar contraseña
    if (usuario.por !== pass) {
      alert("Contraseña incorrecta!");
      return;
    }

    // Guardar sesión local (puedes usar adminpass si quieres un simple flag)
    localStorage.setItem("sesionAdmin", JSON.stringify({
      nombre: usuario.admin,
      adminpass: usuario.adminpass
    }));

    alert("¡Bienvenido " + usuario.admin + "!");
    window.location.href = "/index.html"; // Redirige a panel de fotos o admin

  } catch (err) {
    console.error(err);
    alert("Ocurrió un error, revisa la consola");
  }
});


// para rotar el logo y desplegar/ocultar nav
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});