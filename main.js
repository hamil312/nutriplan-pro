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


// ===================================================================
// 1. RECIPE SEARCH (Async, offloaded to worker)
// ===================================================================

async function searchRecipes(query) {
    try {
        const results = await WorkerFacade.searchRecipes(query);

        // Store results
        store.dispatch(setSearchResults(results));
        store.dispatch(addRecipesToCache(results));
    } catch (err) {
        console.error("Search worker failed:", err);
    }
}


// ===================================================================
// 2. SHOPPING LIST (Auto-updates using worker when planner changes)
// ===================================================================

let prevPlanner = null;

store.subscribe(() => {
    const state = store.getState();
    const currentPlanner = state.planner;

    if (prevPlanner !== currentPlanner) {
        prevPlanner = currentPlanner;

        generateShoppingListWorker();
    }
});

async function generateShoppingListWorker() {
    try {
        const state = store.getState();

        const list = await WorkerFacade.recalculateShoppingList(
            state.planner,
            state.recipes.cache,
            state.shoppingList.items
        );

        store.dispatch(setShoppingItems(list.items));
    } catch (err) {
        console.error("Shopping list worker failed:", err);
    }
}

// ===================================================================
// 3. AUTH OBSERVER: Register token in ApiService when login succeeds
// ===================================================================

let prevAuthUser = null;

store.subscribe(() => {
    const state = store.getState();
    const currentUser = state.auth.user;

    if (!prevAuthUser && currentUser) {
        const api = apiServiceSingleton.getInstance();
        const token = state.auth.token;

        if (token) api.setToken(token);

        console.log("User logged in:", currentUser.email);
    }

    prevAuthUser = currentUser;
});


// ===================================================================
// 4. MANUAL TRIGGERS FOR DEBUGGING FROM BROWSER
// ===================================================================

window.store = store;
window.loginUser = loginUser;
window.searchRecipes = searchRecipes;
window.generateShoppingList = generateShoppingListWorker;
window.generateWeeklyReport = () => {
    const planner = store.getState().planner;
    const recipes = store.getState().recipes.cache;
    return strategies.CALORIE_FOCUS.generateReport({ planner, recipes });
};

console.log("%cMain.js fully loaded ✔️", "color: #22c55e; font-weight: bold;");
initLoginUI();