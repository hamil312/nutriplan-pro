const normalizeName = n => String(n || "").trim().toLowerCase();

const safeNumber = v => {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v;
    const parsed = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
};

self.addEventListener("message", (ev) => {
    const { id, type, planner, recipesCache, currentItems } = ev.data;

    if (type !== "RECALCULATE_LIST") return;

    try {
        const recipeIds = Object.values(planner || {})
            .flatMap(day => Object.values(day || {}))
            .filter(Boolean);

        const recipes = recipeIds.map(id => recipesCache[id]).filter(Boolean);

        const items = {};

        function addIngredient(ing) {
            const name = normalizeName(ing.name);
            const qty = safeNumber(ing.quantity);
            const unit = ing.unit || "";

            if (!name) return;

            if (!items[name]) {
                const prevKey = Object.keys(currentItems).find(k => normalizeName(k) === name);
                const prevBought = prevKey ? !!currentItems[prevKey].bought : false;

                items[name] = {
                    name: ing.name,
                    quantity: qty,
                    unit,
                    bought: prevBought
                };
            } else {
                if (items[name].unit === unit || !items[name].unit || !unit) {
                    items[name].quantity += qty;
                } else {
                    const altKey = `${name}__${unit}`;
                    items[altKey] = items[altKey] || {
                        name: `${ing.name} (${unit})`,
                        quantity: 0,
                        unit,
                        bought: false
                    };
                    items[altKey].quantity += qty;
                }
            }
        }

        for (const recipe of recipes) {
            for (const ing of recipe.ingredients || []) {
                addIngredient(ing);
            }
        }

        postMessage({ id, payload: { items } });
    } catch (err) {
        postMessage({ id, payload: { error: err.message } });
    }
});