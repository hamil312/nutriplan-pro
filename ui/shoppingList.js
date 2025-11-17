import store from "../store/index.js";
import { toggleItemBought } from "../store/shoppingListSlice.js";

let container = null;

/** Renderiza un solo ítem para no reinsertar todo cada vez */
function renderItem(name, item) {
    const row = document.createElement("div");
    row.className = "shopping-item" + (item.bought ? " bought" : "");
    row.dataset.key = name;

    const label = document.createElement("span");
    label.textContent = `${item.name} — ${item.quantity} ${item.unit || ""}`;

    const btn = document.createElement("button");
    btn.textContent = item.bought ? "Desmarcar" : "Comprar";
    btn.style.marginLeft = "10px";
    btn.style.fontSize = "0.8rem";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", () => {
        store.dispatch(toggleItemBought(name));
    });

    row.appendChild(label);
    row.appendChild(btn);
    return row;
}

/** Calcula el precio total sobre la lista (si viene la propiedad price) */
function calculateTotal(items) {
    return Object.values(items).reduce((acc, item) => {
        if (item.price) {
            const qty = Number(item.quantity) || 1;
            acc += item.price * qty;
        }
        return acc;
    }, 0);
}

/** Render principal */
function render() {
    if (!container) return;

    const state = store.getState().shoppingList;
    const { items, status } = state;

    container.innerHTML = "";

    const title = document.createElement("h3");
    title.textContent = "🛒 Lista de compras";
    container.appendChild(title);

    if (status === "generating") {
        const loading = document.createElement("div");
        loading.textContent = "Generando...";
        loading.style.opacity = "0.6";
        container.appendChild(loading);
        return;
    }

    const keys = Object.keys(items);

    if (keys.length === 0) {
        const empty = document.createElement("div");
        empty.textContent = "No hay ingredientes aún.";
        empty.style.opacity = "0.7";
        container.appendChild(empty);
        return;
    }

    const list = document.createElement("div");

    for (const key of keys) {
        const row = renderItem(key, items[key]);
        list.appendChild(row);
    }

    container.appendChild(list);

    // Precio total (opcional)
    const total = calculateTotal(items);
    if (total > 0) {
        const totalBox = document.createElement("div");
        totalBox.style.marginTop = "12px";
        totalBox.style.fontWeight = "bold";
        totalBox.textContent = `Total estimado: $${total.toFixed(2)}`;
        container.appendChild(totalBox);
    }
}

/** Inicializar UI */
export function initShoppingListUI() {
    container = document.querySelector(".shopping-panel");
    if (!container) {
        console.warn("⚠️ No se encontró .shopping-panel");
        return;
    }

    // Render inicial
    render();

    // Suscribirse a cambios del store
    store.subscribe(render);
}