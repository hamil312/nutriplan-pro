//This file is the worker for the shopping list
//Arrow singleline function to normalize names, removing blankspaces and lowercasing them
const normalizeName = n => String(n || "").trim().toLowerCase();

//Another arrow function, this one normalizes numbers
const safeNumber = v => {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v;
    const parsed = parseFloat(String(v).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
};

//A function, handles the messages received
self.addEventListener("message", (ev) => {
    //Store data from the message in variables
    const { id, type, planner, recipesCache, currentItems } = ev.data;

    //Verify the appropriate type of acion
    if (type !== "RECALCULATE_LIST") return;

    try {
        //Get the ids for the recipes, first getting the values from the planer, then flatmap, maps the elements and stores them in a single array, finally filter(boolean) outs any false value
        const recipeIds = Object.values(planner || {})
            .flatMap(day => Object.values(day || {}))
            .filter(Boolean);

        //The recipes variable contains a map of ids and their associated recipes, filtering false values
        const recipes = recipeIds.map(id => recipesCache[id]).filter(Boolean);

        //Initialize items
        const items = {};

        //This function adds ingredients
        function addIngredient(ing) {
            //Store the elements of the ingredient in separate variables
            const name = normalizeName(ing.name);
            const qty = safeNumber(ing.quantity);
            const unit = ing.unit || "";

            if (!name) return;

            //If items doesn't contain name already we register it
            if (!items[name]) {
                //Finds previous matching keys from the current items variable, we normalize the name so it matches
                const prevKey = Object.keys(currentItems).find(k => normalizeName(k) === name);
                //Preserve the bought state from the previous key, if it finds the previous state, it turns it into a boolean, otherwise it fallbacks to false
                const prevBought = prevKey ? !!currentItems[prevKey].bought : false;

                //Adds a new entry with the values of the object
                items[name] = {
                    name: ing.name,
                    quantity: qty,
                    unit,
                    bought: prevBought
                };
            } else {
                //If the item is already on the list, then we compare the units or check if the unit is specified, if they match, we increase the quantity
                if (items[name].unit === unit || !items[name].unit || !unit) {
                    items[name].quantity += qty;
                } else {
                    //Otherwise create a special key for the alternate unit
                    const altKey = `${name}__${unit}`;
                    //Check if the altkey exists, if it doesn't, create it appending the unit to the name
                    items[altKey] = items[altKey] || {
                        name: `${ing.name} (${unit})`,
                        quantity: 0,
                        unit,
                        bought: false
                    };
                    //Increase the alternative quantity
                    items[altKey].quantity += qty;
                }
            }
        }

        //For each recipe
        for (const recipe of recipes) {
            //Check for ingredientes and for each ingredient
            for (const ing of recipe.ingredients || []) {
                //Add it
                addIngredient(ing);
            }
        }

        //Finally post the message of succes, alongside its respective payload
        postMessage({ id, payload: { items } });
    } catch (err) {
        postMessage({ id, payload: { error: err.message } });
    }
});