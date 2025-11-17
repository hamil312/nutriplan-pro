import store from "../store/index.js";
import { addRecipeToSlot, setPlanner } from "../store/plannerSlice.js";
import { addRecipesToCache } from "../store/recipesSlice.js";
import { openRecipeModal } from "./recipeModal.js";
import { initSearchUI } from "./search.js";
import { initShoppingListUI } from "./shoppingList.js";
import { strategies, defaultStrategy } from "../patterns/strategy/index.js";


export function initPlannerUI() {
    const appMain = document.getElementById("appMain");

    if (!appMain) {
        console.error("initPlannerUI: #appMain no encontrado");
        return;
    }

    // Evita re-render completo si ya existe el layout
    if (document.getElementById("planner-layout")) {
        console.warn("Planner ya inicializado, evitando duplicado.");
        return;
    }

    // Limpiar solo una vez
    appMain.innerHTML = "";
    if (!appMain) {
        console.error("initPlannerUI: #appMain no encontrado");
        return;
    }

    // Render base layout si no existe
    const layoutId = "planner-layout";
    if (!document.getElementById(layoutId)) {
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
    }

    // Ahora sí, insertar el panel dinámico en su lugar correcto:
    const recipesPanel = document.querySelector(".recipes-panel");
    const leftPanel = document.createElement("div");
    leftPanel.className = "custom-left-panel";

    if (recipesPanel) {
        recipesPanel.appendChild(leftPanel);
    }

    initShoppingListUI();
    initSearchUI(leftPanel);

    // Helpers
    const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
    const dayLabels = ["Lun","Mar","Mie","Jue","Vie","Sab","Dom"];
    const meals = ["breakfast","lunch","dinner"];
    const mealLabels = { breakfast: "Desayuno", lunch: "Almuerzo", dinner: "Cena" };

    const recipesListEl = document.getElementById("recipesList");
    const plannerGridEl = document.getElementById("plannerGrid");
    const plannerGridHeader = document.getElementById("plannerGridHeader");
    const shoppingPreview = document.getElementById("shoppingPreview");

    // Render header days
    function renderGridHeader() {
        plannerGridHeader.innerHTML = `<div class="corner-cell"></div>` + days.map((d, i) => `
            <div class="grid-day-header" data-day="${d}">${dayLabels[i]}</div>
        `).join("");
        if (!plannerGridHeader) {
            console.error("plannerGridHeader no encontrado");
            return;
        }
    }

    // Create a slot element
    function createSlot(day, meal) {
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.dataset.day = day;
        slot.dataset.meal = meal;
        slot.innerHTML = `<div class="slot-meal">${mealLabels[meal]}</div>
                        <div class="slot-content" data-day="${day}" data-meal="${meal}"></div>
                        <button class="clear-slot" title="Eliminar">✖</button>`;

        // Drag events
        slot.addEventListener("dragover", (ev) => {
            ev.preventDefault();
            slot.classList.add("drag-over");
        });
        slot.addEventListener("dragleave", () => {
            slot.classList.remove("drag-over");
        });

        slot.addEventListener("drop", (ev) => {
            ev.preventDefault();
            slot.classList.remove("drag-over");
            const data = ev.dataTransfer.getData("text/plain");
            if (!data) return;
            const recipeId = data;
            const { day: sday, meal: smeal } = slot.dataset;
            // Dispatch addRecipeToSlot
            store.dispatch(addRecipeToSlot({ day: sday, meal: smeal, recipeId }));
        });

        // Clear button
        slot.querySelector(".clear-slot").addEventListener("click", (e) => {
            e.stopPropagation();
            const sday = slot.dataset.day;
            const smeal = slot.dataset.meal;
            store.dispatch(addRecipeToSlot({ day: sday, meal: smeal, recipeId: null }));
        });

        return slot;
    }

    // Render grid (days x meals)
    function renderGrid(plannerState) {
        // create rows per meal, columns per day
        plannerGridEl.innerHTML = "";
        if (!plannerGridEl) {
            console.error("plannerGrid no encontrado");
            return;
        }
        // For each meal, create a row with one slot per day
        meals.forEach(meal => {
            const row = document.createElement("div");
            row.className = "grid-row";
            // meal-label on left for accessibility (we'll render inside slot as well)
            const mealLabelCell = document.createElement("div");
            mealLabelCell.className = "meal-label-cell";
            mealLabelCell.textContent = mealLabels[meal];
            row.appendChild(mealLabelCell);

            days.forEach(day => {
                const slot = createSlot(day, meal);
                const content = slot.querySelector(".slot-content");
                if (!content) return;
                const assignedId = plannerState[day] && plannerState[day][meal];
                if (assignedId) {
                    const recipe = store.getState().recipes.cache[String(assignedId)];
                    if (recipe) {
                        content.innerHTML = renderRecipeCardInner(recipe);
                        // make inner card draggable too (so user can drag out to other slots)
                        const innerCard = content.querySelector(".recipe-card");
                        if (innerCard) attachDragHandlersToCard(innerCard, String(assignedId));
                    } else {
                        content.textContent = `Receta ${assignedId}`;
                    }
                } else {
                    content.innerHTML = `<div class="slot-placeholder">Arrastra una receta</div>`;
                }
                row.appendChild(slot);
            });

            plannerGridEl.appendChild(row);
        });
    }

    // Recipe card markup for the recipes list and for slot content
    function renderRecipeCardInner(recipe) {
        const img = recipe.image ? `<img src="${recipe.image}" alt="${recipe.title}" />` : `<div class="no-thumb">🍽</div>`;
        return `
            <div class="recipe-card" data-recipe-id="${recipe.id}">
                <div class="recipe-thumb">${img}</div>
                <div class="recipe-meta">
                <div class="recipe-title">${escapeHtml(recipe.title)}</div>
                </div>
            </div>
        `;
    }

    // Populate recipes panel from store (searchResults or cache)
    function renderRecipesPanel() {
        const state = store.getState();
        // prefer searchResults if present, otherwise show cache values
        const list = (state.recipes.searchResults && state.recipes.searchResults.length)
        ? state.recipes.searchResults
        : Object.values(state.recipes.cache);

        recipesListEl.innerHTML = "";
        if (!list || list.length === 0) {
            recipesListEl.innerHTML = "<div class='no-recipes'>No hay recetas. Busca para comenzar.</div>";
            return;
        }
        if (!recipesListEl) return;

        list.forEach(r => {
            const div = document.createElement("div");
            div.className = "recipe-pool-item";
            div.innerHTML = renderRecipeCardInner(r);
            // attach drag handlers to the card element inside
            const card = div.querySelector(".recipe-card");
            attachDragHandlersToCard(card, String(r.id));
            recipesListEl.appendChild(div);
        });
    }

    // Attach dragstart to a recipe-card element
    function attachDragHandlersToCard(cardEl, recipeId) {
        if (!cardEl) return;
        cardEl.setAttribute("draggable", "true");
        cardEl.addEventListener("dragstart", (ev) => {
            ev.dataTransfer.setData("text/plain", recipeId);
            // set effect
            ev.dataTransfer.effectAllowed = "copyMove";
            cardEl.classList.add("dragging");
        });
        cardEl.addEventListener("dragend", () => {
            cardEl.classList.remove("dragging");
        });

        cardEl.addEventListener("click", () => {
            openRecipeModal(recipeId);
        });
    }

    // Simple helper to escape HTML in titles
    function escapeHtml(s) {
        return String(s || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
    }

    // Search button behavior (calls the global search function if present)
    function doSearch(query) {
        if (!query) return;
        // prefer calling window.searchRecipes (created in main.js)
        if (typeof window.searchRecipes === "function") {
            window.searchRecipes(query);
        } else {
            // fallback: try WorkerFacade directly if someone imports it
            console.warn("searchRecipes no disponible en window; intente ejecutar desde main.js");
        }
    }

    // Subscriptions: re-render when recipes or planner change
    function renderFromState() {
        const state = store.getState();

        if (recipesListEl) renderRecipesPanel();
        else console.warn("recipesListEl no está disponible aún");

        if (plannerGridEl) renderGrid(state.planner);
        else console.warn("plannerGridEl no está disponible aún");

        if (shoppingPreview) {
            const items = state.shoppingList.items || {};
            const html = Object.keys(items).length
            ? Object.values(items)
                .map(i => `<div class="shopping-item${i.bought ? ' bought' : ''}">
                    ${escapeHtml(i.name)} — ${i.quantity} ${escapeHtml(i.unit)}
                </div>`).join("")
            : "(Vacía)";
            shoppingPreview.innerHTML = html;
        } else {
            console.warn("shoppingPreview no encontrado");
        }
    }

    function generateWeeklyReport() {
        const state = store.getState();
        const planner = state.planner;
        const recipes = state.recipes.cache;

        const strategyKey = document.getElementById("reportStrategySelect").value;
        const strategy = strategies[strategyKey] || defaultStrategy;

        const report = strategy.generateReport({ planner, recipes });

        const reportOutput = document.getElementById("weeklyReportOutput");
        if (reportOutput) reportOutput.textContent = report;
        else console.warn("weeklyReportOutput no existe todavía");
    }

    // Evento botón
    document.getElementById("generateReportBtn").addEventListener("click", generateWeeklyReport);

    setTimeout(() => {
        renderFromState();

        const unsubscribe = store.subscribe(() => {
            renderFromState();
        });

        window.destroyPlannerUI = unsubscribe;
    }, 0);

    // Clean-up helper (not used now but useful later)
    function destroy() {
        unsubscribe();
    }

    // expose for debugging
    window.initPlannerUI = initPlannerUI;
    window.destroyPlannerUI = destroy;

    console.log("Planner UI initialized ✔");
}