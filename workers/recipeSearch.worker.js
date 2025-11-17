const BASE = self.BASE_URL || ''; // si quieres inyectar base URL desde main, puedes setear self.BASE_URL

self.addEventListener('message', async (ev) => {
    const msg = ev.data;
    const { id, type } = msg;

    try {
        if (type === 'SEARCH') {
            const query = (msg.query || '').trim();
            if (!query) {
                postMessage({ id, type: 'RESULT', payload: [] });
                return;
            }

            postMessage({ id, type: 'PROGRESS', payload: { status: 'fetching' } });

            // Intentamos la búsqueda real en /recipes/search?q=...
            // Si tu API real no tiene este endpoint, la llamada fallará y caeremos a mock.
            let results = null;
            try {
                const res = await fetch(`/recipes/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                const data = await res.json();
                // asumimos data.recipes o data.products o data.items
                results = data.recipes || data.products || data.items || data || [];
                } else {
                // si status 404/501 -> fallback a mock
                results = null;
                }
            } catch (e) {
                results = null;
            }

            // Si no obtuvimos datos reales, generamos mock para demo
            if (!results || !Array.isArray(results) || results.length === 0) {
                // mock ligero, suficiente para demo y UI
                results = Array.from({ length: 5 }).map((_, i) => ({
                    id: `mock-${query}-${i+1}`,
                    title: `${query} receta ${i+1}`,
                    image: null,
                    ingredients: [
                        { name: 'Tomate', quantity: 2, unit: 'uds' },
                        { name: 'Pan', quantity: 1, unit: 'barra' }
                    ],
                    instructions: ['Paso 1', 'Paso 2'],
                    // opcional: nutrición por receta si la API la trae
                    nutrition: { calories: 200 + i * 30, protein: 10 + i, fat: 5 + i }
                }));
            }

            // Enviar resultado (no normalizamos aquí: WorkerFacade / RecipeFactory puede normalizar)
            postMessage({ id, type: 'RESULT', payload: results });
        } else {
            postMessage({ id, type: 'ERROR', payload: `Unknown message type ${type}` });
        }
    } catch (err) {
        postMessage({ id, type: 'ERROR', payload: err.message || String(err) });
    }
});