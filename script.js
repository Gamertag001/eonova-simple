// Configuración de la API
const API_BASE_URL = 'https://eonova-backend-12x8.vercel.app';

// Estado global de la aplicación
let products = [];
let selectedProduct = null;
let cart = [];
let colors = [];
let styles = [];
let patterns = [];

// Elementos del DOM
const productsGrid = document.getElementById('productsGrid');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
const previewPrice = document.getElementById('previewPrice');
const colorPicker = document.getElementById('colorPicker');
const secondaryColorPicker = document.getElementById('secondaryColorPicker');
const styleSelect = document.getElementById('styleSelect');
const patternSelect = document.getElementById('patternSelect');
const sizeSelect = document.getElementById('sizeSelect');
const basePrice = document.getElementById('basePrice');
const secondaryColorPrice = document.getElementById('secondaryColorPrice');
const patternPrice = document.getElementById('patternPrice');
const totalPrice = document.getElementById('totalPrice');
const addToCartBtn = document.getElementById('addToCartBtn');
const cartModal = document.getElementById('cartModal');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.querySelector('.cart-count');

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialData();
    setupEventListeners();
    updateCartDisplay();
});

// Cargar datos iniciales
async function loadInitialData() {
    try {
        // Cargar productos
        const productsResponse = await fetch(`${API_BASE_URL}/productos`);
        const productsData = await productsResponse.json();
        products = productsData.productos;
        
        // Cargar colores
        const colorsResponse = await fetch(`${API_BASE_URL}/colores-disponibles`);
        const colorsData = await colorsResponse.json();
        colors = colorsData.colores;
        
        // Cargar estilos
        const stylesResponse = await fetch(`${API_BASE_URL}/estilos-disponibles`);
        const stylesData = await stylesResponse.json();
        styles = stylesData.estilos;
        
        // Cargar estampados
        const patternsResponse = await fetch(`${API_BASE_URL}/estampados-disponibles`);
        const patternsData = await patternsResponse.json();
        patterns = patternsData.estampados;
        
        // Renderizar productos
        renderProducts();
        
        // Renderizar opciones de personalización
        renderColorPicker();
        renderSecondaryColorPicker();
        renderStyleSelect();
        renderPatternSelect();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showNotification('Error cargando datos. Intenta de nuevo.', 'error');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Carrito
    document.querySelector('.nav-cart').addEventListener('click', openCart);
    
    // Botón agregar al carrito
    addToCartBtn.addEventListener('click', addToCart);
    
    // Cerrar modal
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            closeCart();
        }
    });
}

