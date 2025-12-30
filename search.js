// Chức năng tìm kiếm sản phẩm dùng chung cho tất cả các trang

let allProductsCache = [];

// Hàm chuẩn hóa chuỗi để tìm kiếm tiếng Việt
function normalizeString(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd');
}

async function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchIcon = document.getElementById('search-icon');
    
    if (!searchInput) return;
    
    // Tìm kiếm khi nhấn Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });
    
    // Tìm kiếm thời gian thực (debounce)
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const value = this.value.trim();
        
        if (value === '') {
            // Nếu xóa hết, load lại sản phẩm gốc
            if (typeof loadProducts === 'function') {
                loadProducts();
            }
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(value);
        }, 500);
    });
    
    // Tìm kiếm khi click icon
    if (searchIcon) {
        searchIcon.addEventListener('click', function() {
            performSearch(searchInput.value);
        });
    }
}

async function performSearch(keyword) {
    if (!keyword || keyword.trim() === '') {
        if (typeof loadProducts === 'function') {
            loadProducts();
        }
        return;
    }
    
    const searchTerm = normalizeString(keyword);
    
    // Log để debug
    console.log('Tìm kiếm:', keyword);
    console.log('Chuẩn hóa:', searchTerm);
    console.log('window.getProducts có sẵn?', typeof window.getProducts);
    
    // Lấy tất cả sản phẩm
    let products = [];
    try {
        if (typeof window.getProducts === 'function') {
            products = await window.getProducts();
            console.log('Đã load được sản phẩm:', products.length);
        } else {
            console.error('window.getProducts không tồn tại!');
            showSearchNotification('Lỗi: Không thể tải danh sách sản phẩm', 'danger');
            return;
        }
    } catch (error) {
        console.error('Lỗi khi load sản phẩm:', error);
        showSearchNotification('Lỗi khi tải sản phẩm', 'danger');
        return;
    }
    
    console.log('Tổng số sản phẩm:', products.length);
    
    // Lấy page category từ URL hoặc body class
    const currentPage = getCurrentPageCategory();
    
    // Lọc theo category hiện tại
    if (currentPage) {
        products = products.filter(p => {
            if (currentPage === 'nam') {
                return p.category === 'nam' || p.category === "men's clothing";
            } else if (currentPage === 'nu') {
                return p.category === 'nu' || p.category === "women's clothing";
            } else if (currentPage === 'tre-em') {
                return p.category === 'tre-em';
            }
            return true; // Trang index hiển thị tất cả
        });
        console.log('Sau khi lọc category:', products.length);
    }
    
    // Lọc sản phẩm theo từ khóa với normalize
    const filteredProducts = products.filter(product => {
        const name = normalizeString(product.name || product.title || '');
        const brand = normalizeString(product.brand || '');
        const category = normalizeString(product.category || '');
        const description = normalizeString(product.description || '');
        
        const match = name.includes(searchTerm) || 
               brand.includes(searchTerm) || 
               category.includes(searchTerm) ||
               description.includes(searchTerm);
        
        if (match) {
            console.log('Tìm thấy:', product.name || product.title);
        }
        
        return match;
    });
    
    console.log('Kết quả tìm kiếm:', filteredProducts.length);
    
    // Hiển thị kết quả
    displaySearchResults(filteredProducts, keyword);
    
    // Hiển thị thông báo
    if (filteredProducts.length > 0) {
        showSearchNotification(`Tìm thấy ${filteredProducts.length} sản phẩm cho "${keyword}"`);
    } else {
        showSearchNotification(`Không tìm thấy sản phẩm nào cho "${keyword}"`, 'warning');
    }
}

function getCurrentPageCategory() {
    const path = window.location.pathname;
    if (path.includes('nam.html')) return 'nam';
    if (path.includes('nu.html')) return 'nu';
    if (path.includes('tre-em.html')) return 'tre-em';
    return null; // index.html
}

