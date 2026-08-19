// =========================================================================
// 1. ESTADO GLOBAL & DATOS DE PRODUCTOS
// =========================================================================
let carrito = [];
let temporizadorCarrito = null; // Controla la ocultación automática diferida del carrito

// Catálogo base de productos disponibles (12 ítems repartidos en 3 categorías)
const productos = [
    { id: 1, nombre: "Polo DTF Diseño Urbano", precio: 35.00, categoria: "textil", imagen: "assets/images/polo1.webp" },
    { id: 2, nombre: "Polo Estampado Anime", precio: 38.00, categoria: "textil", imagen: "assets/images/polo2.webp" },
    { id: 3, nombre: "Polera Oversize Minimalista", precio: 65.00, categoria: "textil", imagen: "assets/images/polo3.webp" },
    { id: 4, nombre: "Polera con Capucha Streetwear", precio: 70.00, categoria: "textil", imagen: "assets/images/polo4.webp" },
    { id: 5, nombre: "Gorra Personalizada Premium", precio: 25.00, categoria: "textil", imagen: "assets/images/polo5.webp" },
    { id: 6, nombre: "Tote Bag de Algodón Ilustrado", precio: 20.00, categoria: "textil", imagen: "assets/images/polo6.webp" },
    { id: 7, nombre: "Taza Mágica Sensible al Calor", precio: 22.00, categoria: "tazas", imagen: "assets/images/taza1.webp" },
    { id: 8, nombre: "Taza Cerámica Programador", precio: 18.00, categoria: "tazas", imagen: "assets/images/taza2.webp" },
    { id: 9, nombre: "Taza Térmica Acero Inoxidable", precio: 30.00, categoria: "tazas", imagen: "assets/images/taza3.webp" },
    { id: 10, nombre: "Cuadro Canvas Arte Moderno", precio: 45.00, categoria: "cuadros", imagen: "assets/images/cuadro1.webp" },
    { id: 11, nombre: "Cuadro Marco de Madera Fotografía", precio: 50.00, categoria: "cuadros", imagen: "assets/images/cuadro2.webp" },
    { id: 12, nombre: "Set de 3 Mini Cuadros Ilustrados", precio: 60.00, categoria: "cuadros", imagen: "assets/images/cuadro3.webp" }
];

// =========================================================================
// 2. INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    inicializarMenuMovil();
    inicializarCarrusel();
});

// =========================================================================
// 3. RENDERIZADO DE PRODUCTOS Y SECTORES DE TIENDA
// =========================================================================
function cargarProductos() {
    const gridTextil = document.getElementById('gridTextil');
    const gridTazas = document.getElementById('gridTazas');
    const gridCuadros = document.getElementById('gridCuadros');

    if (!gridTextil || !gridTazas || !gridCuadros) return;

    gridTextil.innerHTML = '';
    gridTazas.innerHTML = '';
    gridCuadros.innerHTML = '';

    productos.forEach(prod => {
        const cardHTML = `
            <div class="product-card">
                <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy">
                <div class="product-info">
                    <h3 class="product-title">${prod.nombre}</h3>
                    <div class="product-price">S/ ${prod.precio.toFixed(2)}</div>
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="qty-btn minus" onclick="decrementarCantidad('cant-${prod.id}')" aria-label="Disminuir cantidad">-</button>
                            <input type="number" id="cant-${prod.id}" value="1" min="1" class="qty-input" readonly>
                            <button class="qty-btn plus" onclick="incrementarCantidad('cant-${prod.id}')" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <button class="btn btn-primary add-to-cart-btn" onclick="agregarAlCarrito(${prod.id})">Agregar</button>
                    </div>
                </div>
            </div>
        `;

        if (prod.categoria === 'textil') gridTextil.innerHTML += cardHTML;
        else if (prod.categoria === 'tazas') gridTazas.innerHTML += cardHTML;
        else if (prod.categoria === 'cuadros') gridCuadros.innerHTML += cardHTML;
    });
}

// =========================================================================
// 4. MANEJO DE CANTIDADES EN LA TARJETA DE PRODUCTO (+ / -)
// =========================================================================
function incrementarCantidad(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.value = parseInt(input.value) + 1;
    }
}

function decrementarCantidad(inputId) {
    const input = document.getElementById(inputId);
    if (input && parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

// =========================================================================
// 5. LÓGICA DEL CARRITO DE COMPRAS & EVENTOS DE VISIBILIDAD
// =========================================================================

/**
 * Agrega un producto seleccionado al carrito utilizando la cantidad del input.
 * @param {number} idProducto - ID único del producto.
 */
function agregarAlCarrito(idProducto) {
    const inputCant = document.getElementById(`cant-${idProducto}`);
    const cantidad = inputCant ? parseInt(inputCant.value) : 1;
    const producto = productos.find(p => p.id === idProducto);

    if (!producto) return;

    const itemExistente = carrito.find(item => item.id === idProducto);

    if (itemExistente) {
        itemExistente.cantidad += cantidad;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: cantidad
        });
    }

    if (inputCant) inputCant.value = 1; // Resetea el selector de la tarjeta a 1
    actualizarCarritoUI();
    //mostrarYProgramarCierreCarrito(); // Muestra el carrito y lo oculta tras 2 segundos
}

/**
 * Incrementa o decrementa la cantidad de un ítem dentro del panel del carrito.
 * @param {number} idProducto - ID único del producto.
 * @param {number} cambio - Variación (+1 o -1).
 */
