const email = document.getElementById("email_imput");
const nombre_usuario = document.getElementById("nombre_imput");
const pasword = document.getElementById("pasword_inpu");
const BtCrearUser = document.getElementById("manchego");

// Crear usuario
async function CreateUser(email, user, pasw) {
  const datosUSER = { admin: user, password: pasw, email, login: false };

  const res = await fetch("./api/adminsDB", {
    method: "POST",
    body: JSON.stringify(datosUSER),
  });

  if (!res.ok) throw new Error("Error " + res.status);

  alert("Te has unido a la comunidad de AKR Studios exitosamente");

  localStorage.setItem("admin", user);
  localStorage.setItem("adminpass", "false");
  localStorage.setItem("email", email);

  window.location.href = "./index.html";
}

// Ver si existe y crear
async function execute() {
  try {
    const admin = nombre_usuario.value.trim();

    // GET usando query
    const res = await fetch(`./api/adminsDB?admin=${admin}`, {
      method: "GET"
    });

    const existe = await res.json();

    if (existe.exists) {
      alert(admin + " ya existe");
      nombre_usuario.value = "";
      return;
    }

    // Crear usuario
    CreateUser(
      email.value.trim(),
      nombre_usuario.value.trim(),
      pasword.value.trim()
    );

  } catch (err) {
    console.error("Error al crear usuario", err);
  }
}

BtCrearUser.addEventListener("click", () => {
  if (!nombre_usuario.value.trim() ||
      !pasword.value.trim() ||
      !email.value.trim()) {
  
    alert("Llena todos los campos");
  } else {
    execute();
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
