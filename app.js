// logica.js
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('loginBtn');
    
    if (btn) {
        btn.addEventListener('click', async () => {
            const email = document.getElementById('email').value;
            const pass = document.getElementById('pass').value;

            // 'window.db' es la variable que configuramos en index.html
            const { error } = await window.db.auth.signInWithPassword({
                email: email,
                password: pass
            });

            if (error) {
                alert("Error: " + error.message);
            } else {
                window.location.href = "calificaciones.html";
            }
        });
    }
});
