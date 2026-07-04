// CONFIGURACIÓN DE SUPABASE (Reemplaza con tus credenciales reales en producción)
const SUPABASE_URL = "https://tu-proyecto-id.supabase.co";
const SUPABASE_KEY = "tu-anon-public-key-de-supabase";

// Usamos supabaseClient para evitar confusiones con la librería global 'supabase'
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioActual = null;
let esDocente = false;

// 1. CONTROL DE ACCESO (LOGIN)
async function iniciarSesion() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert("Por favor, rellene todos los campos.");
        return;
    }

    try {
        // Autenticación con Supabase Auth utilizando el cliente correcto
        const { data, error } = await supabaseClient.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });

        if (error) {
            alert("Error al iniciar sesión: " + error.message);
            return;
        }

        // Si el login es exitoso, guardamos el usuario
        usuarioActual = data.user;
        alert("¡Inicio de sesión exitoso!");
        
        // Aquí puedes agregar la función para redigir al usuario o cargar el menú
        // ejemplo: cargarInterfazUsuario();

    } catch (err) {
        console.error("Error inesperado:", err);
        alert("Ocurrió un error inesperado al intentar conectar con el servidor.");
    }
}
}
