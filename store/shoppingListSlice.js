//This file manages the shopping list state, including adding items, marking them as bought, and tracking generation status
const { createSlice } = window.RTK;

const shoppingListSlice = createSlice({
    //We define the name of the slice and the initial state
    name: 'shoppingList',
    initialState: { items: {}, status: 'idle' },
    //Reducers to handle setting shopping items, marking generation status, and toggling item bought status
    reducers: {
        setShoppingItems(state, action){
            //Sets the shopping items and resets the status
            state.items = action.payload;
            state.status = 'idle';
        },
        setGenerating(state){
            //Sets the status to 'generating' when the shopping list is being generated
            state.status = 'generating';
        },
        toggleItemBought(state, action){
            //Toggles the 'bought' status of a specific item by its name
            const name = action.payload;
            if(state.items[name]) state.items[name].bought = !state.items[name].bought;
        }
    }
});

export const { setShoppingItems, setGenerating, toggleItemBought } = shoppingListSlice.actions;
export default shoppingListSlice.reducer;