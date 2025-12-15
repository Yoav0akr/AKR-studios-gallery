const email = document.getElementById("email_input");
const nombre_usuario = document.getElementById("nombre_input");
const password = document.getElementById("password_input");
const BtCrearUser = document.getElementById("manchego");

// ==============================
//  CREAR USUARIO
// ==============================
async function CreateUser(email, user, pass) {
  const datosUSER = {
    admin: user,
    password: pass,
    email,
    login: false
  };

  const res = await fetch("./api/adminsDB", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosUSER)
  });

  if (!res.ok) throw new Error("Error " + res.status);

  alert("Te has unido a la comunidad de AKR Studios exitosamente");

  localStorage.setItem("admin", user);
  localStorage.setItem("adminpass", "false");
  localStorage.setItem("email", email);

  window.location.href = "./index.html";
}

// ==============================
//  VERIFICAR Y CREAR
// ==============================
async function execute() {
  try {
    const admin = nombre_usuario.value.trim();

    const res = await fetch(`./api/adminsDB?admin=${admin}`);

    if (!res.ok) {
      throw new Error("Error verificando usuario");
    }

    const existe = await res.json();

    if (existe.exists) {
      alert(admin + " ya existe");
      nombre_usuario.value = "";
      return;
    }

    await CreateUser(
      email.value.trim(),
      admin,
      password.value.trim()
    );

  } catch (err) {
    console.error("Error al crear usuario:", err);
    alert("No se pudo crear el usuario");
  }
}

// ==============================
//  BOTÓN
// ==============================
BtCrearUser.addEventListener("click", () => {
  if (
    !nombre_usuario.value.trim() ||
    !password.value.trim() ||
    !email.value.trim()
  ) {
    alert("Llena todos los campos");
  } else {
    execute();
  }
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
