const RecipeFactory = {
    normalize(raw) {
        if (!raw) return null;

        return {
            id: String(raw.id),
            title: raw.title || raw.name || "Receta sin nombre",
            image: raw.image || raw.thumbnail || null,
            ingredients: (raw.ingredients || []).map(i => ({
                name: i.name || i.ingredient || i,
                quantity: i.quantity || i.amount || 1,
                unit: i.unit || ""
            })),
            instructions: raw.instructions || raw.steps || []
        };
    }
};

export default RecipeFactory;