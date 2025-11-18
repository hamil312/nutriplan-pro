//This file is in charge of the UI logic for shopping list, the list that displays the ingredients for the recipes
import store from "../store/index.js";
import { toggleItemBought } from "../store/shoppingListSlice.js";

//Initialize a null variable for the container
let container = null;

//Render one item to avoid reinserting everything
function renderItem(name, item) {
    //We create a div element for a row and assign it a className and a dataset key
    const row = document.createElement("div");
    row.className = "shopping-item" + (item.bought ? " bought" : "");
    row.dataset.key = name;

    //We create a span element that will work as a label
    const label = document.createElement("span");
    //The content of the label is defined by the item
    label.textContent = `${item.name} — ${item.quantity} ${item.unit || ""}`;

    //Create a button to set the ingredient as bought
    const btn = document.createElement("button");
    btn.textContent = item.bought ? "Desmarcar" : "Comprar";
    btn.style.marginLeft = "10px";
    btn.style.fontSize = "0.8rem";
    btn.style.cursor = "pointer";

    //On click we toggle the item as bought, changing its attribute through the global state
    btn.addEventListener("click", () => {
        store.dispatch(toggleItemBought(name));
    });

    //We append the items to the row and return the element
    row.appendChild(label);
    row.appendChild(btn);
    return row;
}

//This function calculates the total amount for all the items in the list, usign the reduce function that applies the specified function to all the elements
function calculateTotal(items) {
    return Object.values(items).reduce((acc, item) => {
        if (item.price) {
            const qty = Number(item.quantity) || 1;
            acc += item.price * qty;
        }
        return acc;
    }, 0);
}

//Main render function
function render() {
    if (!container) return;

    //Checks if the container exists then we get the shoppingList from the globalState and the items as well
    const state = store.getState().shoppingList;
    const { items, status } = state;

    //Empty the container
    container.innerHTML = "";

    //We create a title element and append it, this is the title for the shopping list
    const title = document.createElement("h3");
    title.textContent = "🛒 Lista de compras";
    container.appendChild(title);

    //If it's generating we display a message
    if (status === "generating") {
        const loading = document.createElement("div");
        loading.textContent = "Generando...";
        loading.style.opacity = "0.6";
        container.appendChild(loading);
        return;
    }

    //We store the keys for the ingredients
    const keys = Object.keys(items);

    //If there are none we create a message saying so
    if (keys.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "No hay ingredientes aún.";
        empty.style.opacity = "0.7";
        container.appendChild(empty);
        return;
    }

    //Create a div element that will be the list of ingredients
    const list = document.createElement("div");

    //For each ingredient found we use renderItem to render it, then append the result to the list
    for (const key of keys) {
        const row = renderItem(key, items[key]);
        list.appendChild(row);
    }

    //Append the list to the container
    container.appendChild(list);

    //If there was a price we could calculate the total
    const total = calculateTotal(items);
    if (total > 0) {
        const totalBox = document.createElement("div");
        totalBox.style.marginTop = "12px";
        totalBox.style.fontWeight = "bold";
        totalBox.textContent = `Total estimado: $${total.toFixed(2)}`;
        container.appendChild(totalBox);
    }
}

//Start up the UI finding the .shopping-panel element and then rendering
export function initShoppingListUI() {
    container = document.querySelector(".shopping-panel");
    if (!container) {
        console.warn("⚠️ No se encontró .shopping-panel");
        return;
    }

    //Initial render
    render();

    //Subscribe changes to the store
    store.subscribe(render);
}