import CalorieReportStrategy from "./CalorieReportStrategy.js";
import MacroReportStrategy from "./MacroReportStrategy.js";

export const strategies = {
    CALORIE_FOCUS: new CalorieReportStrategy(),
    MACRO_FOCUS: new MacroReportStrategy()
};

// Export default fallback
export const defaultStrategy = new CalorieReportStrategy();