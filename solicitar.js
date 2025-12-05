document.addEventListener('DOMContentLoaded', async () => {

    // --- Verificar usuario ---
    const adminpass = localStorage.getItem('adminpass');
    const usuario = localStorage.getItem('admin');

    if (adminpass === "false") {
        alert('Debes estar registrado para acceder a esta página y para hacer solicitudes.');
        window.location.href = 'registro.html';
        return;
    } else {
        const nombreInput = document.querySelector('#nombre_imput');
        if (nombreInput) {
            nombreInput.value = usuario;
            nombreInput.disabled = true;
        }
    }

    // --- Elementos del formulario ---
    const id_foto = document.getElementById('id-foto'); // input del ID
    const motivo = document.getElementById('motivo_input');
    const descripcion = document.getElementById('descripcion_input');
    const botonSolicitar = document.getElementById('manchego');
    const visualizador = document.getElementById('mem'); // <img> para mostrar la imagen

    if (!id_foto || !motivo || !descripcion || !botonSolicitar || !visualizador) {
        console.error("❌ Faltan elementos en el HTML. Revisa los IDs.");
        return;
    }

    // --- Cargar imágenes desde MongoDB ---
    let imagenes = await cargarDesdeMongo();

    // --- Mostrar imagen al escribir el ID ---
    id_foto.addEventListener("input", () => {
        const value = id_foto.value.trim();
        const imagenEncontrada = imagenes.find(img => String(img.id) === value);
        visualizador.src = imagenEncontrada ? imagenEncontrada.ub : "";
    });

    // --- Función para crear solicitud ---
    function crearSolicitud() {
        return {
            id_foto: id_foto.value.trim(),
            solicitante: usuario,
            motivo: motivo.value.trim(),
            descripcion: descripcion.value.trim(),
            fecha: new Date().toLocaleDateString(),
        };
    }

    // --- Validar y enviar ---
    botonSolicitar.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!id_foto.value.trim() || !motivo.value.trim() || !descripcion.value.trim()) {
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

    // --- Funciones ---
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

});
