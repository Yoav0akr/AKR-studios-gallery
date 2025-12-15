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

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log("Respuesta login:", data);

    if (!data.success) {
      alert(data.message || "Credenciales incorrectas");
      return;
    }

    alert(`¡Bienvenido ${data.admin}!`);

    localStorage.setItem("admin", data.admin);
    localStorage.setItem("adminpass", String(data.adminpass));
    if (data.email) localStorage.setItem("email", data.email);

    window.location.href = "/index.html";

  } catch (err) {
    console.error("Error iniciando sesión:", err);
    alert("No se pudo conectar con el servidor.");
  }
});

// NAV
const navs = document.querySelector(".nav");
const logo = document.querySelector(".logo");

logo.addEventListener("click", () => {
  logo.classList.toggle("rotado");
  navs.classList.toggle("navhiden");
  if (navigator.vibrate) navigator.vibrate(200);
});
