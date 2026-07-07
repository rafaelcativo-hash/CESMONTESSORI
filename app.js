// app.js - Mantén esto simple.
// No vuelvas a declarar 'supabase' aquí si ya lo haces en el index.html.
// Solo define la lógica de interacción.

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const pass = document.getElementById('pass').value;

            // Usamos la instancia 'db' que definimos en index.html
            // Nota: Asegúrate de que en index.html se llame 'db'
            try {
                const { error } = await db.auth.signInWithPassword({
                    email: email,
                    password: pass
                });

                if (error) {
                    alert("Error: " + error.message);
                } else {
                    window.location.href = "calificaciones.html";
                }
            } catch (err) {
                console.error("Error de conexión:", err);
            }
        });
    }
});
