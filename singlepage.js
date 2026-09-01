// =========================================================================
// 1. ESTADO GLOBAL DE LA APLICACIÓN
// =========================================================================
let carrito = [];
let temporizadorCarrito = null; 
let listaProductosGlobal = [];
let categoriaFiltroActual = 'TODOS';

// Guarda las variaciones seleccionadas activas { prodId: { talla: 'M', medida: '13 OZ', color: 'Azul' } }
let variacionesSeleccionadas = {};

// =========================================================================
// 2. INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarMenuMovil();
    inicializarCarrusel();
    obtenerProductos();
});

// =========================================================================
// 3. CONSULTA A SUPABASE Y PROCESAMIENTO CONSOLIDADO
// =========================================================================
async function obtenerProductos() {
    try {
        if (!window.supabaseClient) return;

        console.log("Iniciando consulta a Supabase...");

        const { data, error } = await window.supabaseClient
            .from('productos')
            .select('*, producto_variantes!producto_id(*)')
            .eq('activo', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error devuelto por Supabase:', error.message);
            return;
        }

        if (!data || data.length === 0) {
            console.warn('La consulta tuvo éxito pero la base de datos no devolvió registros.');
            return;
        }

        console.log("Productos obtenidos con éxito:", data);

        listaProductosGlobal = data.map(item => {
            const variantes = item.producto_variantes || [];

            const tallas = [...new Set(variantes.map(v => v.talla).filter(Boolean))];
            const colores = variantes
                .filter(v => v.color_nombre)
                .map(v => ({ nombre: v.color_nombre, hex: v.color_hex || '#000000' }))
                .filter((col, index, self) => index === self.findIndex(t => t.nombre === col.nombre));

            const medidas = [...new Set(variantes.map(v => v.medida || v.capacidad).filter(Boolean))];

            const precios = variantes.map(v => parseFloat(v.precio || item.precio_base));
            const precioMin = precios.length > 0 ? Math.min(...precios) : parseFloat(item.precio_base);
            const precioMax = precios.length > 0 ? Math.max(...precios) : parseFloat(item.precio_base);

            return {
                id: String(item.id),
                nombre: item.nombre,
                precioMin: precioMin,
                precioMax: precioMax,
                imagen: item.imagen_url || 'assets/img_productos_opt/polo_mc.webp',
                categoria: item.categoria ? item.categoria.toUpperCase().trim() : 'POLO',
                tallas: tallas,
                colores: colores,
                medidas: medidas,
                badge: item.sub_categoria || ''
            };
        });

        renderizarCatalogo();

    } catch (err) {
        console.error('Error de ejecución:', err);
    }
}

