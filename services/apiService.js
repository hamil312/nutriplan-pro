//Singleton API service used to handle API requests with a base URL and API key
const API_BASE = "https://reqres.in/api";
const API_KEY = "reqres-free-v1";

class ApiService {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    buildHeaders(extra = {}) {
        const headers = {
            "Content-Type": "application/json",
            "x-api-key": API_KEY,
            ...extra
        };

        if (this.token) {
            headers["Authorization"] = `Bearer ${this.token}`;
        }

        return headers;
    }

    async get(path) {
        const res = await fetch(this.baseURL + path, {
            method: "GET",
            headers: this.buildHeaders()
        });
        if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
        return res.json();
    }

    async post(path, body) {
        const res = await fetch(this.baseURL + path, {
            method: "POST",
            headers: this.buildHeaders(),
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
        return res.json();
    }
}

class ApiServiceSingleton {
    constructor() {
        this.instance = null;
    }

    getInstance(base = API_BASE) {
        if (!this.instance) {
            this.instance = new ApiService(base);
        }
        return this.instance;
    }
}

export default new ApiServiceSingleton();