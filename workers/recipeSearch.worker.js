//This is the worker in charge of performing recipe searching
const API_BASE = "https://reqres.in/api";

//This is an array of objects, containing the different mock recipes, because there are no carts nor recipes on the endpoint
const MOCK_RECIPES = [
    {
        id: "mock-1",
        title: "Pasta Alfredo",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR0TY78rA8L0CC_LPka0MHsYfqpaiDG5lUGJA&s",
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
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTy81pAPUwU8QlvkQNTt4zHQAT1f3KDjgFc9w&s",
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
        image: "https://imagenes.elpais.com/resizer/v2/4HWUG3I7PVA7VKAWLQVCBUL4E4.jpg?auth=114b5a92f5b098e2c67d9642883a4e7a3010b6020bac133f60f1c766f565b78f&width=1200",
        ingredients: [
        { name: "Pollo", quantity: 1, unit: "kg" },
        { name: "Sal", quantity: 1, unit: "cda" },
        { name: "Pimienta", quantity: 1, unit: "cda" }
        ],
        instructions: ["Sazonar pollo", "Hornear 45 min", "Servir"]
    },
    {
        id: "mock-4",
        title: "Tacos de Pollo",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRYBrTY7ybbmbHgFDiH8p7esv2kSq6l4cwjwA&s",
        ingredients: [
            { name: "Tortillas", quantity: 4, unit: "pieza" },
            { name: "Pollo", quantity: 200, unit: "g" },
            { name: "Cebolla", quantity: 0.5, unit: "pieza" }
        ],
        instructions: ["Cocinar pollo", "Picar cebolla", "Armar tacos"]
    },
    {
        id: "mock-5",
        title: "Sopa de Tomate",
        image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSLyAvy2aouuURRBpXnCx4PxRl43OZPa4otbg&s",
        ingredients: [
            { name: "Tomate", quantity: 3, unit: "pieza" },
            { name: "Agua", quantity: 500, unit: "ml" },
            { name: "Sal", quantity: 1, unit: "cdita" }
        ],
        instructions: ["Hervir tomates", "Licuar", "Sazonar y servir"]
    },
    {
        id: "mock-6",
        title: "Arroz con Verduras",
        image: "https://comedera.com/wp-content/uploads/sites/9/2014/05/arroz-con-verduras.jpg?w=500&h=465&crop=1",
        ingredients: [
            { name: "Arroz", quantity: 200, unit: "g" },
            { name: "Zanahoria", quantity: 1, unit: "pieza" },
            { name: "Arvejas", quantity: 50, unit: "g" }
        ],
        instructions: ["Saltear verduras", "Agregar arroz", "Hervir 15 min"]
    },
    {
        id: "mock-7",
        title: "Omelette de Queso",
        image: "https://cdn0.uncomo.com/es/posts/6/3/7/como_hacer_un_omelette_de_queso_31736_orig.jpg",
        ingredients: [
            { name: "Huevos", quantity: 2, unit: "pieza" },
            { name: "Queso", quantity: 40, unit: "g" },
            { name: "Sal", quantity: 1, unit: "cdita" }
        ],
        instructions: ["Batir huevos", "Agregar queso", "Cocinar en sartén"]
    },
    {
        id: "mock-8",
        title: "Hamburguesa Casera",
        image: "https://scc10.com.br/wp-content/uploads/2022/01/hamburguer.jpg",
        ingredients: [
            { name: "Carne molida", quantity: 150, unit: "g" },
            { name: "Tomate", quantity: 2, unit: "rodaja" },
            { name: "Pan", quantity: 1, unit: "pieza" },
            { name: "Lechuga", quantity: 1, unit: "hoja" }
        ],
        instructions: ["Formar carne", "Cocinar", "Armar hamburguesa"]
    },
    {
        id: "mock-9",
        title: "Pescado a la Plancha",
        image: "https://resizer.glanacion.com/resizer/v2/pescado-a-la-plancha-con-perejil-y-limon-sin-JXEOUGRB2VCEBPN5CAQBCRHTEQ.png?auth=e512ce67e4659670548db36aa0f36dfae2d968e8ca510c6d563a8aa4fcfeac3a&width=768&height=512&quality=70&smart=true",
        ingredients: [
            { name: "Filete de pescado", quantity: 1, unit: "pieza" },
            { name: "Limón", quantity: 1, unit: "pieza" },
            { name: "Sal", quantity: 1, unit: "cdita" }
        ],
        instructions: ["Marinar pescado", "Cocinar a la plancha", "Servir con limón"]
    },
    {
        id: "mock-10",
        title: "Ensalada de Frutas",
        image: "https://es.californiastrawberries.com/wp-content/uploads/2017/11/Mexican_Fruit_Salad-400x400.jpg",
        ingredients: [
            { name: "Manzana", quantity: 1, unit: "pieza" },
            { name: "Banano", quantity: 1, unit: "pieza" },
            { name: "Uvas", quantity: 10, unit: "pieza" }
        ],
        instructions: ["Cortar frutas", "Mezclar", "Enfriar y servir"]
    },
    {
        id: "mock-11",
        title: "Panqueques",
        image: "https://recetasdecocina.elmundo.es/wp-content/uploads/2024/12/panqueques-1024x683.jpg",
        ingredients: [
            { name: "Harina", quantity: 100, unit: "g" },
            { name: "Leche", quantity: 150, unit: "ml" },
            { name: "Huevo", quantity: 1, unit: "pieza" }
        ],
        instructions: ["Mezclar ingredientes", "Verter en sartén", "Cocinar ambos lados"]
    },
    {
        id: "mock-12",
        title: "Guacamole",
        image: "https://patijinich.com/es/wp-content/uploads/sites/3/2021/09/guacamole-salsa.jpg",
        ingredients: [
            { name: "Aguacate", quantity: 2, unit: "pieza" },
            { name: "Cebolla", quantity: 0.25, unit: "pieza" },
            { name: "Limón", quantity: 1, unit: "pieza" }
        ],
        instructions: ["Aplastar aguacate", "Agregar cebolla", "Exprimir limón"]
    },
    {
        id: "mock-13",
        title: "Sandwich de Atún",
        image: "https://i.ytimg.com/vi/g7lG6gplBgA/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDHif_CStSMqMGAjavqsa4BODdHXQ",
        ingredients: [
            { name: "Pan", quantity: 2, unit: "rebanada" },
            { name: "Atún", quantity: 1, unit: "lata" },
            { name: "Mayonesa", quantity: 1, unit: "cda" }
        ],
        instructions: ["Mezclar atún con mayo", "Armar sandwich", "Servir"]
    },
    {
        id: "mock-14",
        title: "Espaguetis Boloñesa",
        image: "https://imag.bonviveur.com/espaguetis-a-la-bolonesa.jpg",
        ingredients: [
            { name: "Espaguetis", quantity: 200, unit: "g" },
            { name: "Carne molida", quantity: 120, unit: "g" },
            { name: "Tomate", quantity: 2, unit: "pieza" }
        ],
        instructions: ["Cocinar pasta", "Preparar salsa", "Mezclar y servir"]
    },
    {
        id: "mock-15",
        title: "Arepas Rellenas",
        image: "https://imag.bonviveur.com/arepas-colombianas-con-queso-partidas.jpg",
        ingredients: [
            { name: "Harina de maíz", quantity: 120, unit: "g" },
            { name: "Queso", quantity: 50, unit: "g" },
            { name: "Mantequilla", quantity: 10, unit: "g" }
        ],
        instructions: ["Formar arepas", "Cocinar", "Rellenar con queso"]
    },
    {
        id: "mock-16",
        title: "Batido de Mango",
        image: "https://imag.bonviveur.com/batido-de-mango.jpg",
        ingredients: [
            { name: "Mango", quantity: 1, unit: "pieza" },
            { name: "Leche", quantity: 200, unit: "ml" },
            { name: "Hielo", quantity: 3, unit: "cubos" }
        ],
        instructions: ["Licuar ingredientes", "Servir frío"]
    },
    {
        id: "mock-17",
        title: "Crema de Champiñones",
        image: "https://recetasdecocina.elmundo.es/wp-content/uploads/2024/12/crema-de-champinones.jpg",
        ingredients: [
            { name: "Champiñones", quantity: 150, unit: "g" },
            { name: "Leche", quantity: 200, unit: "ml" },
            { name: "Sal", quantity: 1, unit: "cdita" }
        ],
        instructions: ["Saltear champiñones", "Agregar leche", "Licuar"]
    },
    {
        id: "mock-18",
        title: "Quesadillas",
        image: "https://www.vvsupremo.com/wp-content/uploads/2015/11/900X570_Two-Cheese-Quesadillas.jpg",
        ingredients: [
            { name: "Tortillas", quantity: 2, unit: "pieza" },
            { name: "Queso", quantity: 80, unit: "g" },
            { name: "Salsa", quantity: 20, unit: "ml" }
        ],
        instructions: ["Rellenar tortilla", "Calentar en sartén", "Cortar y servir"]
    }
];

//This is the worker, once a message arrives
self.onmessage = (e) => {
    //We store message data in some variables
    const { id, type, query } = e.data;

    //If the request is search type
    if (type === "SEARCH") {
        //We filter the recipes finding the ones which lowercase titles match our lowercase query
        const filtered = MOCK_RECIPES.filter(r =>
            r.title.toLowerCase().includes(query.toLowerCase())
        );

        //Send a message containing the search results
        self.postMessage({
            id,
            type: "SEARCH_RESULT",
            payload: filtered
        });
    }
};
