//Singleton API service used to handle API requests with a base URL and API key
const API_BASE = "https://reqres.in/api";
const API_KEY = "reqres-free-v1";

class ApiService {
    //The constructor accepts a base URL for the API, and sets an optional token for authenticated requests
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = null;
    }

    //Function to set the authentication token
    setToken(token) {
        this.token = token;
    }

    //Function to build headers for API requests, including the API key and optional authorization token, it uses any extra headers passed in
    buildHeaders(extra = {}) {
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            ...extra
        };

        if (this.token) {
            //If a token is set, include it in the Authorization header
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        return headers;
    }

    //Function to perform a GET request to the specified path
    async get(path) {
        //Perform the fetch with the built headers, combining the base URL and path
        const res = await fetch(this.baseURL + path, {
            method: "GET",
            headers: this.buildHeaders()
        });
        if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
        return res.json();
    }

    //Function to perform a POST request to the specified path with a JSON body
    async post(path, body) {
        //Perform the fetch with the built headers and JSON-stringified body
        const res = await fetch(this.baseURL + path, {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
        return res.json();
    }
}

//Singleton pattern to ensure only one instance of ApiService exists
class ApiServiceSingleton {
    constructor() {
        this.instance = null;
    }

    getInstance(base = API_BASE) {
        //If no instance exists, create one with the provided base URL
        if (!this.instance) {
            this.instance = new ApiService(base);
        }
        return this.instance;
    }
}

export default new ApiServiceSingleton();