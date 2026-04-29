/**
 * ANTIGRAVITY - Form Manager Script
 * State Management and DOM Manipulation
 */

const CONFIG = {
    AUTOS: ['02', '03', '04', '05', '08', '12', '13', '31', '59'],
    MOTOS: ['M02', 'M03', 'M04', 'M05', 'M08', 'M12']
};

let state = {
    currentCategory: null,
    searchQuery: '',
    inventory: {}
};

// --- Initialization ---

function init() {
    loadInventory();
    setupEventListeners();
}

/**
 * Load inventory from LocalStorage or initialize with defaults
 */
function loadInventory() {
    const saved = localStorage.getItem('antigravity_inventory');
    if (saved) {
        state.inventory = JSON.parse(saved);
    } else {
        // Initial setup
        state.inventory = {
            autos: {},
            motos: {}
        };
        
        CONFIG.AUTOS.forEach(id => {
            state.inventory.autos[id] = { id, name: `Formulario ${id}`, stock: 10, sales: [] };
        });
        
        CONFIG.MOTOS.forEach(id => {
            state.inventory.motos[id] = { id, name: `Formulario ${id}`, stock: 10, sales: [] };
        });
        
        saveInventory();
    }
}

function saveInventory() {
    localStorage.setItem('antigravity_inventory', JSON.stringify(state.inventory));
}

// --- UI Logic ---

function setupEventListeners() {
    // Category selection
    document.getElementById('card-autos').addEventListener('click', () => showCategory('autos'));
    document.getElementById('card-motos').addEventListener('click', () => showCategory('motos'));

    // Navigation
    document.getElementById('btn-back').addEventListener('click', showMenu);
    document.getElementById('btn-back-from-sales').addEventListener('click', showMenu);
    document.getElementById('btn-show-history').addEventListener('click', showSalesHistory);

    // Search
    document.getElementById('search-input').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderForms();
    });

    // Form Submissions
    document.getElementById('sale-form').addEventListener('submit', submitSale);
    document.getElementById('stock-form').addEventListener('submit', submitStockUpdate);

    // Close modal on click outside
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') closeModal();
    });
}

function showCategory(category) {
    state.currentCategory = category;
    state.searchQuery = '';
    document.getElementById('search-input').value = '';
    
    document.getElementById('category-title').textContent = category.toUpperCase();
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('dashboard-view').classList.add('active');
    
    renderForms();
}

function showMenu() {
    state.currentCategory = null;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('menu-view').classList.add('active');
}

/**
 * Render form cards based on current state
 */
function renderForms() {
    const container = document.getElementById('forms-list');
    container.innerHTML = '';
    
    const items = state.inventory[state.currentCategory];
    const filteredIds = Object.keys(items).filter(id => {
        const item = items[id];
        return item.id.toLowerCase().includes(state.searchQuery) || 
               item.name.toLowerCase().includes(state.searchQuery);
    });

    if (filteredIds.length === 0) {
        container.innerHTML = `<p class="no-results">No se encontraron formularios para "${state.searchQuery}"</p>`;
        return;
    }

    filteredIds.forEach(id => {
        const item = items[id];
        const card = createFormCard(item);
        container.appendChild(card);
    });

    // Re-initialize icons for newly added elements
    if (window.lucide) {
        lucide.createIcons();
    }
}

function createFormCard(item) {
    const div = document.createElement('div');
    div.className = 'form-card';
    
    const isLowStock = item.stock <= 2;
    const stockClass = isLowStock ? 'low' : 'ok';
    
    div.innerHTML = `
        <div class="form-info">
            <span class="form-id">${item.id}</span>
            <h3>${item.name}</h3>
        </div>
        <div class="stock-status">
            <span class="stock-label">Stock disponible:</span>
            <span class="stock-value ${stockClass}">${item.stock}</span>
        </div>
        <div class="card-actions">
            <button class="btn-sale" ${item.stock <= 0 ? 'disabled' : ''} onclick="handleSale('${item.id}')">
                VENDER
            </button>
            <button class="btn-edit-stock" onclick="handleEditStock('${item.id}')" title="Ajustar Stock">
                <i data-lucide="edit-3" style="width: 18px; height: 18px;"></i>
            </button>
        </div>
    `;
    
    return div;
}

// --- Modal Logic ---

function openModal(modalId) {
    document.getElementById('modal-overlay').classList.add('active');
    document.querySelectorAll('.modal-content').forEach(m => m.classList.remove('active'));
    document.getElementById(modalId).classList.add('active');
}

window.closeModal = function() {
    document.getElementById('modal-overlay').classList.remove('active');
};

// --- Sale Logic ---

window.handleSale = function(id) {
    const item = state.inventory[state.currentCategory][id];
    document.getElementById('sale-form-id').value = id;
    document.getElementById('modal-title').textContent = `Vender ${item.id}`;
    
    // Clear inputs
    document.getElementById('buyer-name').value = '';
    document.getElementById('buyer-phone').value = '';
    
    openModal('sale-modal');
};

function submitSale(e) {
    e.preventDefault();
    const id = document.getElementById('sale-form-id').value;
    const name = document.getElementById('buyer-name').value;
    const phone = document.getElementById('buyer-phone').value;
    
    const item = state.inventory[state.currentCategory][id];
    
    if (item.stock > 0) {
        item.stock--;
        if (!item.sales) item.sales = [];
        item.sales.push({
            name,
            phone,
            date: new Date().toISOString()
        });
        
        saveInventory();
        renderForms();
        closeModal();
    }
}

// --- Stock Logic ---

window.handleEditStock = function(id) {
    const item = state.inventory[state.currentCategory][id];
    document.getElementById('stock-form-id').value = id;
    document.getElementById('new-stock').value = item.stock;
    document.getElementById('stock-modal-subtitle').textContent = `Ajustando stock para: ${item.name}`;
    
    openModal('stock-modal');
};

function submitStockUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('stock-form-id').value;
    const newStock = parseInt(document.getElementById('new-stock').value);
    
    if (!isNaN(newStock)) {
        state.inventory[state.currentCategory][id].stock = newStock;
        saveInventory();
        renderForms();
        closeModal();
    }
}

// --- Sales History Logic ---

window.showSalesHistory = function() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('sales-view').classList.add('active');
    renderSales();
};

function renderSales() {
    const list = document.getElementById('sales-list');
    const emptyMsg = document.getElementById('sales-empty');
    const table = document.querySelector('.sales-table');
    list.innerHTML = '';
    
    // Aggregate all sales
    const allSales = [];
    ['autos', 'motos'].forEach(cat => {
        if (state.inventory[cat]) {
            Object.values(state.inventory[cat]).forEach(form => {
                if (form.sales && form.sales.length > 0) {
                    form.sales.forEach(sale => {
                        allSales.push({
                            ...sale,
                            formId: form.id,
                            category: cat
                        });
                    });
                }
            });
        }
    });

    // Sort by date (newest first)
    allSales.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (allSales.length === 0) {
        if (table) table.style.display = 'none';
        if (emptyMsg) emptyMsg.style.display = 'block';
        return;
    }

    if (table) table.style.display = 'table';
    if (emptyMsg) emptyMsg.style.display = 'none';

    allSales.forEach(sale => {
        const row = document.createElement('tr');
        const date = new Date(sale.date).toLocaleString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        row.innerHTML = `
            <td class="sale-date">${date}</td>
            <td class="sale-form-id">${sale.formId}</td>
            <td>${sale.name}</td>
            <td>${sale.phone}</td>
        `;
        list.appendChild(row);
    });
}

// Start the app
init();
