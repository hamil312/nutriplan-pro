export default class CalorieReportStrategy {
    constructor() {
        this.name = "CALORIE_FOCUS";
    }

    generate(nutritionData) {
        // nutritionData = [{ calories, protein, fat, carbs }, ...]
        const totalCalories = nutritionData.reduce((sum, r) => sum + (r.calories || 0), 0);

        return {
            mode: this.name,
            totalCalories,
            dailyAverage: totalCalories / 7,
            summary: `Reporte enfocado en calorías: total=${totalCalories} kcal`
        };
    }
}