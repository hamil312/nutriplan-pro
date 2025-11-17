//This file sets up the Redux store by combining multiple slices into a single store
const { configureStore } = window.RTK;
import authReducer from './authSlice.js';
import recipesReducer from './recipesSlice.js';
import plannerReducer from './plannerSlice.js';
import shoppingListReducer from './shoppingListSlice.js';

//Setting up the Redux store with combined reducers from different slices
const store = configureStore({
    //Combining reducers from different slices
    reducer: {
        //This is an object where each key is the name of the slice and the value is the corresponding reducer
        auth: authReducer,
        recipes: recipesReducer,
        planner: plannerReducer,
        shoppingList: shoppingListReducer
    }
});

export default store;