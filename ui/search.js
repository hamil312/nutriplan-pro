//This is the UI logic for the search system
import store from "../store/index.js";

//Function to initialize the Search UI
export function initSearchUI(rootElement) {

    //The starting state of the innerHTML element for the search UI
    rootElement.innerHTML = `
        <div class="recipes-panel">
            <div class="recipes-header">
                <input id="searchInput" placeholder="Buscar recetas..." />
                <button id="searchBtn">Buscar</button>
            </div>
            <div class="recipes-list" id="recipesResults"></div>
        </div>
    `;

    //We select items by their identificator and assign them to a variable
    const input = rootElement.querySelector("#searchInput");
    const button = rootElement.querySelector("#searchBtn");

    //The function to handle the search process
    const triggerSearch = () => {
        //Query takes the value from the input element in the DOM, removing whitespaces through trim
        const query = input.value.trim();
        if (!query) return;

        //Triggers the main.js function for searching recipes through the window object
        window.searchRecipes(query);
    };

    //Detect when the button is clicked and triggers the function to search
    button.addEventListener("click", triggerSearch);
    //It alternatively detects when a certain key is pressed
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") triggerSearch();
    });

    //Updating through the redux store by getting the recipes from the store state and saving them on a variable
    store.subscribe(() => {
        const { searchResults } = store.getState().recipes;
    });
}