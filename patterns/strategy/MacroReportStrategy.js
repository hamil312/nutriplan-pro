//This is the macro report strategy
export default class MacroReportStrategy {
    //Constructor just defines its name
    constructor() {
        this.name = "MACRO_FOCUS";
    }

    //Function to generate the nutritional data
    generate(nutritionData) {
        //Set the totals to zero
        let totals = { protein: 0, fat: 0, carbs: 0 };

        //For each element in nutrition data
        for (const r of nutritionData) {
            //Add the corresponding value to the corresponding total
            totals.protein += r.protein || 0;
            totals.fat += r.fat || 0;
            totals.carbs += r.carbs || 0;
        }

        //Return the report
        return {
            mode: this.name,
            totals,
            summary: `Macros totales → Proteínas: ${totals.protein}g, Grasas: ${totals.fat}g, Carbs: ${totals.carbs}g`
        };
    }
}