// nuevo.js
const botonCrear = document.getElementById("manchego");
const inputNombre = document.getElementById("nombre_imput");
const inputPassword = document.getElementById("por-imput");

botonCrear.addEventListener("click", async () => {
  const admin = inputNombre.value.trim();
  const password = inputPassword.value.trim();

  if (!admin || !password) {
    alert("Rellena ambos campos por favor.");
    return;
  }

  try {
    const res = await fetch("../api/adminsDB", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin, password })
    });

    const data = await res.json();

    if (data.success) {
      alert(`✅ Admin "${admin}" creado correctamente. Se guardó como adminpass: false`);
      inputNombre.value = "";
      inputPassword.value = "";
    } else {
      alert(`⚠️ Error: ${data.message || "No se pudo crear el admin"}`);
    }
  } catch (error) {
    console.error("Error creando admin:", error);
    alert("❌ Error creando admin. Revisa la consola.");
  }
});

//control de estilos js de la pagina:
// para rotar el logo y desplegar/ocultar nav
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});
