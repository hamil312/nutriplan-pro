import store from "../store/index.js";

/**
 * Inicializa el panel de búsqueda:
 * - Input de texto
 * - Botón de buscar
 * - Lista de resultados
 */
export function initSearchUI(rootElement) {

    rootElement.innerHTML = `
        <div class="recipes-panel">
            <div class="recipes-header">
                <input id="searchInput" placeholder="Buscar recetas..." />
                <button id="searchBtn">Buscar</button>
            </div>
            <div class="recipes-list" id="recipesResults"></div>
        </div>
    `;

    const input = rootElement.querySelector("#searchInput");
    const button = rootElement.querySelector("#searchBtn");
    const resultsContainer = rootElement.querySelector("#recipesResults");

    // ============================================================
    // 1. Ejecutar búsqueda
    // ============================================================
    const triggerSearch = () => {
        const query = input.value.trim();
        if (!query) return;

        resultsContainer.innerHTML = `<p>Buscando...</p>`;
        window.searchRecipes(query);
    };

    button.addEventListener("click", triggerSearch);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") triggerSearch();
    });

    // ============================================================
    // 2. Reaccionar a cambios en Redux (searchResults)
    // ============================================================
    store.subscribe(() => {
        const state = store.getState();
        const results = state.recipes.searchResults;

        resultsContainer.innerHTML = renderRecipeList(results);
    });
}


/**
 * Renderiza los resultados como tarjetas arrastrables.
 */
function renderRecipeList(recipes) {
    if (!recipes || recipes.length === 0) {
        return `<p>No hay resultados.</p>`;
    }

    return recipes
        .map(recipe => `
            <div class="recipe-card recipe-pool-item"
                 draggable="true"
                 data-id="${recipe.id}">
                 
                <div class="recipe-thumb">
                    ${
                        recipe.image
                            ? `<img src="${recipe.image}" alt="${recipe.title}" />`
                            : `<div class="no-thumb">🍽️</div>`
                    }
                </div>

                <div class="recipe-info">
                    <strong>${recipe.title}</strong>
                </div>
            </div>
        `)
        .join("");
}