
// Control de inicio (se ve si se inició sesión)

const adminpass = localStorage.getItem("adminpass");
const nombre_usuario = localStorage.getItem("admin");
const email_place = document.getElementById("perfil-email");
const rol_place = document.getElementById("perfil-rol");
//llenar los areas
user_place.innerText = nombre_usuario
email_place = await 


//control del nav
// para rotar el logo y desplegar/ocultar nav
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});