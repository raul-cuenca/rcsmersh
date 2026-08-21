// =========================================================================
// 1. ESTADO GLOBAL & DATOS DE PRODUCTOS
// =========================================================================
let carrito = [];
let temporizadorCarrito = null; 
let listaProductosGlobal = []; // Guarda todos los productos (Supabase o Locales)

// Catálogo base de respaldo
const productosBase = [
    { id: '1', nombre: "Polo DTF Diseño Urbano", precio: 35.00, categoria: "textil", imagen: "assets/img_productos_opt/polo1.webp" },
    { id: '2', nombre: "Polo Estampado Anime", precio: 38.00, categoria: "textil", imagen: "assets/img_productos_opt/polo2.webp" },
    { id: '3', nombre: "Polera Oversize Minimalista", precio: 65.00, categoria: "textil", imagen: "assets/img_productos_opt/polo3.webp" },
    { id: '4', nombre: "Polera con Capucha Streetwear", precio: 70.00, categoria: "textil", imagen: "assets/img_productos_opt/polo4.webp" },
    { id: '5', nombre: "Gorra Personalizada Premium", precio: 25.00, categoria: "textil", imagen: "assets/img_productos_opt/polo5.webp" },
    { id: '6', nombre: "Tote Bag de Algodón Ilustrado", precio: 20.00, categoria: "textil", imagen: "assets/img_productos_opt/polo6.webp" },
    { id: '7', nombre: "Taza Mágica Sensible al Calor", precio: 22.00, categoria: "tazas", imagen: "assets/img_productos_opt/taza1.webp" },
    { id: '8', nombre: "Taza Cerámica Programador", precio: 18.00, categoria: "tazas", imagen: "assets/img_productos_opt/taza2.webp" },
    { id: '9', nombre: "Taza Térmica Acero Inoxidable", precio: 30.00, categoria: "tazas", imagen: "assets/img_productos_opt/taza3.webp" },
    { id: '10', nombre: "Cuadro Canvas Arte Moderno", precio: 45.00, categoria: "cuadros", imagen: "assets/img_productos_opt/cuadro1.webp" },
    { id: '11', nombre: "Cuadro Marco de Madera Fotografía", precio: 50.00, categoria: "cuadros", imagen: "assets/img_productos_opt/cuadro2.webp" },
    { id: '12', nombre: "Set de 3 Mini Cuadros Ilustrados", precio: 60.00, categoria: "cuadros", imagen: "assets/img_productos_opt/cuadro3.webp" }
];

// =========================================================================
// 2. INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarMenuMovil();
    inicializarCarrusel();
    obtenerProductos(); // Carga desde Supabase
});

// =========================================================================
// 3. CONSULTA A SUPABASE & RENDERIZADO UNIFICADO
// =========================================================================
async function obtenerProductos() {
    try {
        let productosProcesados = [];

        if (window.supabaseClient) {
            const { data, error } = await window.supabaseClient
                .from('productos')
                .select('*')
                .eq('activo', true)
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                // Normalizar estructura de Supabase a formato estándar
                productosProcesados = data.map(item => ({
                    id: String(item.id),
                    nombre: item.modelo || item.nombre || 'Producto Sin Nombre',
                    precio: parseFloat(item.precio_vta_unit || item.precio || 0),
                    imagen: item.imagen_url || item.imagen || 'assets/img_productos_opt/polo1.webp',
                    categoria: (item.categoria || 'textil').toLowerCase()
                }));
            }
        }

        // Si Supabase está vacío o sin datos, usa la lista base de respaldo
        if (productosProcesados.length === 0) {
            productosProcesados = productosBase;
        }

        listaProductosGlobal = productosProcesados;
        renderizarProductosUnificados(listaProductosGlobal);

    } catch (err) {
        console.error('Error al cargar productos:', err);
        listaProductosGlobal = productosBase;
        renderizarProductosUnificados(listaProductosGlobal);
    }
}

/**
 * Renderiza todas las tarjetas garantizando visualización 100% uniforme
 */
