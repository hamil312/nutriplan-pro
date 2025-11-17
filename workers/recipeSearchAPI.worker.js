const API_BASE = "https://reqres.in/api";

const MOCK_RECIPES = [
  {
    id: "mock-1",
    title: "Pasta Alfredo",
    image: "https://picsum.photos/200",
    ingredients: [
      { name: "Pasta", quantity: 200, unit: "g" },
      { name: "Crema", quantity: 100, unit: "ml" },
      { name: "Queso", quantity: 50, unit: "g" }
    ],
    instructions: ["Hervir pasta", "Mezclar salsa", "Servir"]
  },
  {
    id: "mock-2",
    title: "Ensalada César",
    image: "https://picsum.photos/200",
    ingredients: [
      { name: "Lechuga", quantity: 1, unit: "pieza" },
      { name: "Crutones", quantity: 50, unit: "g" },
      { name: "Aderezo César", quantity: 30, unit: "ml" }
    ],
    instructions: ["Cortar lechuga", "Mezclar", "Agregar aderezo"]
  },
  {
    id: "mock-3",
    title: "Pollo al horno",
    image: "https://picsum.photos/200",
    ingredients: [
      { name: "Pollo", quantity: 1, unit: "kg" },
      { name: "Sal", quantity: 1, unit: "cda" },
      { name: "Pimienta", quantity: 1, unit: "cda" }
    ],
    instructions: ["Sazonar pollo", "Hornear 45 min", "Servir"]
  }
];

// =============================================================
// Worker
// =============================================================

self.addEventListener("message", async (ev) => {
  const { id, type, query } = ev.data;
  if (type !== "SEARCH") return;

  const q = (query || "").trim().toLowerCase();

  // Progreso opcional
  postMessage({ id, type: "PROGRESS", payload: { status: "fetching" } });

  let results = null;

  try {
    // Intento de búsqueda real (fallará normalmente)
    const res = await fetch(`${API_BASE}/recipes/search?q=${encodeURIComponent(q)}`);

    if (res.ok) {
      const json = await res.json();
      results = json.recipes || json.items || json.data || [];
    } else {
      // HTTP error → fallback después
      results = null;
    }

  } catch (err) {
    // Error de red → fallback
    results = null;
  }

  // Fallback automático
  if (!results || results.length === 0 || results === null || type === "SEARCH") {
    const filtered = MOCK_RECIPES.filter(r =>
            r.title.toLowerCase().includes(query.toLowerCase())
        );

        self.postMessage({
            id,
            type: "SEARCH_RESULT",
            payload: filtered
        });
  }

  postMessage({
    id,
    type: "SEARCH_RESULT",
    payload: results
  });
});
