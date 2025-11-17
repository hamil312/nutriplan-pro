import store from "../store/index.js";
import { addRecipeToSlot } from "../store/plannerSlice.js";
import { openRecipeModal } from "./recipeModal.js";
import { initSearchUI } from "./search.js";
import { initShoppingListUI } from "./shoppingList.js";
import { strategies, defaultStrategy } from "../patterns/strategy/index.js";
import workerFacade from "../services/workerFacade.js";

export function initPlannerUI() {
    const appMain = document.getElementById("appMain");
    if (!appMain) {
        console.error("initPlannerUI: #appMain no encontrado");
        return;
    }

    // Evita duplicar el layout
    if (document.getElementById("planner-layout")) {
        console.warn("Planner ya inicializado, evitando duplicado.");
        return;
    }

    // Limpiar una vez
    appMain.innerHTML = "";

    // Construir layout base
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

    // Panel adicional para búsqueda
    const recipesPanel = document.querySelector(".recipes-panel");
    const leftPanel = document.createElement("div");
    leftPanel.className = "custom-left-panel";
    recipesPanel.appendChild(leftPanel);

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

    // Render header
    function renderGridHeader() {
        if (!plannerGridHeader) return;

        plannerGridHeader.innerHTML =
            `<div class="corner-cell"></div>` +
            days.map((d, i) =>
                `<div class="grid-day-header" data-day="${d}">${dayLabels[i]}</div>`
            ).join("");
    }

    // Crea un slot
    function createSlot(day, meal) {
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.dataset.day = day;
        slot.dataset.meal = meal;

        slot.innerHTML = `
            <div class="slot-meal">${mealLabels[meal]}</div>
            <div class="slot-content" data-day="${day}" data-meal="${meal}"></div>
            <button class="clear-slot" title="Eliminar">✖</button>
        `;

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

            const recipeId = ev.dataTransfer.getData("text/plain");
            if (recipeId) {
                store.dispatch(addRecipeToSlot({
                    day, meal, recipeId
                }));
            }
        });

        // Clear
        slot.querySelector(".clear-slot").addEventListener("click", (e) => {
            e.stopPropagation();
            store.dispatch(addRecipeToSlot({
                day, meal, recipeId: null
            }));
        });

        return slot;
    }

    // Render tablero semanal
    function renderGrid(plannerState) {
        if (!plannerGridEl) return;
        plannerGridEl.innerHTML = "";

        meals.forEach(meal => {
            const row = document.createElement("div");
            row.className = "grid-row";

            const mealLabelCell = document.createElement("div");
            mealLabelCell.className = "meal-label-cell";
            mealLabelCell.textContent = mealLabels[meal];
            row.appendChild(mealLabelCell);

            days.forEach(day => {
                const slot = createSlot(day, meal);
                const content = slot.querySelector(".slot-content");

                const assignedId = plannerState[day]?.[meal];
                if (assignedId) {
                    const recipe = store.getState().recipes.cache[String(assignedId)];

                    if (recipe) {
                        content.innerHTML = renderRecipeCardInner(recipe);
                        const inner = content.querySelector(".recipe-card");
                        attachDragHandlersToCard(inner, recipe.id);
                    }
                } else {
                    content.innerHTML = `<div class="slot-placeholder">Arrastra una receta</div>`;
                }

                row.appendChild(slot);
            });

            plannerGridEl.appendChild(row);
        });
    }

    // Card HTML
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

    // Render panel de recetas
    function renderRecipesPanel() {
        const state = store.getState();
        const list =
            state.recipes.searchResults?.length
                ? state.recipes.searchResults
                : Object.values(state.recipes.cache);

        if (!recipesListEl) return;
        recipesListEl.innerHTML = "";

        if (!list.length) {
            recipesListEl.innerHTML = `<div class="no-recipes">No hay recetas.</div>`;
            return;
        }

        list.forEach(r => {
            const wrap = document.createElement("div");
            wrap.className = "recipe-pool-item";
            wrap.innerHTML = renderRecipeCardInner(r);
            const card = wrap.querySelector(".recipe-card");
            attachDragHandlersToCard(card, r.id);
            recipesListEl.appendChild(wrap);
        });
    }

    // Handlers de arrastre
    function attachDragHandlersToCard(cardEl, id) {
        if (!cardEl) return;
        cardEl.setAttribute("draggable", "true");

        cardEl.addEventListener("dragstart", (ev) => {
            ev.dataTransfer.setData("text/plain", id);
            cardEl.classList.add("dragging");
        });

        cardEl.addEventListener("dragend", () => {
            cardEl.classList.remove("dragging");
        });

        cardEl.addEventListener("click", () => {
            openRecipeModal(id);
        });
    }

    // Sanitizar strings
    function escapeHtml(s) {
        return String(s || "").replace(/[&<>"']/g, c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[c]);
    }

    // Re-render y shopping list
    function renderFromState() {
        const state = store.getState();

        renderRecipesPanel();
        renderGrid(state.planner);
        renderShopping(state.shoppingList);
    }

    function renderShopping(listState) {
        if (!shoppingPreview) return;

        const items = listState.items || {};

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

    // Reporte semanal
    async function generateWeeklyReport() {
        const state = store.getState();
        const planner = state.planner;
        const recipesCache = state.recipes.cache;

        const mode = document.getElementById("reportStrategySelect").value;

        const { report } = await workerFacade.generateNutritionReport(
            planner,
            mode,
            recipesCache
        );

        const output = document.getElementById("weeklyReportOutput");
        if (output) {
            output.textContent = JSON.stringify(report, null, 2);
        }
    }

    document.getElementById("generateReportBtn")
        .addEventListener("click", generateWeeklyReport);

    // Inicializar
    setTimeout(() => {
        renderGridHeader();
        renderFromState();
        const unsubscribe = store.subscribe(renderFromState);
        window.destroyPlannerUI = unsubscribe;
    }, 0);

    console.log("Planner UI initialized ✔");
}