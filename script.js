// Categorias cargadas desde palabras.js (window.categorias)

// --- VARIABLES GLOBALES ---
let jugadores = [];
let indicesImpostores = new Set(); // Usamos Set para múltiples
let palabraSecreta = "";
let categoriaActual = "";
let indiceJugadorActual = 0;
let mostrarPistaImpostor = false;

// --- REFERENCIAS AL DOM ---
const pantallas = {
    inicio: document.getElementById('pantalla-inicio'),
    nombres: document.getElementById('pantalla-nombres'),
    pase: document.getElementById('pantalla-pase'),
    rol: document.getElementById('pantalla-rol'),
    juego: document.getElementById('pantalla-juego'),
    resultados: document.getElementById('pantalla-resultados')
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
});

function cargarCategorias() {
    const select = document.getElementById('select-categoria');
    select.innerHTML = '';
    Object.keys(window.categorias).forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

// --- FUNCIONES DE UTILIDAD PARA UI ---
function mostrarPantalla(nombrePantalla) {
    Object.values(pantallas).forEach(p => p.classList.remove('activa'));
    pantallas[nombrePantalla].classList.add('activa');
}

// Exponer funciones al window
window.ajustarJugadores = (delta) => {
    const input = document.getElementById('num-jugadores');
    let val = parseInt(input.value) + delta;
    if (val < 3) val = 3;
    if (val > 15) val = 15;
    input.value = val;
    validarMaxImpostores();
};

window.ajustarImpostores = (delta) => {
    const input = document.getElementById('num-impostores');
    let val = parseInt(input.value) + delta;
    const maxImpostores = Math.floor(parseInt(document.getElementById('num-jugadores').value) / 2);
    
    if (val < 1) val = 1;
    if (val > maxImpostores) val = maxImpostores;
    
    input.value = val;
};

function validarMaxImpostores() {
    const numJug = parseInt(document.getElementById('num-jugadores').value);
    const inputImp = document.getElementById('num-impostores');
    const actualImp = parseInt(inputImp.value);
    const maxPermitido = Math.floor(numJug / 2);
    
    if (actualImp > maxPermitido) {
        inputImp.value = maxPermitido;
    }
}

// --- FLUJO DEL JUEGO ---

// 1. Configuración -> Nombres
window.iniciarConfiguracion = () => {
    const num = parseInt(document.getElementById('num-jugadores').value);
    const contenedorNombres = document.getElementById('lista-inputs-nombres');
    contenedorNombres.innerHTML = '';
    
    // Guardamos configuración extra
    mostrarPistaImpostor = document.getElementById('check-pistas').checked;

    for (let i = 0; i < num; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Jugador ${i + 1}`;
        input.id = `input-jugador-${i}`;
        input.value = `Jugador ${i + 1}`; // Default value
        input.onfocus = function() { this.select(); };
        contenedorNombres.appendChild(input);
    }
    
    mostrarPantalla('nombres');
};

// 2. Nombres -> Preparar lógica -> Primer Pase
window.confirmarNombres = () => {
    // Recopilar nombres
    const num = parseInt(document.getElementById('num-jugadores').value);
    jugadores = [];
    for (let i = 0; i < num; i++) {
        const nombre = document.getElementById(`input-jugador-${i}`).value.trim() || `Jugador ${i+1}`;
        jugadores.push(nombre);
    }

    // Lógica del juego
    categoriaActual = document.getElementById('select-categoria').value;
    const palabrasPosibles = window.categorias[categoriaActual];
    palabraSecreta = palabrasPosibles[Math.floor(Math.random() * palabrasPosibles.length)];
    
    // Seleccionar impostores
    const numImpostores = parseInt(document.getElementById('num-impostores').value);
    indicesImpostores = new Set();
    while (indicesImpostores.size < numImpostores) {
        const idx = Math.floor(Math.random() * jugadores.length);
        indicesImpostores.add(idx);
    }

    indiceJugadorActual = 0;

    // Iniciar ronda de pases
    actualizarPantallaPase();
};

function actualizarPantallaPase() {
    if (indiceJugadorActual >= jugadores.length) {
        // Todos vieron su rol -> Ir al juego
        prepararPantallaJuego();
        mostrarPantalla('juego');
        return;
    }

    document.getElementById('nombre-jugador-pase').textContent = jugadores[indiceJugadorActual];
    // Resetear tarjeta
    const tarjeta = document.getElementById('tarjeta-rol');
    tarjeta.classList.remove('revelada');
    
    mostrarPantalla('pase');
}

// 3. Ver Rol
window.mostrarRol = () => {
    mostrarPantalla('rol');
    
    const esImpostor = indicesImpostores.has(indiceJugadorActual);
    const icono = document.getElementById('icono-rol');
    const titulo = document.getElementById('titulo-rol');
    const texto = document.getElementById('texto-secreta');
    const instruccion = document.getElementById('instruccion-rol');

    if (esImpostor) {
        icono.textContent = "😈";
        titulo.innerText = "¡ERES EL IMPOSTOR!";
        titulo.classList.add('alerta-impostor');
        
        if (mostrarPistaImpostor) {
             texto.innerText = `Cat: ${categoriaActual}`;
             texto.style.fontSize = "1.5rem"; // Ajuste por si es largo
             instruccion.innerText = "Esa es la categoría. ¡Improvisa!";
        } else {
             texto.innerText = "NO SABES LA PALABRA";
             instruccion.innerText = "Finge que sabes y no te dejes pillar.";
        }
    } else {
        icono.textContent = "😇";
        titulo.innerText = "ERES UN CIUDADANO";
        titulo.classList.remove('alerta-impostor');
        texto.innerText = palabraSecreta;
        texto.style.fontSize = "2rem";
        instruccion.innerText = `La categoría es: ${categoriaActual}`;
    }
};

window.toggleTarjeta = () => {
    document.getElementById('tarjeta-rol').classList.toggle('revelada');
};

window.siguienteJugador = () => {
    document.getElementById('tarjeta-rol').classList.remove('revelada');
    setTimeout(() => {
        indiceJugadorActual++;
        actualizarPantallaPase();
    }, 200);
};

// 4. Fase de Juego
function prepararPantallaJuego() {
    document.getElementById('categoria-juego').innerText = categoriaActual;
    const orden = [...jugadores].sort(() => Math.random() - 0.5);
    const contenedorOrden = document.getElementById('lista-orden-juego');
    contenedorOrden.innerHTML = '';
    orden.forEach(nom => {
        const pill = document.createElement('span');
        pill.className = 'jugador-pill';
        pill.textContent = nom;
        contenedorOrden.appendChild(pill);
    });
}

window.revelarResultados = () => {
    mostrarPantalla('resultados');
    
    // Mostrar lista de nombres
    const nombresImpostores = jugadores.filter((_, idx) => indicesImpostores.has(idx));
    
    // Gramática correcta (El/Los)
    const labelImpostor = indicesImpostores.size > 1 ? "Los Impostores eran:" : "El Impostor era:";
    
    // Cambiar texto en HTML dinámicamente si es necesario o usar el genérico
    // Mejor buscamos el nodo p anterior al h1 si queremos cambiar "El Impostor era:"
    // Pero lo más fácil es ponerlo en el h1
    
    const pLabel = document.getElementById('nombre-impostor').previousElementSibling;
    if(pLabel) pLabel.textContent = labelImpostor;

    document.getElementById('nombre-impostor').textContent = nombresImpostores.join(" Y ");
    document.getElementById('palabra-final').textContent = palabraSecreta;
};

// 5. Reiniciar
window.reiniciarJuego = () => {
    // Volver a configurar con los mismos jugadores o ir al inicio?
    // Ir a configuración de nombres (skip setup inicial) o inicio?
    // Mejor ir a inicio para cambiar categoría
    mostrarPantalla('inicio');
};
