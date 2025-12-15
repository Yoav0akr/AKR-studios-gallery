const btn = document.getElementById("manchego");

btn.addEventListener("click", async () => {
  const nombre = document.getElementById("nombre_imput").value.trim();
  const password = document.getElementById("por-imput").value.trim();

  if (!nombre || !password) {
    alert("Debes llenar todos los campos");
    return;
  }

  try {
    const res = await fetch("./api/adminsDB", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admin: nombre, password, login: true }),
    });

    const data = await res.json();
    console.log("Respuesta login:", data);

    if (!data.success) {
      alert(`Error: ${data.message || data.error}`);
      return;
    }

    alert(`¡Bienvenido ${data.admin}!`);

    // Guardar en memoria local:
localStorage.setItem("admin", data.admin);
localStorage.setItem("adminpass", data.adminpass);
localStorage.setItem("email", data.email);

    window.location.href = "/index.html";

  } catch (err) {
    console.error("Error iniciando sesión:", err);
    alert("Error iniciando sesión. Revisa la consola.");
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
