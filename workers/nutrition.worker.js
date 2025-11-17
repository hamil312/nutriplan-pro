import { strategies, defaultStrategy } from "../patterns/strategy/index.js";

// ------------------------------
//  Helpers internos
// ------------------------------
const NUTRI_DB = {
    'tomate': { calories: 22, protein: 1.1, fat: 0.2, carbs: 3.9 },
    'pan': { calories: 265, protein: 9, fat: 3.2, carbs: 49 },
    'pollo': { calories: 239, protein: 27, fat: 14, carbs: 0 },
    'sal': { calories: 0, protein: 0, fat: 0, carbs: 0 },
    'huevos': { calories: 155, protein: 13, fat: 11, carbs: 1.1 },
    'harina': { calories: 364, protein: 10, fat: 1, carbs: 76 },
};

function normalizeName(n) {
    return String(n || "").trim().toLowerCase();
}

function safeNumber(v) {
    const parsed = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
}

function nutritionForIngredient(ing) {
    const nameKey = normalizeName(ing.name || ing.ingredient || ing);
    const qty = safeNumber(ing.quantity ?? ing.amount ?? 1);
    const base = NUTRI_DB[nameKey];

    if (base) {
        return {
            calories: base.calories * qty,
            protein: base.protein * qty,
            fat: base.fat * qty,
            carbs: base.carbs * qty
        };
    }

    return {
        calories: 50 * qty,
        protein: 1 * qty,
        fat: 0.5 * qty,
        carbs: 5 * qty
    };
}

// ------------------------------
//  Worker listener UNIFICADO
// ------------------------------
self.onmessage = async (ev) => {
    const msg = ev.data;
    const { id, type } = msg;

    try {
        if (type !== "NUTRITION_REPORT") {
            postMessage({ id, type: "ERROR", payload: "Unknown message type" });
            return;
        }

        const { planner, recipesCache, mode } = msg;

        // Recolectar recipeIds del planner
        const recipeIds = Object.values(planner)
            .flatMap(day => Object.values(day || {}))
            .filter(Boolean);

        const recipes = recipeIds
            .map(id => recipesCache[id])
            .filter(Boolean);

        // Generar nutritionData para strategy
        const nutritionData = [];

        for (const recipe of recipes) {
            const ings = recipe.ingredients || [];
            let entry = { calories: 0, protein: 0, fat: 0, carbs: 0 };

            for (const ing of ings) {
                const n = nutritionForIngredient(ing);
                entry.calories += n.calories;
                entry.protein += n.protein;
                entry.fat += n.fat;
            }

            nutritionData.push(entry);
        }

        // Elegir estrategia
        const strategy = strategies[mode] || defaultStrategy;

        // Generar reporte final
        const report = strategy.generate(nutritionData);

        postMessage({
            id,
            type: "RESULT",
            payload: { report }
        });

    } catch (err) {
        postMessage({
            id,
            type: "ERROR",
            payload: err.message || String(err)
        });
    }
};