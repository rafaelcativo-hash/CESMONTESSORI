// CONFIGURACIÓN DE SUPABASE (Reemplazar con tus credenciales de Supabase)
const SUPABASE_URL = "https://tu-proyecto-id.supabase.co";
const SUPABASE_KEY = "tu-anon-public-key-de-supabase";

// Instancia limpia evitando conflictos de nombres con la librería global
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioActual = null;
let esDocente = false;

// 1. CONTROL DE ACCESO (LOGIN DE USUARIOS)
async function iniciarSesion() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert("Por favor, rellene todos los campos.");
        return;
    }

    try {
        // Llamada corregida utilizando el cliente unificado y estable
        const { data, error } = await supabaseClient.auth.signInWithPassword({ 
            email: email, 
            password: password 
        });

        if (error) {
            alert("Error al iniciar sesión: " + error.message);
            return;
        }

        // Autenticación exitosa
        usuarioActual = data.user;
        alert("¡Inicio de sesión exitoso!");
        
        // Aquí puedes ejecutar la redirección o actualizar el menú visual
        // cargarInterfazUsuario();

    } catch (err) {
        console.error("Error inesperado:", err);
        alert("Ocurrió un error inesperado al conectar con el servidor.");
    }
}