// =========================================================================
// 4. RENDERIZADO Y FILTRADO DEL CATÁLOGO (UI/UX)
// =========================================================================
function filtrarCategoria(categoria, btnElement) {
    categoriaFiltroActual = categoria.toUpperCase().trim();

    if (btnElement) {
        document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
        // Si viene del menú o footer, sincronizar botón activo de los pills
        document.querySelectorAll('.filter-pill').forEach(pill => {
            const onclickAttr = pill.getAttribute('onclick') || '';
            if (onclickAttr.includes(`'${categoriaFiltroActual}'`)) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
    }

    renderizarCatalogo();
}

function renderizarCatalogo() {
    const grid = document.getElementById('gridProductos');
    if (!grid) return;

    grid.innerHTML = '';

    const productosFiltrados = listaProductosGlobal.filter(p => {
        if (categoriaFiltroActual === 'TODOS') return true;
        // Permite equivalencia entre TEXTIL y POLO
        if (categoriaFiltroActual === 'TEXTIL' || categoriaFiltroActual === 'POLO') {
            return p.categoria === 'POLO' || p.categoria === 'TEXTIL';
        }
        return p.categoria === categoriaFiltroActual;
    });

    if (productosFiltrados.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem 0;">No hay productos disponibles en esta categoría.</p>';
        return;
    }

    productosFiltrados.forEach(prod => {
        if (!variacionesSeleccionadas[prod.id]) {
            variacionesSeleccionadas[prod.id] = {
                talla: prod.tallas.length > 0 ? prod.tallas[0] : null,
                medida: prod.medidas.length > 0 ? prod.medidas[0] : null,
                color: prod.colores.length > 0 ? prod.colores[0].nombre : null
            };
        }

        const sel = variacionesSeleccionadas[prod.id];

        const precioTexto = prod.precioMin === prod.precioMax 
            ? `S/ ${prod.precioMin.toFixed(2)}` 
            : `S/ ${prod.precioMin.toFixed(2)} - S/ ${prod.precioMax.toFixed(2)}`;

        // Selector de Talla
        let htmlTallas = '';
        if (prod.tallas.length > 0) {
            htmlTallas = `
                <div class="variant-block">
                    <div class="variant-label">Talla:</div>
                    <div class="size-selector">
                        ${prod.tallas.map(t => `
                            <button class="size-pill ${sel.talla === t ? 'active' : ''}" 
                                onclick="seleccionarVariacion('${prod.id}', 'talla', '${t}')">${t}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Selector de Medida / Capacidad
        let htmlMedidas = '';
        if (prod.medidas.length > 0) {
            const etiquetaMedida = prod.categoria === 'TAZA' ? 'Capacidad' : 'Medida';
            htmlMedidas = `
                <div class="variant-block">
                    <div class="variant-label">${etiquetaMedida}:</div>
                    <div class="size-selector">
                        ${prod.medidas.map(m => `
                            <button class="size-pill ${sel.medida === m ? 'active' : ''}" 
                                style="padding: 0 0.5rem;"
                                onclick="seleccionarVariacion('${prod.id}', 'medida', '${m}')">${m}</button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Selector de Color
        let htmlColores = '';
        if (prod.colores.length > 0) {
            htmlColores = `
                <div class="variant-block">
                    <div class="variant-label">Color:</div>
                    <div class="color-selector">
                        ${prod.colores.map(c => `
                            <button class="color-swatch ${sel.color === c.nombre ? 'active' : ''}" 
                                style="background-color: ${c.hex};" 
                                title="${c.nombre}"
                                onclick="seleccionarVariacion('${prod.id}', 'color', '${c.nombre}')"></button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const cardHTML = `
            <div class="product-card">
                ${prod.badge ? `<span class="product-badge">${prod.badge}</span>` : ''}
                <div class="product-img-wrapper">
                    <img src="${prod.imagen}" alt="${prod.nombre}" loading="lazy">
                </div>
                <div class="product-info">
                    <div>
                        <h3 class="product-title">${prod.nombre}</h3>
                        <div class="product-unit-text">Precio unit: ${precioTexto}</div>
                        <div class="product-price-range">${precioTexto}</div>
                        ${htmlTallas}
                        ${htmlMedidas}
                        ${htmlColores}
                    </div>
                    <button class="btn btn-primary btn-block add-to-cart-btn" onclick="agregarAlCarrito('${prod.id}')">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `;

        grid.innerHTML += cardHTML;
    });
}

function seleccionarVariacion(idProducto, tipo, valor) {
    if (!variacionesSeleccionadas[idProducto]) {
        variacionesSeleccionadas[idProducto] = {};
    }
    variacionesSeleccionadas[idProducto][tipo] = valor;
    renderizarCatalogo();
}

// =========================================================================
// 5. LÓGICA DEL CARRITO DE COMPRAS (SLIDE-OVER)
// =========================================================================
function agregarAlCarrito(idProducto) {
    const idStr = String(idProducto);
    const producto = listaProductosGlobal.find(p => String(p.id) === idStr);

    if (!producto) return;

    const seleccion = variacionesSeleccionadas[idStr] || {};
    const tallaElegida = seleccion.talla || '';
    const medidaElegida = seleccion.medida || '';
    const colorElegido = seleccion.color || '';

    const itemKey = `${idStr}_${tallaElegida}_${medidaElegida}_${colorElegido}`;
    const itemExistente = carrito.find(item => item.key === itemKey);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            key: itemKey,
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precioMin,
            imagen: producto.imagen,
            talla: tallaElegida,
            medida: medidaElegida,
            color: colorElegido,
            cantidad: 1
        });
    }

    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito();
}

function cambiarCantidadCarrito(itemKey, cambio) {
    const item = carrito.find(p => p.key === itemKey);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        eliminarDelCarrito(itemKey);
        return;
    }

    actualizarCarritoUI();
    mostrarYProgramarCierreCarrito();
}

function eliminarDelCarrito(itemKey) {
    carrito = carrito.filter(item => item.key !== itemKey);
    actualizarCarritoUI();

    if (carrito.length === 0) {
        cerrarCarrito();
    } else {
        const cartDropdown = document.getElementById('cartDropdown');
        if (cartDropdown) cartDropdown.classList.add('active');
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

        let metaDetalles = [];
        if (item.talla) metaDetalles.push(`Talla: ${item.talla}`);
        if (item.medida) metaDetalles.push(`Medida: ${item.medida}`);
        if (item.color) metaDetalles.push(`Color: ${item.color}`);
        const metaTexto = metaDetalles.length > 0 ? metaDetalles.join(' | ') : 'Estándar';

        cartItemsContainer.innerHTML += `
            <div class="cart-item">
                <img src="${item.imagen}" alt="${item.nombre}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.nombre}</h4>
                    <div class="cart-item-meta">${metaTexto}</div>
                    <div class="cart-item-bottom">
                        <div class="cart-stepper">
                            <button onclick="cambiarCantidadCarrito('${item.key}', -1)">-</button>
                            <span>${item.cantidad}</span>
                            <button onclick="cambiarCantidadCarrito('${item.key}', 1)">+</button>
                        </div>
                        <span class="cart-item-price">S/ ${subtotal.toFixed(2)}</span>
                    </div>
                </div>
                <button class="cart-item-remove-subtle" onclick="eliminarDelCarrito('${item.key}')" title="Eliminar producto">
                    <i class="ph ph-x"></i>
                </button>
            </div>
        `;
    });

    if (cartTotal) cartTotal.textContent = totalPrecio.toFixed(2);
}

