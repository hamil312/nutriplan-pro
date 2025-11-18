//This handles the planner UI logic, it's the main page, so it's also the biggest one
import store from "../store/index.js";
import { addRecipeToSlot } from "../store/plannerSlice.js";
import { openRecipeModal } from "./recipeModal.js";
import { initSearchUI } from "./search.js";
import { initShoppingListUI } from "./shoppingList.js";
import { strategies, defaultStrategy } from "../patterns/strategy/index.js";
import workerFacade from "../services/workerFacade.js";
import { setPlanner } from "../store/plannerSlice.js";

//This function initializes the UI for the planner
export function initPlannerUI() {
    //We get the area for the main app rendering and store it in a variable
    const appMain = document.getElementById("appMain");
    //If it fails to find the appMain element
    if (!appMain) {
        //Throw an error message
        console.error("initPlannerUI: #appMain no encontrado");
        return;
    }

    //Verifies if the planner-layout element exists to avoid duplicating it whenever repainting the screen is necessary
    if (document.getElementById("planner-layout")) {
        //It throws a warning if it detects it could be creating a duplicate
        console.warn("Planner ya inicializado, evitando duplicado.");
        return;
    }

    //Clearing the innerHTML for the main app, leaving it free to paint the planner
    appMain.innerHTML = "";

    //Creating the base layout
    const layoutId = "planner-layout";
    appMain.innerHTML = `
        <div id="${layoutId}" class="planner-container">
            <aside class="recipes-panel">
                <div id="recipesList" class="recipes-list"></div>
            </aside>

            <main class="planner-panel">
                <div class="planner-grid-header" id="plannerGridHeader"></div>
                <div class="planner-grid" id="plannerGrid"></div>

                <div class="planner-report-bar">
                    <select id="reportStrategySelect">
                        <option value="CALORIE_FOCUS">Reporte por Calorías</option>
                        <option value="MACRO_FOCUS">Reporte por Macronutrientes</option>
                    </select>
                    <button id="generateReportBtn">Generar reporte semanal</button>
                </div>

                <div id="weeklyReportOutput" class="weekly-report-output"></div>
            </main>

            <aside class="shopping-panel">
                <h3>Lista de compras</h3>
                <div id="shoppingPreview">(Generada automáticamente)</div>
            </aside>
        </div>
    `;

    //We store the planner on localStorage, allowing us to load it when logging in
    const savedPlannerRaw = localStorage.getItem("nutriPlanner");
    //If it finds a planner
    if (savedPlannerRaw) {
        try {
            //Transform the saved object before using
            const parsed = JSON.parse(savedPlannerRaw);

            //If it finds a planner in the object, trigger the redux function to set it
            if (parsed.planner) store.dispatch(setPlanner(parsed.planner));
            //If it finds recipes, it gets them and sets them in the store
            if (parsed.recipesCache) store.dispatch({
                type: "recipes/restoreCache",
                payload: parsed.recipesCache
            });

        } catch (err) {
            console.warn("⚠️ Planner corrupto, usando uno vacío.");
        }
    }

    //Saves all of the changes made to the planner, we get the planner through the redux observer
    store.subscribe(() => {
        //Store the state of the observer in a variable
        const state = store.getState();
        //Getting from the state the information about the planner and the recipesCache, to load them on logIn
        const toSave = {
            planner: state.planner,
            recipesCache: state.recipes.cache
        };
        //We store it using LocalStorage
        localStorage.setItem("nutriPlanner", JSON.stringify(toSave));
    });

    //Timed function that waits 100 miliseconds for the planner to load and recalculates the shoppingList when logging in, allowing for the list to be updated with the recipes values after retrieving them from localStorage
    setTimeout(async () => {
        //We get the recipes and the planner from the redux store
        const { planner, recipes } = store.getState();
        //This function recalculates the values of the shopping list
        const result = await workerFacade.recalculateShoppingList(
            planner,
            recipes.cache,
            {}
        );

        //The observer dispatches a payload using the items obtained from the recalculating function
        store.dispatch({
            type: "shoppingList/setFullList",
            payload: result.items
        });
    }, 100);

    //Storing the recipes-panel element in a variable in order to modify it
    const recipesPanel = document.querySelector(".recipes-panel");
    //Create the leftPanel for search results
    const leftPanel = document.createElement("div");
    //Assign a className to allow updating this class without affecting others
    leftPanel.className = "custom-left-panel";
    //Append the leftPanel to the recipesPanel of the planner
    recipesPanel.appendChild(leftPanel);

    //Call the functions that initialize the ShoppingListUI and the SearchUI
    initShoppingListUI();
    initSearchUI(leftPanel);

    //Helpers that allow to create the planner grid
    const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const dayLabels = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
    const meals = ["breakfast","lunch","dinner"];
    const mealLabels = { breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena" };

    //Store elements on a variable to modify them
    const recipesListEl = document.getElementById("recipesList");
    const plannerGridEl = document.getElementById("plannerGrid");
    const plannerGridHeader = document.getElementById("plannerGridHeader");
    const shoppingPreview = document.getElementById("shoppingPreview");

    //Function to render the header
    function renderGridHeader() {
        //If it doesn't find the element return
        if (!plannerGridHeader) return;

        //We set the innerHTML for the header
        plannerGridHeader.innerHTML =
            `<div class="corner-cell"></div>` +
            days.map((d, i) =>
                `<div class="grid-day-header" data-day="${d}">${dayLabels[i]}</div>`
            ).join("");
    }

    //Create a slot
    function createSlot(day, meal) {
        //Each slot is a divElement, we create the element and assign it a className
        const slot = document.createElement("div");
        slot.className = "slot";
        //Store the day info and meal on the slotDataset
        slot.dataset.day = day;
        slot.dataset.meal = meal;

        //Modify the slot's innerHTML element
        slot.innerHTML = `
            <div class="slot-meal">${mealLabels[meal]}</div>
            <div class="slot-content" data-day="${day}" data-meal="${meal}"></div>
            <button class="clear-slot" title="Eliminar">✖</button>
        `;

        //We create a dragover eventListener, to handle the action of dragging meals to a slot
        slot.addEventListener("dragover", (ev) => {
            ev.preventDefault();
            //We add the drag-over class element to the slots classList which stores the element's subclasses
            slot.classList.add("drag-over");
        });

        //We create a dragleave eventListener to remove the element from the slot
        slot.addEventListener("dragleave", () => {
            slot.classList.remove("drag-over");
        });

        //We add a drop eventListener to handle registering the addition of an element to a slot on the observer
        slot.addEventListener("drop", (ev) => {
            ev.preventDefault();
            slot.classList.remove("drag-over");

            //Get the data for the element
            const recipeId = ev.dataTransfer.getData("text/plain");
            if (recipeId) {
                //If the recipe exits we add it through our redux store
                store.dispatch(addRecipeToSlot({
                    day, meal, recipeId
                }));
            }
        });

        //This handles the event of clicking the button to remove a recipe from a slot
        slot.querySelector(".clear-slot").addEventListener("click", (e) => {
            //Stop propagation prevents eliminating other elements with the same ID
            e.stopPropagation();
            //This is the way the observer handles elimination of a recipe from a slot, by passing it an empty item
            store.dispatch(addRecipeToSlot({
                day, meal, recipeId: null
            }));
        });

        //Return the slot
        return slot;
    }

    //This is the function to render the planner grid
    function renderGrid(plannerState) {
        //If it fails to find the element, return empty
        if (!plannerGridEl) return;
        //We empty the plannerGridEl to avoid possible duplication errors
        plannerGridEl.innerHTML = "";

        //For each meal of the day (Breakfast, lunch, dinner) we create a div element
        meals.forEach(meal => {
            //Create a row element and give it a className
            const row = document.createElement("div");
            row.className = "grid-row";

            //Create a div element to make it the label of the meal on the grid
            const mealLabelCell = document.createElement("div");
            mealLabelCell.className = "meal-label-cell";
            //We make it so it displays the meal name on its space
            mealLabelCell.textContent = mealLabels[meal];
            //Append the label to the row element
            row.appendChild(mealLabelCell);

            //For each day we create a slot for a day and a meal, so we can drag and drop to it
            days.forEach(day => {
                //Create the slot element
                const slot = createSlot(day, meal);
                const content = slot.querySelector(".slot-content");

                //Store the assigned id for the element of the day
                const assignedId = plannerState[day]?.[meal];
                if (assignedId) {
                    //If it finds an assigned ID, get the recipe information from cache
                    const recipe = store.getState().recipes.cache[String(assignedId)];

                    if (recipe) {
                        //If it returns the recipe, render the card for the recipe in the planner
                        content.innerHTML = renderRecipeCardInner(recipe);
                        //Assign the element .recipe-card to modify it
                        const inner = content.querySelector(".recipe-card");
                        //We use a function to add dragging handlng to the card on the planner
                        attachDragHandlersToCard(inner, recipe.id);
                    }
                } else {
                    //If there is no recipe on the slot placeholder text
                    content.innerHTML = `<div class="slot-placeholder">Arrastra una receta</div>`;
                }

                //Append the slot to the row
                row.appendChild(slot);
            });

            //Append the row to the grid
            plannerGridEl.appendChild(row);
        });
    }

    //Function to render the card for the recipe
    function renderRecipeCardInner(recipe) {
        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <div class="recipe-thumb">
                    ${
                        recipe.image
                            ? `<img src="${recipe.image}" alt="${recipe.title}" />`
                            : `<div class="no-thumb">🍽</div>`
                    }
                </div>
                <div class="recipe-meta">
                    <div class="recipe-title">${escapeHtml(recipe.title)}</div>
                </div>
            </div>
        `;
    }

    //Function to render the recipe panel
    function renderRecipesPanel() {
        //Get and save the store state on a variable for later usage
        const state = store.getState();
        //In a list we store the searchResults, depending on if its empty or not we retrieve the searchResults or the cached recipes
        const list =
            state.recipes.searchResults?.length
                ? state.recipes.searchResults
                : Object.values(state.recipes.cache);

        //Check if the recipeList element exist, clear it if it does
        if (!recipesListEl) return;
        recipesListEl.innerHTML = "";

        if (!list.length) {
            //If the list is empty render this
            recipesListEl.innerHTML = `<div class="no-recipes">No hay recetas.</div>`;
            return;
        }

        list.forEach(r => {
            //For each element in the list, we create a div element, assign it a className and render a recipe card in it
            const wrap = document.createElement("div");
            wrap.className = "recipe-pool-item";
            wrap.innerHTML = renderRecipeCardInner(r);
            const card = wrap.querySelector(".recipe-card");
            //Use this function to add drag handlers to a card
            attachDragHandlersToCard(card, r.id);
            //We add the element to the DOM element
            recipesListEl.appendChild(wrap);
        });
    }

    //Function to add dragHandlers to card elements
    function attachDragHandlersToCard(cardEl, id) {
        if (!cardEl) return;
        //Verify the existence, then set the draggable attribute to true
        cardEl.setAttribute("draggable", "true");

        //Add an eventListener for dragstart
        cardEl.addEventListener("dragstart", (ev) => {
            //Set the data that will be transfered after successfully dragging
            ev.dataTransfer.setData("text/plain", id);
            //Add a dragging element to the classlist
            cardEl.classList.add("dragging");
        });

        //Add a dragend event listener
        cardEl.addEventListener("dragend", () => {
            //Remove the dragging element from the classList, because we are no longer dragging the element
            cardEl.classList.remove("dragging");
        });

        //Cards are clickable, when clicked they show a modal with details about the recipe
        cardEl.addEventListener("click", () => {
            openRecipeModal(id);
        });
    }

    //Clean strings by removing or replacing certain elements
    function escapeHtml(s) {
        return String(s || "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
    }

    //Re render results and shoppingList on change, using information from the global state
    function renderFromState() {
        const state = store.getState();

        renderRecipesPanel();
        renderGrid(state.planner);
        renderShopping(state.shoppingList);
    }

    //Function to render the ShoppingList
    function renderShopping(listState) {
        if (!shoppingPreview) return;
        
        //Create a list of items to store the ingredients from the state
        const items = listState.items || {};

        //If there are items in the list, render them, and their quantities
        shoppingPreview.innerHTML = Object.keys(items).length
            ? Object.values(items)
                .map(i => `
                    <div class="shopping-item${i.bought ? " bought" : ""}">
                        ${escapeHtml(i.name)} — ${i.quantity} ${escapeHtml(i.unit)}
                    </div>
                `)
                .join("")
            : "(Vacía)";
    }

    //Generate the weekly report
    async function generateWeeklyReport() {
        //We save the store state on a variable for later use
        const state = store.getState();
        //Store the planner from the state and the recipes from the cache
        const planner = state.planner;
        const recipesCache = state.recipes.cache;

        //We get the value of the reportStrategySelect element, this allows us to select the strategy we'll use for the report
        const mode = document.getElementById("reportStrategySelect").value;

        //Using the workerFacade we can create and store the nutritionReport using the information stored on the planner
        const { report } = await workerFacade.generateNutritionReport(
            planner,
            mode,
            recipesCache
        );

        //Store in a variable the dom element for the report
        const output = document.getElementById("weeklyReportOutput");
        if (output) {
            //If the element exist, we add our report to display it on screen
            output.textContent = JSON.stringify(report, null, 2);
        }
    }

    //Add the event listener for clicking the button to generate a report, triggering the function
    document.getElementById("generateReportBtn")
        .addEventListener("click", generateWeeklyReport);

    //Render the header and the planner using the functions
    setTimeout(() => {
        renderGridHeader();
        renderFromState();
        const unsubscribe = store.subscribe(renderFromState);
        window.destroyPlannerUI = unsubscribe;
    }, 0);

    console.log("Planner UI initialized ✔");
}