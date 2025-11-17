export default class MacroReportStrategy {
    constructor() {
        this.name = "MACRO_FOCUS";
    }

    generate(nutritionData) {
        let totals = { protein: 0, fat: 0, carbs: 0 };

        for (const r of nutritionData) {
            totals.protein += r.protein || 0;
            totals.fat += r.fat || 0;
            totals.carbs += r.carbs || 0;
        }

        return {
            mode: this.name,
            totals,
            summary: `Macros totales → Proteínas: ${totals.protein}g, Grasas: ${totals.fat}g, Carbs: ${totals.carbs}g`
        };
    }
}