// =========================================================================
// 6. FLUJO Y PEDIDO POR WHATSAPP
// =========================================================================
function enviarPedidoWhatsApp() {
    if (carrito.length === 0) {
        alert('Tu carrito está vacío. Agrega productos antes de enviar el pedido.');
        return;
    }

    let mensaje = "¡Hola RCSmersh! Deseo realizar el siguiente pedido:\n\n";

    carrito.forEach(item => {
        let variaciones = [];
        if (item.talla) variaciones.push(`Talla: ${item.talla}`);
        if (item.medida) variaciones.push(`Medida: ${item.medida}`);
        if (item.color) variaciones.push(`Color: ${item.color}`);
        const varStr = variaciones.length > 0 ? ` (${variaciones.join(', ')})` : '';

        mensaje += `• ${item.cantidad}x ${item.nombre}${varStr} - S/ ${(item.precio * item.cantidad).toFixed(2)}\n`;
    });

    const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    mensaje += `\n*Total a Pagar:* S/ ${total.toFixed(2)}\n\n¿Me indican los pasos para realizar el pago?`;

    const numeroWhatsApp = "51959562867";
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
}

function mostrarYProgramarCierreCarrito() {
    const cartDropdown = document.getElementById('cartDropdown');
    if (!cartDropdown) return;

    cartDropdown.classList.add('active');

    if (temporizadorCarrito) clearTimeout(temporizadorCarrito);

    temporizadorCarrito = setTimeout(() => {
        cartDropdown.classList.remove('active');
        temporizadorCarrito = null;
    }, 2500);
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
            }, 2500);
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
        const esClicEnBotonAccion = event.target.closest('.add-to-cart-btn, .cart-stepper, .btn, .cart-item-remove-subtle');

        if (!esClicDentroDelCarrito && !esClicEnBotonHeader && !esClicEnBotonAccion) {
            cerrarCarrito();
        }
    }
});

// =========================================================================
// 7. NAVEGACIÓN MÓVIL Y CARRUSEL HERO
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