function renderizarProductosUnificados(productos) {
    const gridTextil = document.getElementById('gridTextil');
    const gridTazas = document.getElementById('gridTazas');
    const gridCuadros = document.getElementById('gridCuadros');
    const gridOtros = document.getElementById('gridOtros');
    const secOtros = document.getElementById('categoria-otros');

    if (!gridTextil || !gridTazas || !gridCuadros) return;

    gridTextil.innerHTML = '';
    gridTazas.innerHTML = '';
    gridCuadros.innerHTML = '';
    if (gridOtros) gridOtros.innerHTML = '';

    let hayOtros = false;

    productos.forEach(prod => {
        const cardHTML = `
            <div class="product-card">
                <div class="product-img-wrapper">
                    <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3 class="product-title" title="${prod.nombre}">${prod.nombre}</h3>
                    <div class="product-price">S/ ${prod.precio.toFixed(2)}</div>
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="qty-btn minus" onclick="decrementarCantidad('cant-${prod.id}')" aria-label="Disminuir cantidad">-</button>
                            <input type="number" id="cant-${prod.id}" value="1" min="1" class="qty-input" readonly>
                            <button class="qty-btn plus" onclick="incrementarCantidad('cant-${prod.id}')" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <button class="btn btn-primary add-to-cart-btn" onclick="agregarAlCarrito('${prod.id}')">Agregar</button>
                    </div>
                </div>
            </div>
        `;

        const cat = (prod.categoria || '').toLowerCase();

        if (cat.includes('textil') || cat.includes('polo')) {
            gridTextil.innerHTML += cardHTML;
        } else if (cat.includes('taza')) {
            gridTazas.innerHTML += cardHTML;
        } else if (cat.includes('cuadro')) {
            gridCuadros.innerHTML += cardHTML;
        } else {
            if (gridOtros) {
                gridOtros.innerHTML += cardHTML;
                hayOtros = true;
            } else {
                gridTextil.innerHTML += cardHTML; // Fallback
            }
        }
    });

    if (secOtros) {
        secOtros.style.display = hayOtros ? 'block' : 'none';
    }
}

// =========================================================================
// 4. MANEJO DE CANTIDADES (+ / -)
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
// 5. LÓGICA DEL CARRITO DE COMPRAS
// =========================================================================
function agregarAlCarrito(idProducto) {
    const idStr = String(idProducto);
    const inputCant = document.getElementById(`cant-${idStr}`);
    const cantidad = inputCant ? parseInt(inputCant.value) : 1;
    
    const producto = listaProductosGlobal.find(p => String(p.id) === idStr);

    if (!producto) return;

    const itemExistente = carrito.find(item => String(item.id) === idStr);

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

    if (inputCant) inputCant.value = 1;
    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito();
}

function cambiarCantidadCarrito(idProducto, cambio) {
    const idStr = String(idProducto);
    const item = carrito.find(p => String(p.id) === idStr);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        eliminarDelCarrito(idStr);
        return;
    }

    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito();
}

function eliminarDelCarrito(idProducto) {
    const idStr = String(idProducto);
    carrito = carrito.filter(item => String(item.id) !== idStr);
    actualizarCarritoUI();

    if (carrito.length === 0) {
        mostrarYProgramarCierreCarrito();
    } else {
        const cartDropdown = document.getElementById('cartDropdown');
        if (cartDropdown) cartDropdown.classList.add('active');

        if (temporizadorCarrito) {
            clearTimeout(temporizadorCarrito);
            temporizadorCarrito = null;
        }
    }
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
                            <button class="qty-btn minus" onclick="cambiarCantidadCarrito('${item.id}', -1)">-</button>
                            <span class="qty-value">${item.cantidad}</span>
                            <button class="qty-btn plus" onclick="cambiarCantidadCarrito('${item.id}', 1)">+</button>
                        </div>
                        <span class="cart-item-price">S/ ${subtotal.toFixed(2)}</span>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="eliminarDelCarrito('${item.id}')" title="Eliminar producto">&times;</button>
            </div>
        `;
    });

    if (cartTotal) cartTotal.textContent = totalPrecio.toFixed(2);
}

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

function cerrarCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (!cartDropdown) return;

    if (temporizadorCarrito) {
        clearTimeout(temporizadorCarrito);
        temporizadorCarrito = null;
    }

    cartDropdown.classList.remove('active');
}

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

        if (carrito.length === 0) {
            temporizadorCarrito = setTimeout(() => {
                cerrarCarrito();
            }, 2000);
        }
    }
}

document.addEventListener('click', (event) => {
    const cartDropdown = document.getElementById('cartDropdown');
    const cartBtn = document.getElementById('cartBtn');

    if (!cartDropdown || !cartBtn) return;

    if (cartDropdown.classList.contains('active')) {
        const esClicDentroDelCarrito = cartDropdown.contains(event.target);
        const esClicEnBotonHeader = cartBtn.contains(event.target);
        const esClicEnBotonAccion = event.target.closest('.add-to-cart-btn, .qty-btn, .btn, .cart-item-remove');

        if (!esClicDentroDelCarrito && !esClicEnBotonHeader && !esClicEnBotonAccion) {
            cerrarCarrito();
        }
    }
});

// =========================================================================
// 6. NAVEGACIÓN MÓVIL Y CARRUSEL
// =========================================================================
function inicializarMenuMovil() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        const dropdownToggle = navMenu.querySelector('.dropdown > a');
        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', (event) => {
                event.preventDefault();
            });
        }

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

    setInterval(() => showSlide(currentSlide + 1), 5000);
}