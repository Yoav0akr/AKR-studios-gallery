const btn = document.getElementById("manchego");

btn.addEventListener("click", async () => {
  const nombre = document.getElementById("nombre_imput").value.trim();
  const password = document.getElementById("por-imput").value.trim();

  if (!nombre || !password) {
    alert("Debes llenar todos los campos");
    return;
  }

  try {
    const res = await fetch("/api/adminsDB", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: nombre, password }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(`Error creando admin: ${data.message || data.error}`);
      return;
    }

    alert(`Usuario "${nombre}" creado correctamente`);
    window.location.href = "./existente.html"; // redirige al login
  } catch (err) {
    console.error("Error creando admin:", err);
    alert("Error creando admin. Revisa la consola.");
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
