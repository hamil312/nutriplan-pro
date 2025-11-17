import store from "../store/index.js";
import { loginUser } from "../store/authSlice.js";

/**
 * Inicializa la vista de Login: listeners, UI updates y conexión con Redux.
 */
export function initLoginUI() {

    const loginSection = document.getElementById("login");
    const appMain = document.getElementById("appMain");

    const form = document.getElementById("loginForm");
    const status = document.getElementById("loginStatus");

    if (!form) {
        console.error("❌ loginForm no encontrado en el DOM");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        status.textContent = "Iniciando sesión...";
        status.className = "info";

        const fd = new FormData(form);
        const email = fd.get("email");
        const password = fd.get("password");

        // Validación básica
        if (!email || !password) {
            status.textContent = "Debe ingresar email y contraseña";
            status.className = "error";
            return;
        }

        try {
            await store.dispatch(loginUser({ email, password }));

            const state = store.getState();
            const user = state.auth.user;

            if (user) {
                status.textContent = `Bienvenido ${user.email}`;
                status.className = "success";

                // Mostrar el layout principal
                loginSection.style.display = "none";
                appMain.style.display = "block";
            } else {
                status.textContent = "Credenciales incorrectas";
                status.className = "error";
            }
        } catch (err) {
            status.textContent = "Error en la conexión con el servidor.";
            status.className = "error";
        }
    });

    // Observador Redux → cambia la UI automáticamente si ya hay login
    store.subscribe(() => {
        const state = store.getState();
        if (state.auth.user) {
            loginSection.style.display = "none";
            appMain.style.display = "block";
        }
    });

    console.log("%cLogin UI inicializado ✔️", "color:#22c55e; font-weight:bold;");
}