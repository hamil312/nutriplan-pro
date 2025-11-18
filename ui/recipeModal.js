//This file creates the modal for the recipe details
import store from "../store/index.js";

let modalEl = null;
let contentEl = null;

function ensureModalExists() {
    if (modalEl) return;
    //Verify if there is a modal element, if there isn't we create it

    //Create the modal as a div and add an id and className for it
    modalEl = document.createElement("div");
    modalEl.id = "recipeModal";
    modalEl.className = "recipe-modal hidden";

    //The basic innerHTML for the modal
    modalEl.innerHTML = `
        <div class="recipe-modal-backdrop"></div>
        <div class="recipe-modal-content">
            <button class="modal-close-btn">✖</button>
            <div id="recipeModalBody" class="recipe-modal-body">
                Cargando...
            </div>
        </div>
    `;

    //Append the modal to the DOM
    document.body.appendChild(modalEl);

    //Close the modal when clicking out of it
    modalEl.querySelector(".recipe-modal-backdrop").addEventListener("click", closeRecipeModal);

    //Close the modal when clicking the close button
    modalEl.querySelector(".modal-close-btn").addEventListener("click", closeRecipeModal);

    //Get and store the modal content in a variable
    contentEl = document.getElementById("recipeModalBody");
}

//Function to open the modal using the id
export async function openRecipeModal(recipeId) {
    //Check if the modal exists
    ensureModalExists();

    //Remove the hidden attribute from the modal to display it
    modalEl.classList.remove("hidden");
    //Display a message when loading
    contentEl.innerHTML = `<p>Cargando...</p>`;

    //We get the recipe from the Redux Store cache
    const state = store.getState();
    let recipe = state.recipes.cache[String(recipeId)];

    //If it's not in cache we get it from workerFacade
    if (!recipe) {
        console.log("Modal → receta no está en cache, solicitando al worker");
        if (typeof window.getRecipeById === "function") {
            //We get the recipeById, a worker function we can access to via window or main.js
            recipe = await window.getRecipeById(String(recipeId));
        }
    }

    //If it fails to get the recipe display a message
    if (!recipe) {
        contentEl.innerHTML = `<p>No se pudo cargar la receta.</p>`;
        return;
    }

    //Render the recipe details
    contentEl.innerHTML = renderRecipeDetails(recipe);
}

//Closes the modal by hiding it
export function closeRecipeModal() {
    if (modalEl) modalEl.classList.add("hidden");
}

//Render the modal content
function renderRecipeDetails(r) {
    //This function returns an HTML item with displaying the recipe information
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

//Function used to clean the strings and normalize them
function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[m]));
}