//This facade handles access to all workers in the project
import apiServiceSingleton from "./apiService.js";
import RecipeFactory from "../patterns/factory/RecipeFactory.js";

class WorkerFacade {

    constructor() {
        //Instantiate the workers
        this.searchWorker = new Worker("./workers/recipeSearch.worker.js", { type: "module" });
        this.shoppingWorker = new Worker("./workers/shoppingList.worker.js", { type: "module" });
        this.nutritionWorker = new Worker("./workers/nutrition.worker.js", { type: "module" });

        //Pending responses
        this.pending = {};

        //Bind the listeners
        this._bindWorker(this.searchWorker);
        this._bindWorker(this.shoppingWorker);
        this._bindWorker(this.nutritionWorker);
    }

    //Bind workers to the promises system
    _bindWorker(worker) {
        worker.onmessage = (e) => {
            //Get data from a message
            const { id, type, payload } = e.data;

            //If there is a pending promise we solve it
            if (this.pending[id]) {
                this.pending[id](payload);
                delete this.pending[id];
            }
        };
    }

    //Send messages with an ID
    _sendToWorker(worker, message) {
        //Resolve the promise
        return new Promise(resolve => {
            //Crypto creates IDs basically speaking
            const id = crypto.randomUUID();
            this.pending[id] = resolve;
            worker.postMessage({ id, ...message });
        });
    }

    //This is for the Search Worker
    async searchRecipes(query) {
        //We send the request to the searchWorker, alongside the type and the query, and we store it in a constant
        const rawResults = await this._sendToWorker(this.searchWorker, {
            type: "SEARCH",
            query
        });

        //We check if the received item is an array and then we store it otherwise we store an empty array
        const list = Array.isArray(rawResults) ? rawResults : [];

        //Return the normalized list
        return list.map(r => RecipeFactory.normalize(r));
    }

    //Direct call to the API
    async getRecipeById(id) {
        //We receive the instance of the service
        const api = apiServiceSingleton.getInstance();
        //Get the recipes from api
        const raw = await api.get(`/recipes/${id}`);
        //Return the normalized result
        return RecipeFactory.normalize(raw);
    }

    //This is for the shopping list worker
    async recalculateShoppingList(planner, recipesCache, currentItems) {
        //We send the function to the worker alongside the type, planner, cache for recipes and current ingredients
        return await this._sendToWorker(this.shoppingWorker, {
            type: "RECALCULATE_LIST",
            planner,
            recipesCache,
            currentItems
        });
    }

    //This is for the nutrition worker
    async generateNutritionReport(planner, mode = "CALORIE_FOCUS", recipesCache) {
        //We send the default mode, planner and recipes cache to the appropriate worker
        return await this._sendToWorker(this.nutritionWorker, {
            type: "NUTRITION_REPORT",
            planner,
            recipesCache,
            mode
        });
    }
}

export default new WorkerFacade();