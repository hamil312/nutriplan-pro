//We use this to normalize the recipes
const RecipeFactory = {
    //Normalize function
    normalize(raw) {
        //Check if there is a raw element
        if (!raw) return null;

        return {
            //Return an object that verifies the normalization of the data
            id: String(raw.id),
            title: raw.title || raw.name || "Receta sin nombre",
            image: raw.image || raw.thumbnail || null,
            ingredients: (raw.ingredients || []).map(i => ({
                name: i.name || i.ingredient || i,
                quantity: Number(i.quantity || i.amount || 1) || 1,
                unit: i.unit || ""
            })),
            instructions:
            Array.isArray(raw.instructions)
                ? raw.instructions
                : raw.steps
                ? (Array.isArray(raw.steps) ? raw.steps : [raw.steps])
                : []
        };
    }
};

export default RecipeFactory;