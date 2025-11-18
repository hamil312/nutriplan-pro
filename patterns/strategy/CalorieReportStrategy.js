//This is the calorie report strategy
export default class CalorieReportStrategy {
    //Constructor just defines its name
    constructor() {
        this.name = "CALORIE_FOCUS";
    }

    //Function to generate the nutritional data
    generate(nutritionData) {
        //Receives a nutritionData object, reduce applies a function to each element, in this case, adding the calories
        const totalCalories = nutritionData.reduce((sum, r) => sum + (r.calories || 0), 0);

        //Return the report
        return {
            mode: this.name,
            totalCalories,
            dailyAverage: totalCalories / 7,
            summary: `Reporte enfocado en calorías: total=${totalCalories} kcal`
        };
    }
}