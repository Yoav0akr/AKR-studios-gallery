// Función para guardar en MongoDB


// Verificar si existe un admin habilitado en localStorage
(function () {
  const adminEnabled = localStorage.getItem("AdminEnabled");

  // Si NO existe, redirigir al index
  if (!adminEnabled) {
    window.location.href = "./index.html";
  }
})();


async function guardarEnMongo() {
  // Obtener valores de los inputs
  const nombreInput = document.querySelector(".entrada_admin");
  const passwInput = document.querySelector(".entrada_admin_passw");

  const data = { 
    admin: nombreInput.value, 
    password: passwInput.value 
  };

  try {
    const res = await fetch("/api/adminsDB", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const saved = await res.json();
    console.log("Guardado en Mongo:", saved);
    alert("Se ha guardado correctamente");

    // Redirección segura
    const enlace = document.createElement("a");
    enlace.href = "./admins.html";
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

  } catch (err) {
    console.error("Error al guardar en Mongo:", err);
    alert("No se pudo guardar. Revisa la consola.");
  }
}



// Rotar logo y ocultar nav (tu código original)
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});