function displaySearchResults(products, keyword) {
    // Tìm container dựa vào page hiện tại
    const currentPage = getCurrentPageCategory();
    let container;
    
    if (currentPage) {
        container = document.getElementById(`products-${currentPage}`);
    }
    
    // Fallback cho các container khác
    if (!container) {
        container = document.getElementById('category-product') || 
                   document.querySelector('.products-container') ||
                   document.querySelector('.product-list');
    }
    
    if (!container) {
        console.error('Product container not found');
        return;
    }
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <i class="fas fa-search" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                <h3 style="color: #999; font-size: 20px; margin-bottom: 10px;">Không tìm thấy sản phẩm</h3>
                <p style="color: #aaa;">Vui lòng thử từ khóa khác</p>
            </div>
        `;
        return;
    }
    
    // Render sản phẩm
    const colorSamples = [
        { name: 'Đen', code: '#000' },
        { name: 'Trắng', code: '#fff' },
        { name: 'Xám', code: '#808080' }
    ];
    
    container.innerHTML = products.map(product => {
        // Tính tổng stock
        let totalStock = 0;
        if (product.sizes && Array.isArray(product.sizes)) {
            if (product.sizes.length > 0 && typeof product.sizes[0] === 'object') {
                totalStock = product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
            } else {
                totalStock = product.stock || 0;
            }
        } else {
            totalStock = product.stock || 0;
        }
        
        const isOutOfStock = totalStock <= 0;
        const stockBadge = isOutOfStock ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Hết hàng</span>' : '';
        
        // Highlight từ khóa
        let displayName = product.name || product.title;
        if (keyword) {
            const regex = new RegExp(`(${keyword})`, 'gi');
            displayName = displayName.replace(regex, '<mark>$1</mark>');
        }
        
        return `
        <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-product-id="${product.id}">
            <div class="product-image-wrapper">
                <img src="${product.image}" alt="${product.name || product.title}" style="${isOutOfStock ? 'opacity:0.6;' : ''}">
                ${stockBadge}
                <div class="add-to-cart-overlay">
                    <button class="add-to-cart-btn" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-${isOutOfStock ? 'times' : 'plus'}"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-colors">
                    ${colorSamples.map(color => `
                        <span class="color-dot" style="background: ${color.code}; ${color.code === '#fff' ? 'border-color: #ddd;' : ''}"></span>
                    `).join('')}
                </div>
                <p class="price">${product.price.toLocaleString()} ₫</p>
                <h3>${displayName}</h3>
                ${isOutOfStock ? '<p class="text-danger fw-bold">Hết hàng</p>' : totalStock > 0 ? `<p class="text-muted">Còn ${totalStock} sản phẩm</p>` : ''}
            </div>
        </div>
        `;
    }).join('');
    
    // Add event listeners
    attachProductEventListeners(products);
}

function attachProductEventListeners(products) {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const productId = card.dataset.productId;
        const product = products.find(p => p.id === productId);
        
        if (!product) return;
        
        // Click card để xem chi tiết
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.add-to-cart-btn')) {
                if (typeof showProductDetail === 'function') {
                    showProductDetail(product);
                }
            }
        });
    });
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = button.getAttribute('data-id');
            const product = products.find(p => p.id === productId);
            
            if (product && typeof handleAddToCart === 'function') {
                handleAddToCart(product);
            } else if (product && typeof addToCart === 'function') {
                addToCart(product, 1);
                alert('Đã thêm sản phẩm vào giỏ hàng!');
            }
        });
    });
}

function showSearchNotification(message, type = 'info') {
    // Xóa notification cũ nếu có
    const oldNotification = document.querySelector('.search-notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} search-notification`;
    notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease;';
    
    const icon = type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i> ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(notification);
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

// Khởi tạo khi DOM loaded và đợi getProducts sẵn sàng
function waitForGetProducts() {
    return new Promise((resolve) => {
        if (typeof window.getProducts === 'function') {
            resolve();
        } else {
            const checkInterval = setInterval(() => {
                if (typeof window.getProducts === 'function') {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100); // Check mỗi 100ms
            
            // Timeout sau 5 giây
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('Không thể load getProducts sau 5 giây');
                resolve();
            }, 5000);
        }
    });
}

async function initSearchWhenReady() {
    await waitForGetProducts();
    console.log('Search đã sẵn sàng, getProducts:', typeof window.getProducts);
    initSearch();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchWhenReady);
} else {
    initSearchWhenReady();
}
