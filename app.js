// CONFIGURACIÓN DE SUPABASE
const SUPABASE_URL = "https://vdfxdydbggeoflagznuq.supabase.co";
const SUPABASE_KEY = "sb_publishable_1PItL4GwJ_y_8gfSqWFVXw_Tt0GoLsz";

// Inicializar el cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// FUNCIÓN PARA INICIAR SESIÓN
async function iniciarSesion() {
    // Capturar los datos de los inputs del index.html
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert("Por favor, complete todos los campos.");
        return;
    }

    // Petición de autenticación a Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        alert("Error al ingresar: " + error.message);
    } else {
        alert("¡Inicio de sesión exitoso! Redirigiendo...");
        // Redirección automática al panel principal
        window.location.href = "dashboard.html";
    }
}