// Renderizar productos
function renderProducts() {
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card" onclick="selectProduct('${product.id}')">
            <div class="product-image">
                <i class="fas fa-${getProductIcon(product.categoria)}"></i>
            </div>
            <h3 class="product-title">${product.nombre}</h3>
            <p class="product-description">${product.descripcion}</p>
            <div class="product-price">$${product.precio_base.toFixed(2)}</div>
            <div class="product-colors">
                ${product.colores_base.slice(0, 5).map(color => 
                    `<div class="color-dot" style="background-color: ${getColorValue(color)}"></div>`
                ).join('')}
                ${product.colores_base.length > 5 ? `<span>+${product.colores_base.length - 5} más</span>` : ''}
            </div>
        </div>
    `).join('');
}

// Renderizar selector de colores
function renderColorPicker() {
    colorPicker.innerHTML = colors.map(color => `
        <div class="color-option" 
             style="background-color: ${getColorValue(color)}"
             onclick="selectColor('${color}', 'primary')"
             title="${color}">
        </div>
    `).join('');
}

// Renderizar selector de colores secundarios
function renderSecondaryColorPicker() {
    secondaryColorPicker.innerHTML = `
        <div class="color-option" 
             onclick="selectColor('', 'secondary')"
             title="Sin color secundario">
            <span style="color: #999; font-size: 12px;">N/A</span>
        </div>
    ` + colors.map(color => `
        <div class="color-option" 
             style="background-color: ${getColorValue(color)}"
             onclick="selectColor('${color}', 'secondary')"
             title="${color}">
        </div>
    `).join('');
}

// Renderizar selector de estilos
function renderStyleSelect() {
    styleSelect.innerHTML = `
        <option value="">Selecciona un estilo</option>
        ${styles.map(style => `
            <option value="${style}">${style.charAt(0).toUpperCase() + style.slice(1)}</option>
        `).join('')}
    `;
}

// Renderizar selector de estampados
function renderPatternSelect() {
    patternSelect.innerHTML = `
        <option value="">Selecciona un estampado</option>
        ${patterns.map(pattern => `
            <option value="${pattern}">${pattern.charAt(0).toUpperCase() + pattern.slice(1)}</option>
        `).join('')}
    `;
}

// Seleccionar producto
function selectProduct(productId) {
    selectedProduct = products.find(p => p.id === productId);
    
    // Actualizar preview
    previewTitle.textContent = selectedProduct.nombre;
    previewPrice.textContent = `$${selectedProduct.precio_base.toFixed(2)}`;
    basePrice.textContent = `$${selectedProduct.precio_base.toFixed(2)}`;
    
    // Actualizar icono
    previewImage.innerHTML = `<i class="fas fa-${getProductIcon(selectedProduct.categoria)}"></i>`;
    
    // Actualizar talles
    sizeSelect.innerHTML = `
        <option value="">Selecciona un talle</option>
        ${selectedProduct.talles_disponibles.map(size => `
            <option value="${size}">${size}</option>
        `).join('')}
    `;
    
    // Resetear selecciones
    resetCustomization();
    
    // Scroll a personalización
    scrollToSection('personalizar');
    
    // Habilitar botón
    updateAddToCartButton();
}

// Seleccionar color
function selectColor(color, type) {
    const picker = type === 'primary' ? colorPicker : secondaryColorPicker;
    
    // Remover selección anterior
    picker.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Seleccionar nuevo color
    event.target.closest('.color-option').classList.add('selected');
    
    // Actualizar preview
    updatePreview();
    
    // Calcular precio
    calculatePrice();
}

// Resetear personalización
function resetCustomization() {
    // Resetear colores
    colorPicker.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    secondaryColorPicker.querySelectorAll('.color-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Resetear selects
    styleSelect.value = '';
    patternSelect.value = '';
    sizeSelect.value = '';
    
    // Resetear precios
    secondaryColorPrice.textContent = '$0.00';
    patternPrice.textContent = '$0.00';
    totalPrice.textContent = '$0.00';
}

// Actualizar preview
function updatePreview() {
    if (!selectedProduct) return;
    
    // Aquí podrías actualizar la imagen del preview con los colores seleccionados
    // Por ahora solo actualizamos el precio
    calculatePrice();
}

// Calcular precio
async function calculatePrice() {
    if (!selectedProduct) return;
    
    try {
        const primaryColor = colorPicker.querySelector('.color-option.selected')?.title || '';
        const secondaryColor = secondaryColorPicker.querySelector('.color-option.selected')?.title || '';
        const style = styleSelect.value || 'clásico';
        const pattern = patternSelect.value || '';
        
        const response = await fetch(`${API_BASE_URL}/calcular-precio`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                producto_id: selectedProduct.id,
                color_principal: primaryColor,
                color_secundario: secondaryColor || null,
                estilo: style,
                estampado: pattern || null
            })
        });
        
        const priceData = await response.json();
        
        // Actualizar precios
        secondaryColorPrice.textContent = `$${priceData.desglose.color_secundario.toFixed(2)}`;
        patternPrice.textContent = `$${priceData.desglose.estampado.toFixed(2)}`;
        totalPrice.textContent = `$${priceData.precio_final.toFixed(2)}`;
        
        // Actualizar preview
        previewPrice.textContent = `$${priceData.precio_final.toFixed(2)}`;
        
    } catch (error) {
        console.error('Error calculando precio:', error);
    }
}

// Actualizar botón agregar al carrito
function updateAddToCartButton() {
    const hasProduct = selectedProduct !== null;
    const hasPrimaryColor = colorPicker.querySelector('.color-option.selected') !== null;
    const hasSize = sizeSelect.value !== '';
    
    addToCartBtn.disabled = !(hasProduct && hasPrimaryColor && hasSize);
}

// Agregar al carrito
function addToCart() {
    if (!selectedProduct) return;
    
    const primaryColor = colorPicker.querySelector('.color-option.selected')?.title || '';
    const secondaryColor = secondaryColorPicker.querySelector('.color-option.selected')?.title || '';
    const style = styleSelect.value || 'clásico';
    const pattern = patternSelect.value || '';
    const size = sizeSelect.value;
    const price = parseFloat(totalPrice.textContent.replace('$', ''));
    
    const cartItem = {
        id: Date.now(),
        product: selectedProduct,
        customization: {
            color_principal: primaryColor,
            color_secundario: secondaryColor,
            estilo: style,
            estampado: pattern,
            talle: size
        },
        price: price
    };
    
    cart.push(cartItem);
    updateCartDisplay();
    
    showNotification('Producto agregado al carrito!', 'success');
    
    // Resetear selección
    resetCustomization();
    updateAddToCartButton();
}

// Actualizar display del carrito
function updateCartDisplay() {
    cartCount.textContent = cart.length;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>
                <h4>${item.product.nombre}</h4>
                <p>Color: ${item.customization.color_principal}</p>
                <p>Talle: ${item.customization.talle}</p>
            </div>
            <div>
                <p>$${item.price.toFixed(2)}</p>
                <button onclick="removeFromCart(${item.id})" style="background: none; border: none; color: red; cursor: pointer;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + item.price, 0);
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Remover del carrito
function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
    showNotification('Producto removido del carrito', 'info');
}

// Abrir carrito
function openCart() {
    cartModal.style.display = 'block';
}

// Cerrar carrito
function closeCart() {
    cartModal.style.display = 'none';
}

// Finalizar compra
function checkout() {
    if (cart.length === 0) {
        showNotification('Tu carrito está vacío', 'warning');
        return;
    }
    
    // Aquí implementarías la lógica de checkout
    showNotification('¡Gracias por tu compra! Pronto recibirás un email con los detalles.', 'success');
    cart = [];
    updateCartDisplay();
    closeCart();
}

// Utilidades
function getProductIcon(category) {
    const icons = {
        'camisetas': 'tshirt',
        'hoodies': 'tshirt',
        'pantalones': 'tshirt'
    };
    return icons[category] || 'tshirt';
}

function getColorValue(colorName) {
    const colorMap = {
        'blanco': '#FFFFFF',
        'negro': '#000000',
        'gris': '#808080',
        'azul': '#0000FF',
        'rojo': '#FF0000',
        'verde': '#008000',
        'amarillo': '#FFFF00',
        'naranja': '#FFA500',
        'rosa': '#FFC0CB',
        'morado': '#800080',
        'marrón': '#A52A2A',
        'beige': '#F5F5DC',
        'azul marino': '#000080'
    };
    return colorMap[colorName.toLowerCase()] || '#CCCCCC';
}

function scrollToSection(sectionId) {
    document.getElementById(sectionId).scrollIntoView({
        behavior: 'smooth'
    });
}

function showNotification(message, type = 'info') {
    // Crear notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
    `;
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Event listeners para selects
styleSelect.addEventListener('change', () => {
    calculatePrice();
    updateAddToCartButton();
});

patternSelect.addEventListener('change', () => {
    calculatePrice();
    updateAddToCartButton();
});

sizeSelect.addEventListener('change', () => {
    updateAddToCartButton();
});

// CSS para animaciones de notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style); 