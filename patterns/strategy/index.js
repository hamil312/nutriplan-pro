//This module exports different report generation strategies for the Nutriplan Pro application
import CalorieReportStrategy from "./CalorieReportStrategy.js";
import MacroReportStrategy from "./MacroReportStrategy.js";

// Export available strategies
export const strategies = {
    //Its an object mapping strategy names to their corresponding instances
    CALORIE_FOCUS: new CalorieReportStrategy(),
    MACRO_FOCUS: new MacroReportStrategy()
};

// Export default fallback
export const defaultStrategy = new CalorieReportStrategy();