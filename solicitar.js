// Verificar si el usuario está registrado
const usuario = localStorage.getItem('usuarioRegistrado');
if (!usuario) {
    alert('Debes estar registrado para acceder a esta página y para hacer solicitudes.');
    // window.location.href = 'registro.html';
} else {
    const inp = document.getElementById('nombre_imput');
    inp.value = usuario;
    inp.disabled = true;
}

// Cargar imágenes desde Mongo
const imagenes = await cargarDesdeMongo();

// Elementos del formulario
const id_foto = document.getElementById('id_foto');
const motivo = document.getElementById('motivo_input');
const descripcion = document.getElementById('descripcion_input');
const botonSolicitar = document.getElementById('manchego');

// Función para crear el objeto solicitud
function crearSolicitud() {
    return {
        id_foto: id_foto.value.trim(),
        solicitante: usuario,
        motivo: motivo.value.trim(),
        descripcion: descripcion.value.trim(),
        fecha: new Date().toLocaleDateString(),
    };
}

// Validar y enviar
botonSolicitar.addEventListener('click', async (e) => {
    e.preventDefault();

    if (
        id_foto.value.trim() === "" ||
        motivo.value.trim() === "" ||
        descripcion.value.trim() === ""
    ) {
        alert('Por favor, completa todos los campos antes de enviar la solicitud.');
        return;
    }

    try {
        await guardar_solicitud(crearSolicitud());
        window.location.href = './index.html';
    } catch (error) {
        console.error("Error guardando la solicitud:", error);
        alert("No se pudo guardar la solicitud.");
    }
});

// Guardar solicitud en MongoDB
async function guardar_solicitud(solicitud) {
    const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(solicitud),
    });

    if (!res.ok) throw new Error(`Error ${res.status}`);

    const saved = await res.json();
    console.log("Guardado en Mongo:", saved);
    alert("Se ha guardado correctamente, espere a que un admin revise su solicitud.");
}

// Cargar imágenes base
async function cargarDesdeMongo() {
    try {
        const res = await fetch("/api/db");

        if (!res.ok) throw new Error(`Error ${res.status}`);

        const data = await res.json();
        console.log("Cargadas:", data.length, "imágenes");
        return data;
    } catch (err) {
        console.error("Error al cargar desde Mongo:", err);
        return [];
    }
}

// Mostrar imagen al escribir el ID
id_foto.addEventListener("input", () => {
    ejecucion(id_foto.value.trim());
});

function ejecucion(value) {
    const visualisador = document.getElementById("mem");
    if (!visualisador) return;

    const imagenEncontrada = imagenes.find(img => String(img.codigo) === value);

    visualisador.src = imagenEncontrada ? imagenEncontrada.ub : "";
}
