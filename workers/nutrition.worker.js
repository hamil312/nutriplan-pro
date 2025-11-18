//This is the worker for nutrition report actions
import { strategies, defaultStrategy } from "../patterns/strategy/index.js";

//This is a helper with information about ingredients
const NUTRI_DB = {
    'tomate': { calories: 22, protein: 1.1, fat: 0.2, carbs: 3.9 },
    'pan': { calories: 265, protein: 9, fat: 3.2, carbs: 49 },
    'pollo': { calories: 239, protein: 27, fat: 14, carbs: 0 },
    'sal': { calories: 0, protein: 0, fat: 0, carbs: 0 },
    'huevos': { calories: 155, protein: 13, fat: 11, carbs: 1.1 },
    'harina': { calories: 364, protein: 10, fat: 1, carbs: 76 },
    'lechuga': { calories: 15, protein: 1.4, fat: 0.2, carbs: 2.9 },
    'zanahoria': { calories: 41, protein: 0.9, fat: 0.2, carbs: 10 },
    'cebolla': { calories: 40, protein: 1.1, fat: 0.1, carbs: 9 },
    'arvejas': { calories: 81, protein: 5.4, fat: 0.4, carbs: 14 },
    'manzana': { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
    'banano': { calories: 89, protein: 1.1, fat: 0.3, carbs: 22 },
    'uvas': { calories: 69, protein: 0.7, fat: 0.2, carbs: 18 },
    'aguacate': { calories: 160, protein: 2, fat: 15, carbs: 9 },
    'limón': { calories: 29, protein: 1.1, fat: 0.3, carbs: 9 },
    'mango': { calories: 60, protein: 0.8, fat: 0.4, carbs: 15 },
    'champiñones': { calories: 22, protein: 3.1, fat: 0.3, carbs: 3.3 },
    'queso': { calories: 402, protein: 25, fat: 33, carbs: 1.3 },
    'leche': { calories: 42, protein: 3.4, fat: 1, carbs: 5 },
    'tortillas': { calories: 218, protein: 5.7, fat: 2.8, carbs: 45 },
    'arroz': { calories: 130, protein: 2.4, fat: 0.3, carbs: 28 },
    'mayonesa': { calories: 680, protein: 1, fat: 75, carbs: 0.6 },
    'crema': { calories: 195, protein: 2, fat: 19, carbs: 3 },
    'salsa': { calories: 29, protein: 1.4, fat: 0.2, carbs: 7 },
    'crutones': { calories: 407, protein: 10, fat: 5, carbs: 72 },
    'carne molida': { calories: 254, protein: 17, fat: 20, carbs: 0 },
    'atún': { calories: 132, protein: 29, fat: 1.3, carbs: 0 }
};

//Function to normalize the name
function normalizeName(n) {
    return String(n || "").trim().toLowerCase();
}

//function to normalize numbers
function safeNumber(v) {
    const parsed = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
}

//This function checks the nutritional values for the ingredients
function nutritionForIngredient(ing) {
    //Get and normaliz the values from the ingredients
    const nameKey = normalizeName(ing.name || ing.ingredient || ing);
    const qty = safeNumber(ing.quantity ?? ing.amount ?? 1);
    const base = NUTRI_DB[nameKey]; //Locate the ingredient from the nutritional db by its name and store it in a variable

    if (base) {
        //If it finds the element in the database return the product of each component times the quantity
        return {
            calories: base.calories * qty,
            protein: base.protein * qty,
            fat: base.fat * qty,
            carbs: base.carbs * qty
        };
    }

    //Otherwise fallback to mock values
    return {
        calories: 50 * qty,
        protein: 1 * qty,
        fat: 0.5 * qty,
        carbs: 5 * qty
    };
}

//Unified Listener
self.onmessage = async (ev) => {
    //Get the message and store its data in variables
    const msg = ev.data;
    const { id, type } = msg;

    try {
        //If its not a valid nutrition report type post a message
        if (type !== "NUTRITION_REPORT") {
            postMessage({ id, type: "ERROR", payload: "Unknown message type" });
            return;
        }

        //Store the message components in variables
        const { planner, recipesCache, mode } = msg;

        //Find the recipeIds from the planner, add them to a flatmap ensuring they aren't false
        const recipeIds = Object.values(planner)
            .flatMap(day => Object.values(day || {}))
            .filter(Boolean);

        //Map the ids to their corresponding object, filtering false values
        const recipes = recipeIds
            .map(id => recipesCache[id])
            .filter(Boolean);

        //Nutrition data for the strategy
        const nutritionData = [];

        //For each recipe
        for (const recipe of recipes) {
            //Store ingredients in a variable
            const ings = recipe.ingredients || [];
            //Set initial values
            let entry = { calories: 0, protein: 0, fat: 0, carbs: 0 };

            //For each ingredient
            for (const ing of ings) {
                //Look for the nutritional info on the ingredient, and upon finding it, add said information to the corresponding variable
                const n = nutritionForIngredient(ing);
                entry.calories += n.calories;
                entry.protein += n.protein;
                entry.fat += n.fat;
                entry.carbs += n.carbs;
            }

            //Push the entry
            nutritionData.push(entry);
        }

        //Choose strategy
        const strategy = strategies[mode] || defaultStrategy;

        //Generate final report
        const report = strategy.generate(nutritionData);

        //Return a message with its payload being the report
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