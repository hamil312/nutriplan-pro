import store from "../store/index.js";

let modalEl = null;
let contentEl = null;

/**
 * Crea el modal si no existe y lo agrega al DOM.
 */
function ensureModalExists() {
    if (modalEl) return;

    modalEl = document.createElement("div");
    modalEl.id = "recipeModal";
    modalEl.className = "recipe-modal hidden";

    modalEl.innerHTML = `
        <div class="recipe-modal-backdrop"></div>
        <div class="recipe-modal-content">
            <button class="modal-close-btn">✖</button>
            <div id="recipeModalBody" class="recipe-modal-body">
                Cargando...
            </div>
        </div>
    `;

    document.body.appendChild(modalEl);

    // Cerrar al hacer clic afuera
    modalEl.querySelector(".recipe-modal-backdrop").addEventListener("click", closeRecipeModal);

    // Cerrar con botón
    modalEl.querySelector(".modal-close-btn").addEventListener("click", closeRecipeModal);

    contentEl = document.getElementById("recipeModalBody");
}

/**
 * Abre el modal y carga datos.
 */
export async function openRecipeModal(recipeId) {
    ensureModalExists();

    modalEl.classList.remove("hidden");
    contentEl.innerHTML = `<p>Cargando...</p>`;

    // 1. Obtener receta desde Redux cache
    const state = store.getState();
    let recipe = state.recipes.cache[String(recipeId)];

    // 2. Si no está en cache → pedir al WorkerFacade vía worker
    if (!recipe) {
        console.log("Modal → receta no está en cache, solicitando al worker");
        if (typeof window.getRecipeById === "function") {
            recipe = await window.getRecipeById(String(recipeId));
        }
    }

    if (!recipe) {
        contentEl.innerHTML = `<p>No se pudo cargar la receta.</p>`;
        return;
    }

    // Renderizar
    contentEl.innerHTML = renderRecipeDetails(recipe);
}

/**
 * Cerrar modal
 */
export function closeRecipeModal() {
    if (modalEl) modalEl.classList.add("hidden");
}

/**
 * Plantilla de contenido del modal
 */
function renderRecipeDetails(r) {
    return `
        <h2>${escapeHtml(r.title)}</h2>

        <div class="modal-recipe-img">
            ${
                r.image
                    ? `<img src="${r.image}" alt="${escapeHtml(r.title)}" />`
                    : `<div class="no-thumb-big">🍽️</div>`
            }
        </div>

        <h3>Ingredientes</h3>
        <ul class="modal-ingredients">
            ${r.ingredients
                .map(i => `<li>${escapeHtml(i.name)} — ${i.quantity} ${escapeHtml(i.unit)}</li>`)
                .join("")}
        </ul>

        <h3>Instrucciones</h3>
        <ol class="modal-instructions">
            ${r.instructions
                .map(step => `<li>${escapeHtml(step)}</li>`)
                .join("")}
        </ol>
    `;
}

/** Sanear HTML */
function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[m]));
}