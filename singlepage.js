// ==================== ESTADO DEL CARRITO ====================
let carrito = [];
let temporizadorCarrito = null; // Controla el cierre automático en 4s

// ==================== DATOS DE PRODUCTOS (12 ÍTEMS) ====================
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

// ==================== INICIALIZACIÓN ====================
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    inicializarMenuMovil();
    inicializarCarrusel();
});

// ==================== RENDERIZADO DE PRODUCTOS ====================
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
                        <button class="btn btn-primary" onclick="agregarAlCarrito(${prod.id})">Agregar</button>
                    </div>
                </div>
            </div>
        `;

        if (prod.categoria === 'textil') gridTextil.innerHTML += cardHTML;
        else if (prod.categoria === 'tazas') gridTazas.innerHTML += cardHTML;
        else if (prod.categoria === 'cuadros') gridCuadros.innerHTML += cardHTML;
    });
}

// ==================== MANEJO DE CANTIDADES (+ / -) ====================
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

// ==================== LÓGICA DEL CARRITO & AUTO-CIERRE ====================
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

    if (inputCant) inputCant.value = 1; // Resetea el input a 1
    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito();
}

function cambiarCantidadCarrito(idProducto, cambio) {
    const item = carrito.find(p => p.id === idProducto);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        eliminarDelCarrito(idProducto);
        return;
    }

    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito(); // Reinicia los 4s al cambiar cantidad dentro del carrito
}

function eliminarDelCarrito(idProducto) {
    carrito = carrito.filter(item => item.id !== idProducto);
    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito();
}

function actualizarCarritoUI() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');

    const totalProductos = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    if (cartCount) cartCount.textContent = totalProductos;

    if (!cartItemsContainer) return;

    if (carrito.length === 0) {
        cartItemsContainer.innerHTML = '<p class="cart-empty">El carrito está vacío</p>';
        if (cartTotal) cartTotal.textContent = 'S/ 0.00';
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

    if (cartTotal) cartTotal.textContent = `S/ ${totalPrecio.toFixed(2)}`;
}

// Muestra el carrito y programa el temporizador de 4 segundos ⏱️
function mostrarYProgramarCierreCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (!cartDropdown) return;

    cartDropdown.classList.add('active');

    // Limpia el temporizador anterior si existía
    if (temporizadorCarrito) {
        clearTimeout(temporizadorCarrito);
    }

    // Oculta el panel automáticamente a los 4000 milisegundos (4s)
    temporizadorCarrito = setTimeout(() => {
        cartDropdown.classList.remove('active');
    }, 4000);
}

function toggleCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (cartDropdown) {
        cartDropdown.classList.toggle('active');
        if (!cartDropdown.classList.contains('active') && temporizadorCarrito) {
            clearTimeout(temporizadorCarrito);
        }
    }
}

// ==================== INTERFAZ DE USUARIO (Navegación & Carrusel) ====================
function inicializarMenuMovil() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
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

    setInterval(() => showSlide(currentSlide + 1), 5000); // Cambio automático
}