function normalizeName(n) {
    if (!n) return '';
    return String(n).trim().toLowerCase();
}

function safeNumber(v) {
    if (v === undefined || v === null) return 0;
    if (typeof v === 'number') return v;
    const parsed = parseFloat(String(v).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
}

self.addEventListener('message', async (ev) => {
    const msg = ev.data;
    const { id, type } = msg;

    try {
        if (type === 'RECALCULATE_LIST') {
            const planner = msg.planner || {};         // estructura de planner: { monday: { breakfast: id, ... }, ... }
            const recipesCache = msg.recipesCache || {}; // objeto o array con recetas normalizadas
            const currentItems = msg.currentItems || {}; // estado previo de shopping list para preservar 'bought'

            // Recolectar todos los recipeIds desde planner
            const recipeIds = Object.values(planner)
                .flatMap(day => Object.values(day || {}))
                .filter(Boolean);

            // Mapear a objetos receta (si recipesCache es array o map)
            const recipes = recipeIds.map(id => recipesCache[id]).filter(Boolean);

            // items acumulados: { normalizedName: { name, quantity, unit, bought } }
            const items = {};

            // Función para sumar un ingrediente
            function addIngredient(rawIng) {
                const nameRaw = rawIng.name ?? rawIng.ingredient ?? rawIng;
                const name = normalizeName(nameRaw);
                const qty = safeNumber(rawIng.quantity ?? rawIng.amount ?? 1);
                const unit = rawIng.unit ?? rawIng.uom ?? '';

                if (!name) return;

                if (!items[name]) {
                    // intentar preservar bought del estado actual (buscar por key exacta o case-insensitive)
                    const prevKey = Object.keys(currentItems).find(k => normalizeName(k) === name);
                    const prevBought = prevKey ? !!currentItems[prevKey].bought : false;

                    items[name] = {
                        name: nameRaw,
                        quantity: qty,
                        unit,
                        bought: prevBought
                    };
                } else {
                    // Si la unidad coincide, sumamos, si no, conservamos y agregamos como texto (fallback)
                    if (items[name].unit === unit || !items[name].unit || !unit) {
                        items[name].quantity += qty;
                    } else {
                        // unidades distintas -> crear clave alternativa con unidad
                        const altKey = `${name}__${unit}`;
                        if (!items[altKey]) {
                        items[altKey] = {
                            name: `${nameRaw} (${unit})`,
                            quantity: qty,
                            unit,
                            bought: false
                        };
                        } else {
                        items[altKey].quantity += qty;
                        }
                    }
                }
            }

            // Recorremos todas las recetas y sus ingredientes
            for (const recipe of recipes) {
                const ings = recipe.ingredients || recipe.ingredientsList || recipe.ingredients || [];
                for (const ing of ings) {
                    // ing puede ser string o objeto
                    if (typeof ing === 'string') {
                        addIngredient({ name: ing, quantity: 1, unit: '' });
                    } else {
                        addIngredient(ing);
                    }
                }
            }

            // Resultado: devolver items como objeto
            postMessage({ id, type: 'RESULT', payload: { items } });
        } else {
            postMessage({ id, type: 'ERROR', payload: `Unknown message type ${type}` });
        }
    } catch (err) {
        postMessage({ id, type: 'ERROR', payload: err.message || String(err) });
    }
});