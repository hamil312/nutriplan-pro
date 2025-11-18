//This is the UI Logic for the login view, handling user input and dispatching login actions to the Redux store
import store from "../store/index.js";
import { loginUser } from "../store/authSlice.js";

export function initLoginUI() {
    //We get references to the login section and main app section in the DOM
    const loginSection = document.getElementById("login");
    const appMain = document.getElementById("appMain");

    const form = document.getElementById("loginForm");
    const status = document.getElementById("loginStatus");

    //If the form is not found, log an error and return
    if (!form) {
        console.error("❌ loginForm no encontrado en el DOM");
        return;
    }

    //Event listener for form submission
    form.addEventListener("submit", async (e) => {
        //Prevent the default form submission behavior
        e.preventDefault();

        //Update status to indicate login is starting
        status.textContent = "Iniciando sesión...";
        status.className = "info";

        //Extract email and password from the form data
        const fd = new FormData(form);
        const email = fd.get("email");
        const password = fd.get("password");

        //Basic validation to ensure email and password are provided
        if (!email || !password) {
            status.textContent = "Debe ingresar email y contraseña";
            status.className = "error";
            return;
        }

        try {
            //We use the store to dispatch the loginUser action with the provided credentials
            await store.dispatch(loginUser({ email, password }));

            //Check the updated state to see if login was successful
            const state = store.getState();
            const user = state.auth.user;

            if (user) {
                //Checks if a user exists, and updates status content accordingly
                status.textContent = `Bienvenido ${user.email}`;
                status.className = "success";

                //We deactivate the login if a user is authenticated
                loginSection.style.display = "none";
                appMain.style.display = "block";
            } else {
                //Error messages when failing
                status.textContent = "Credenciales incorrectas";
                status.className = "error";
            }
        } catch (err) {
            status.textContent = "Error en la conexión con el servidor.";
            status.className = "error";
        }
    });

    //Through this Redux observer we change the UI when logging in
    store.subscribe(() => {
        //We get the state for the store
        const state = store.getState();
        if (state.auth.user) {
            loginSection.style.display = "none";
            appMain.style.display = "block";
        }
    });

    //Notify when successfully loading the Login UI
    console.log("%cLogin UI inicializado ✔️", "color:#22c55e; font-weight:bold;");
}