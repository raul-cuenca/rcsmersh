// =========================================================================
// 1. ESTADO GLOBAL
// =========================================================================
let carrito = [];
let temporizadorCarrito = null; 
let listaProductosGlobal = [];
let categoriaFiltroActual = 'TODOS';
let variacionesSeleccionadas = {};

// Orden estándar para ordenar visualmente las tallas en los modales
const ORDEN_TALLAS_ESTANDAR = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];

// =========================================================================
// 2. INICIALIZACIÓN
// =========================================================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarMenuMovil();
    inicializarCarrusel();
    obtenerProductos();
});

function getSupabaseClient() {
    if (typeof window.supabaseClient !== 'undefined' && window.supabaseClient) {
        return window.supabaseClient;
    }
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        return supabaseClient;
    }
    return null;
}

// =========================================================================
// 3. CONSULTA Y PROCESAMIENTO DE PRODUCTOS Y VARIANTES
// =========================================================================
async function obtenerProductos() {
    const client = getSupabaseClient();
    const grid = document.getElementById('gridProductos');

    if (!client) {
        console.error('No se encontró la instancia del cliente de Supabase.');
        if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 2rem 0;">Error de conexión con la base de datos.</p>';
        return;
    }

    try {
        const { data, error } = await client
            .from('productos')
            .select('*, producto_variantes(*)')
            .eq('activo', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error devuelto por Supabase:', error.message);
            if (grid) grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 2rem 0;">Error al cargar productos: ${error.message}</p>`;
            return;
        }

        if (!data || data.length === 0) {
            if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem 0;">No hay productos disponibles por el momento.</p>';
            return;
        }

        listaProductosGlobal = data.map(item => {
            const variantes = item.producto_variantes || [];
            
            // Extracto y ordenamiento de TODAS las tallas sin omitir ninguna
            const tallas = [...new Set(
                variantes
                    .map(v => v.talla ? v.talla.toString().trim().toUpperCase() : null)
                    .filter(Boolean)
            )].sort((a, b) => {
                const idxA = ORDEN_TALLAS_ESTANDAR.indexOf(a);
                const idxB = ORDEN_TALLAS_ESTANDAR.indexOf(b);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return a.localeCompare(b);
            });

            // Agrupación y extracción de TODOS los colores sin duplicar
            const coloresMap = new Map();
            variantes.forEach(v => {
                if (!v.color_nombre) return;
                const nombreLimpio = v.color_nombre.trim();
                const key = nombreLimpio.toLowerCase();
                
                if (!coloresMap.has(key)) {
                    coloresMap.set(key, {
                        nombre: nombreLimpio,
                        hex: v.color_hex || '#000000',
                        imagen: v.imagen_url || null
                    });
                } else {
                    const colExistente = coloresMap.get(key);
                    if (!colExistente.imagen && v.imagen_url) {
                        colExistente.imagen = v.imagen_url;
                    }
                }
            });
            const colores = Array.from(coloresMap.values());

            const ordenPreferido = ['blanco', 'negro', 'celeste', 'verde', 'anaranjado', 'rojo', 'azul'];
            colores.sort((a, b) => {
                const indexA = ordenPreferido.indexOf(a.nombre.toLowerCase());
                const indexB = ordenPreferido.indexOf(b.nombre.toLowerCase());
                
                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                if (indexA !== -1) return -1;
                if (indexB !== -1) return 1;
                return a.nombre.localeCompare(b.nombre);
            });

            const medidas = [...new Set(variantes.map(v => v.medida || v.capacidad).filter(Boolean))];
            const precios = variantes.map(v => parseFloat(v.precio || item.precio_base));
            const precioMin = precios.length > 0 ? Math.min(...precios) : parseFloat(item.precio_base || 0);
            const precioMax = precios.length > 0 ? Math.max(...precios) : parseFloat(item.precio_base || 0);

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
        if (grid) grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ef4444; padding: 2rem 0;">Ocurrió un error inesperado al procesar los productos.</p>';
    }
}

// =========================================================================
// 4. RENDERIZADO Y FILTRADO DEL CATÁLOGO
// =========================================================================
function filtrarCategoria(categoria, btnElement) {
    categoriaFiltroActual = categoria.toUpperCase().trim();

    if (btnElement) {
        document.querySelectorAll('.filter-pill').forEach(pill => pill.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
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
        const catProd = p.categoria;
        const catFiltro = categoriaFiltroActual;

        if (catFiltro === 'POLO' || catFiltro === 'TEXTIL') {
            return catProd.includes('POLO') || catProd.includes('TEXTIL');
        }
        return catProd.includes(catFiltro) || catFiltro.includes(catProd);
    });

    if (productosFiltrados.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #64748b; padding: 2rem 0;">No hay productos disponibles.</p>';
        return;
    }

    let htmlGrid = '';

    productosFiltrados.forEach(prod => {
        const tieneVariantesColor = prod.colores && prod.colores.length > 0;

        if (!variacionesSeleccionadas[prod.id]) {
            variacionesSeleccionadas[prod.id] = {
                talla: prod.tallas[0] || null,
                medida: prod.medidas[0] || null,
                color: tieneVariantesColor ? (prod.colores[0]?.nombre || null) : null
            };
        }

        const sel = variacionesSeleccionadas[prod.id];
        const colorObjeto = prod.colores.find(c => c.nombre.toLowerCase() === (sel.color || '').toLowerCase());
        const imagenAMostrar = (colorObjeto && colorObjeto.imagen) ? colorObjeto.imagen : prod.imagen;

        const precioTexto = prod.precioMin === prod.precioMax 
            ? `S/ ${prod.precioMin.toFixed(2)}` 
            : `S/ ${prod.precioMin.toFixed(2)}`;

        let html3Colores = '';
        if (tieneVariantesColor) {
            const primeros3Colores = prod.colores.slice(0, 3);
            html3Colores = `
                <div class="mini-color-container">
                    ${primeros3Colores.map(c => `
                        <span class="mini-color-swatch" 
                            style="background-color: ${c.hex};" 
                            title="${c.nombre}"></span>
                    `).join('')}
                    ${prod.colores.length > 3 ? `<span style="font-size: 0.75rem; color: #64748b; font-weight: 600;">+${prod.colores.length - 3}</span>` : ''}
                </div>
            `;
        } else {
            html3Colores = `<div class="mini-color-container"></div>`;
        }

        htmlGrid += `
            <div class="product-card" data-id="${prod.id}" onclick="abrirModalProducto('${prod.id}')">
                <div class="product-img-wrapper">
                    <img src="${imagenAMostrar}" alt="${prod.nombre}" loading="lazy">
                </div>
                <div class="product-info-compact">
                    <div>
                        <h3 class="product-title">${prod.nombre}</h3>
                        <div class="product-price-bold">${precioTexto}</div>
                    </div>
                    ${html3Colores}
                </div>
            </div>
        `;
    });

    grid.innerHTML = htmlGrid;
}

function seleccionarVariacion(idProducto, tipo, valor) {
    const idStr = String(idProducto);
    if (!variacionesSeleccionadas[idStr]) {
        variacionesSeleccionadas[idStr] = {};
    }
    variacionesSeleccionadas[idStr][tipo] = valor;
}

// =========================================================================
// 5. MODAL DE PRODUCTO (MUESTRA TODAS LAS TALLAS Y COLORES)
// =========================================================================
function abrirModalProducto(idProducto) {
    const idStr = String(idProducto);
    const prod = listaProductosGlobal.find(p => String(p.id) === idStr);
    if (!prod) return;

    let modalOverlay = document.getElementById('productModalOverlay');
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'productModalOverlay';
        modalOverlay.className = 'product-modal-overlay';
        document.body.appendChild(modalOverlay);
    }

    // Si es un polo y no tiene tallas desde la BD, se asignan S, M, L, XL por defecto
    const esPolo = prod.categoria ? prod.categoria.includes('POLO') : true;
    const listaTallas = (prod.tallas && prod.tallas.length > 0) ? prod.tallas : (esPolo ? ['S', 'M', 'L', 'XL'] : []);

    // Inicializar selección predeterminada
    if (!variacionesSeleccionadas[idStr]) {
        variacionesSeleccionadas[idStr] = {};
    }
    if (!variacionesSeleccionadas[idStr].talla && listaTallas.length > 0) {
        variacionesSeleccionadas[idStr].talla = listaTallas[0];
    }
    if (!variacionesSeleccionadas[idStr].color && prod.colores.length > 0) {
        variacionesSeleccionadas[idStr].color = prod.colores[0].nombre;
    }

    const sel = variacionesSeleccionadas[idStr];
    const colorObjeto = prod.colores.find(c => c.nombre.toLowerCase() === (sel.color || '').toLowerCase());
    const imagenAMostrar = (colorObjeto && colorObjeto.imagen) ? colorObjeto.imagen : prod.imagen;
    
    const precioTexto = prod.precioMin === prod.precioMax 
        ? `S/ ${prod.precioMin.toFixed(2)}` 
        : `S/ ${prod.precioMin.toFixed(2)} - S/ ${prod.precioMax.toFixed(2)}`;

    modalOverlay.innerHTML = `
        <div class="product-modal-card">
            <button class="modal-close-btn" onclick="cerrarModalProducto()">&times;</button>
            
            <div class="modal-img-container">
                <img id="modalImg" src="${imagenAMostrar}" alt="${prod.nombre}">
            </div>

            <h2 class="modal-product-title">${prod.nombre}</h2>
            <div class="modal-main-price">${precioTexto}</div>

            <!-- 1. SECCIÓN DE TALLAS (UBICADA SOBRE LOS COLORES) -->
            ${listaTallas.length > 0 ? `
                <div class="modal-section-label">Talla:</div>
                <div class="modal-size-grid">
                    ${listaTallas.map(t => `
                        <button class="modal-size-box ${sel.talla === t ? 'active' : ''}" 
                            onclick="seleccionarVariacionModal('${prod.id}', 'talla', '${t}', this)">
                            ${t}
                        </button>
                    `).join('')}
                </div>
            ` : ''}

            <!-- 2. SECCIÓN DE COLORES -->
            ${prod.colores.length > 0 ? `
                <div class="modal-section-label">Color:</div>
                <div class="modal-color-swatch-grid">
                    ${prod.colores.map(c => `
                        <div class="modal-color-square ${sel.color === c.nombre ? 'active' : ''}" 
                            style="background-color: ${c.hex};"
                            title="${c.nombre}"
                            onclick="seleccionarVariacionModal('${prod.id}', 'color', '${c.nombre}', this)">
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <button class="modal-btn-add" onclick="agregarAlCarrito('${prod.id}'); cerrarModalProducto();">
                Agregar al Carrito
            </button>
        </div>
    `;

    setTimeout(() => modalOverlay.classList.add('active'), 10);

    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) cerrarModalProducto();
    };
}

function cerrarModalProducto() {
    const modalOverlay = document.getElementById('productModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
}

function seleccionarVariacionModal(idProducto, tipo, valor, el) {
    seleccionarVariacion(idProducto, tipo, valor);

    if (el) {
        const parent = el.parentElement;
        parent.querySelectorAll('.active').forEach(item => item.classList.remove('active'));
        el.classList.add('active');
    }

    if (tipo === 'color') {
        const prod = listaProductosGlobal.find(p => String(p.id) === String(idProducto));
        const colorObjeto = prod?.colores.find(c => c.nombre.toLowerCase() === valor.toLowerCase());
        const modalImg = document.getElementById('modalImg');
        if (modalImg && colorObjeto) {
            modalImg.src = colorObjeto.imagen || prod.imagen;
        }
    }
}

// =========================================================================
// 6. LÓGICA DEL CARRITO DE COMPRAS
// =========================================================================
function agregarAlCarrito(idProducto) {
    const idStr = String(idProducto);
    const producto = listaProductosGlobal.find(p => String(p.id) === idStr);

    if (!producto) return;

    const seleccion = variacionesSeleccionadas[idStr] || {};
    const tallaElegida = seleccion.talla || '';
    const medidaElegida = seleccion.medida || '';
    const colorElegido = seleccion.color || '';

    const colorObjeto = producto.colores.find(c => c.nombre.toLowerCase() === colorElegido.toLowerCase());
    const imagenItem = (colorObjeto && colorObjeto.imagen) ? colorObjeto.imagen : producto.imagen;

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
            imagen: imagenItem,
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
        const esClicEnBotonAccion = event.target.closest('.modal-btn-add, .cart-stepper, .btn, .cart-item-remove-subtle');

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