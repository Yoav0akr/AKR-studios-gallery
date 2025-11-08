

// Función para guardar en MongoDB (tu lógica original)
async function guardarEnMongo(nombre,passw) {
  //llamr campos
const  nombre = document.querySelector(".entrada_admin");
const  passw = document.querySelector(".entrada_admin_passw");

    const data = { admin:nombre, password:passw};

  try {
    const res = await fetch("/api/adminsDB", {
      method: "new",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const saved = await res.json();
    console.log("Guardado en Mongo:", saved);
    alert("Se ha guardado correctamente");
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


// para rotar el logo y ocultar nav
const  navs = document.querySelector(".nav")
const logo = document.querySelector(".logo");
logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});