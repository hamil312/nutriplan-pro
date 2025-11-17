//This file manages the meal planner state, allowing users to set and update their meal plans for the week, handling the D&D logic, associating recipes to specific days and meals by their IDs
const { createSlice } = window.RTK;

//Defining the default planner structure with null values for each meal slot
const defaultPlanner = {
    monday: { breakfast: null, lunch: null, dinner: null },
    tuesday: { breakfast: null, lunch: null, dinner: null },
    wednesday: { breakfast: null, lunch: null, dinner: null },
    thursday: { breakfast: null, lunch: null, dinner: null },
    friday: { breakfast: null, lunch: null, dinner: null },
    saturday: { breakfast: null, lunch: null, dinner: null },
    sunday: { breakfast: null, lunch: null, dinner: null }
};

//Creating the planner slice with reducers to set the entire planner or add a recipe to a specific slot
const plannerSlice = createSlice({
    //We define the name of the slice and the initial state, using the default planner structure we created previously
    name: 'planner',
    initialState: defaultPlanner,
    //Reducers to handle setting the planner and adding recipes to specific meal slots
    reducers: {
        //Sets the entire planner state
        setPlanner(state, action){
            return action.payload;
        },
        //Adds a recipe to a specific day and meal slot
        addRecipeToSlot(state, action){
            //The expected payload contains day, meal, and recipeId
            const { day, meal, recipeId } = action.payload;
            //We check if the specified day exists in the state before updating
            if(state[day]) state[day][meal] = recipeId;
        }
    }
});

export const { setPlanner, addRecipeToSlot } = plannerSlice.actions;
export default plannerSlice.reducer;