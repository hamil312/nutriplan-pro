import apiServiceSingleton from "./apiService.js";
import RecipeFactory from "../patterns/factory/RecipeFactory.js";

class WorkerFacade {

    constructor() {
        // Workers reales
        this.searchWorker = new Worker("./workers/recipeSearch.worker.js", { type: "module" });
        this.shoppingWorker = new Worker("./workers/shoppingList.worker.js", { type: "module" });
        this.nutritionWorker = new Worker("./workers/nutrition.worker.js", { type: "module" });

        // Pending responses
        this.pending = {};

        // Bind listeners una sola vez
        this._bindWorker(this.searchWorker);
        this._bindWorker(this.shoppingWorker);
        this._bindWorker(this.nutritionWorker);
    }

    // --- Vincula workers al sistema de promesas ---
    _bindWorker(worker) {
        worker.onmessage = (e) => {
            const { id, type, payload } = e.data;

            // Si hay promesa pendiente, resolverla
            if (this.pending[id]) {
                this.pending[id](payload);
                delete this.pending[id];
            }
        };
    }

    // --- Enviar mensajes con ID ---
    _sendToWorker(worker, message) {
        return new Promise(resolve => {
            const id = crypto.randomUUID();
            this.pending[id] = resolve;
            worker.postMessage({ id, ...message });
        });
    }

    // =====================================================
    // FACADES EXTERNOS
    // =====================================================

    /** SEARCH WORKER */
    async searchRecipes(query) {
        const rawResults = await this._sendToWorker(this.searchWorker, {
            type: "SEARCH",
            query
        });

        // 🔒 Seguridad: garantizar siempre array
        const list = Array.isArray(rawResults) ? rawResults : [];

        return list.map(r => RecipeFactory.normalize(r));
    }

    /** DIRECT API CALL (sin worker) */
    async getRecipeById(id) {
        const api = apiServiceSingleton.getInstance();
        const raw = await api.get(`/recipes/${id}`);
        return RecipeFactory.normalize(raw);
    }

    /** SHOPPING LIST WORKER */
    async recalculateShoppingList(planner, recipesCache, currentItems) {
        return await this._sendToWorker(this.shoppingWorker, {
            type: "RECALCULATE_LIST",
            planner,
            recipesCache,
            currentItems
        });
    }

    /** NUTRITION WORKER */
    async generateNutritionReport(planner, mode = "CALORIE_FOCUS", recipesCache) {
        return await this._sendToWorker(this.nutritionWorker, {
            type: "NUTRITION_REPORT",
            planner,
            recipesCache,
            mode
        });
    }
}

export default new WorkerFacade();