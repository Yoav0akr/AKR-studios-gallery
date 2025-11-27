// nuevo.js
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
      body: JSON.stringify({ admin: nombre, password }),
    });

    let data;
    try {
      // intentamos parsear la respuesta como JSON
      data = await res.json();
    } catch (err) {
      // si falla, mostramos todo el texto recibido
      const text = await res.text();
      console.error("Respuesta no JSON:", text);
      alert("Error creando admin. Respuesta inesperada del servidor.");
      return;
    }

    console.log("Respuesta del backend:", data);

    if (!data.success) {
      alert(`Error creando admin: ${data.message || data.error || "Error desconocido"}`);
      return;
    }

    alert(`Usuario "${nombre}" creado correctamente`);
    window.location.href = "./existente.html"; // redirige al login
  } catch (err) {
    console.error("Error creando admin:", err);
    alert("Error creando admin. Revisa la consola para más detalles.");
  }
});

// === Control de estilo y nav ===
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  navigator.vibrate(200);
});
