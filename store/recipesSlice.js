//Handles recipe data including caching and search results
const { createSlice } = window.RTK;

const recipesSlice = createSlice({
    //We define the name of the slice and the initial state
    name: 'recipes',
    initialState: { cache: {}, searchResults: [], status: 'idle' },
    reducers: {
        //We have two reducers: one for adding recipes to the cache and another for setting search results
        addRecipesToCache(state, action){
            //The payload is expected to be an array of recipe objects
            action.payload.forEach(r => {
                //We use an arrow function to add each recipe to the cache, using the recipe ID as the key
                state.cache[String(r.id)] = r;
            });
        },
        //We have another reducer for setting search results
        setSearchResults(state, action){
            //The payload is expected to be an array of recipe objects
            state.searchResults = action.payload;
        },
        restoreCache(state, action) {
            state.cache = action.payload || {};
        }
    }
});

export const { addRecipesToCache, setSearchResults, restoreCache } = recipesSlice.actions;
export default recipesSlice.reducer;