function cambiarCantidadCarrito(idProducto, cambio) {
    const item = carrito.find(p => p.id === idProducto);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        eliminarDelCarrito(idProducto);
        return;
    }

    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito(); // Reinicia la ventana de visibilidad tras cada ajuste
}

/**
 * Elimina completamente un producto del carrito.
 * @param {number} idProducto - ID único del producto a remover.
 */
function eliminarDelCarrito(idProducto) {
    carrito = carrito.filter(item => item.id !== idProducto);
    actualizarCarritoUI();

    if (carrito.length === 0) {
        // Si el carrito queda vacío, programa el cierre tras 4 segundos
        mostrarYProgramarCierreCarrito();
    } else {
        // Si aún quedan ítems, forzar que el panel continúe visible sin auto-cierre
        const cartDropdown = document.getElementById('cartDropdown');
        if (cartDropdown) {
            cartDropdown.classList.add('active');
        }

        if (temporizadorCarrito) {
            clearTimeout(temporizadorCarrito);
            temporizadorCarrito = null;
        }
    }
}

/**
 * Actualiza la renderización HTML de los ítems del carrito, el contador e importe total.
 */
function actualizarCarritoUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    const totalProductos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (cartCount) cartCount.textContent = totalProductos;

    if (!cartItemsContainer) return;

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty">El carrito está vacío</p>';
        if (cartTotal) cartTotal.textContent = '0.00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let totalPrecio = 0;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        totalPrecio += subtotal;

        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
                <div class="cart-item-details">
                    <strong>${item.nombre}</strong>
                    <small>Precio unit.: S/ ${item.precio.toFixed(2)}</small>
                    <div class="cart-item-actions">
                        <div class="quantity-selector cart-qty">
                            <button class="qty-btn minus" onclick="cambiarCantidadCarrito(${item.id}, -1)">-</button>
                            <span class="qty-value">${item.cantidad}</span>
                            <button class="qty-btn plus" onclick="cambiarCantidadCarrito(${item.id}, 1)">+</button>
                        </div>
                        <span class="cart-item-price">S/ ${subtotal.toFixed(2)}</span>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="eliminarDelCarrito(${item.id})" title="Eliminar producto">&times;</button>
            </div>
        `;
    });

    if (cartTotal) cartTotal.textContent = totalPrecio.toFixed(2);
}

/**
 * Despliega el carrito y configura un temporizador de 2000 ms para ocultarlo automáticamente.
 */
function mostrarYProgramarCierreCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (!cartDropdown) return;

    cartDropdown.classList.add('active');

    if (temporizadorCarrito) {
        clearTimeout(temporizadorCarrito);
    }

    temporizadorCarrito = setTimeout(() => {
        cartDropdown.classList.remove('active');
        temporizadorCarrito = null;
    }, 2000);
}

/**
 * Cierra manualmente el modal del carrito y detiene cualquier temporizador programado.
 */
function cerrarCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (!cartDropdown) return;

    if (temporizadorCarrito) {
        clearTimeout(temporizadorCarrito);
        temporizadorCarrito = null;
    }

    cartDropdown.classList.remove('active');
}

/**
 * Alterna (Abre/Cierra) la visibilidad del panel del carrito al presionar el botón del Header.
 * Si se abre vaciando contenido, se cerrará solo tras 2 segundos.
 */
function toggleCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (!cartDropdown) return;

    if (cartDropdown.classList.contains('active')) {
        cerrarCarrito();
    } else {
        if (temporizadorCarrito) {
            clearTimeout(temporizadorCarrito);
            temporizadorCarrito = null;
        }

        cartDropdown.classList.add('active');

        // Si se despliega en estado vacío, se auto-cierra en 2 segundos
        if (carrito.length === 0) {
            temporizadorCarrito = setTimeout(() => {
                cerrarCarrito();
            }, 2000);
        }
    }
}

// Escuchador de clics globales para detectar interacciones fuera del carrito 🖱️
document.addEventListener('click', (event) => {
    const cartDropdown = document.getElementById('cartDropdown');
    const cartBtn = document.getElementById('cartBtn');

    if (!cartDropdown || !cartBtn) return;

    if (cartDropdown.classList.contains('active')) {
        const esClicDentroDelCarrito = cartDropdown.contains(event.target);
        const esClicEnBotonHeader = cartBtn.contains(event.target);
        // Excepciones explícitas para evitar falsas detecciones de clics "fuera" al presionar botones internos
        const esClicEnBotonAccion = event.target.closest('.add-to-cart-btn, .qty-btn, .btn, .cart-item-remove');

        if (!esClicDentroDelCarrito && !esClicEnBotonHeader && !esClicEnBotonAccion) {
            cerrarCarrito();
        }
    }
});

// =========================================================================
// 6. COMPONENTES INTERACTIVOS (Navegación Móvil & Carrusel Hero)
// =========================================================================
function inicializarMenuMovil() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        // Abrir/cerrar menú desplegable móvil
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Prevenir salto inesperado al pulsar la categoría padre "Tienda"
        const dropdownToggle = navMenu.querySelector('.dropdown > a');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', (event) => {
                event.preventDefault();
            });
        }

        // Auto-cerrar el menú al hacer clic en un enlace directo
        const navLinks = navMenu.querySelectorAll('a:not(.dropdown > a)');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

function inicializarCarrusel() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;

    let currentSlide = 0;

    const showSlide = (index) => {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    const nextBtn = document.getElementById('nextSlide');
    const prevBtn = document.getElementById('prevSlide');

    if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));

    // Desplazamiento automático cada 5 segundos
    setInterval(() => showSlide(currentSlide + 1), 5000);
}