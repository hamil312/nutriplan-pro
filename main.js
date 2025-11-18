//This is the main entry point for the Nutriplan Pro application, setting up the Redux store, handling user authentication, and managing UI interactions
import store from "./store/index.js";
import { loginUser } from "./store/authSlice.js";
import { initLoginUI } from "./ui/login.js";
import { initPlannerUI } from "./ui/planner.js";
window.initPlannerUI = initPlannerUI;
import { strategies } from "./patterns/strategy/index.js";

import apiServiceSingleton from "./services/apiService.js";
import WorkerFacade from "./services/workerFacade.js";

import { 
    addRecipesToCache, 
    setSearchResults 
} from "./store/recipesSlice.js";

import { setShoppingItems } from "./store/shoppingListSlice.js";


//Searching functionality using web workers for performance
async function searchRecipes(query) {
    try {
        //Use worker facade to search recipes
        const results = await WorkerFacade.searchRecipes(query);

        //Update Redux store with search results and cache
        store.dispatch(setSearchResults(results));
        store.dispatch(addRecipesToCache(results));
    } catch (err) {
        console.error("Search worker failed:", err);
    }
}


//Set a previous state for the planner as null
let prevPlanner = null;

//Redux subscription to monitor changes in the planner state
store.subscribe(() => {
    //Get the current state and the state of the planner from the Redux store
    const state = store.getState();
    const currentPlanner = state.planner;

    //If the planner state has changed, update the previous planner state and generate a new shopping list
    if (prevPlanner !== currentPlanner) {
        prevPlanner = currentPlanner;

        generateShoppingListWorker();
    }
});

//Async function to generate a shopping list using web workers
async function generateShoppingListWorker() {
    try {
        //Get the state from the redux store
        const state = store.getState();

        //Use the worker facade to recalculate the shopping list based on the current planner, recipe cache, and existing shopping list items
        const list = await WorkerFacade.recalculateShoppingList(
            state.planner,
            state.recipes.cache,
            state.shoppingList.items
        );

        //Dispatch an action to update the shopping list in the Redux store with the newly generated items
        store.dispatch(setShoppingItems(list.items));
    } catch (err) {
        console.error("Shopping list worker failed:", err);
    }
}

//Set a previous auth user state as null
let prevAuthUser = null;

//Redux subscription to monitor changes in the authentication state
store.subscribe(() => {
    //Get the current state and the authentication user from the Redux store
    const state = store.getState();
    const currentUser = state.auth.user;

    //If the authentication user has changed from null to a valid user, set the API token for future requests
    if (!prevAuthUser && currentUser) {
        //We get the API service instance
        const api = apiServiceSingleton.getInstance();
        //We retrieve the token from the auth state
        const token = state.auth.token;

        //If a token exists, we set it in the API service for authenticated requests
        if (token) api.setToken(token);

        console.log("User logged in:", currentUser.email);
    }

    prevAuthUser = currentUser;
});


//Expose store and key functions to the global window object for debugging and UI interaction
window.store = store;
window.loginUser = loginUser;
window.searchRecipes = searchRecipes;
window.generateShoppingList = generateShoppingListWorker;
window.generateWeeklyReport = () => {
    //Get the state from the redux store
    const planner = store.getState().planner;
    const recipes = store.getState().recipes.cache;
    return strategies.CALORIE_FOCUS.generateReport({ planner, recipes });
};

console.log("%cMain.js fully loaded ✔️", "color: #22c55e; font-weight: bold;");
//Initialize the login UI
initLoginUI();