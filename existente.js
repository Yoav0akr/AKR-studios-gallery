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
      body: JSON.stringify({
        admin: nombre,
        password,
        login: true
      }),
    });

    const data = await res.json(); // <-- obtener JSON primero

    if (!res.ok) {
      // Mostrar mensaje de backend si hay error
      alert(data.message || `Error HTTP ${res.status}`);
      console.error("Error login:", data);
      return;
    }

    if (!data.success) {
      alert(data.message || "Credenciales incorrectas");
      return;
    }

    // ✅ Login exitoso
    localStorage.setItem("admin", data.admin);
    localStorage.setItem("adminpass", String(data.adminpass));
    if (data.email) localStorage.setItem("email", data.email);

    alert(`¡Bienvenido ${data.admin}!`);
    window.location.href = "/index.html";

  } catch (err) {
    console.error("Error conectando al servidor:", err);
    alert("No se pudo conectar con el servidor.");
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
