// Hàm tiện ích cho toàn bộ website

// Quản lý người dùng
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
}

function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}

// Quản lý giỏ hàng theo user
function getCartKey() {
    const user = getCurrentUser();
    return user ? `cart_${user.id}` : 'cart_guest';
}

function getCart() {
    const cartKey = getCartKey();
    return JSON.parse(localStorage.getItem(cartKey)) || [];
}

function saveCart(cart) {
    const cartKey = getCartKey();
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

function addToCart(product, quantity = 1) {
    let cart = getCart();
    
    // Kiểm tra sản phẩm đã tồn tại (cùng ID và cùng size nếu có)
    const exist = cart.find(item => {
        const sameId = item.id == product.id;
        const sameSize = (!item.selectedSize && !product.selectedSize) || 
                        (item.selectedSize === product.selectedSize);
        return sameId && sameSize;
    });
    
    if (exist) {
        exist.quantity += quantity;
    } else {
        cart.push({ 
            ...product, 
            quantity,
            title: product.title || product.name,
            selectedSize: product.selectedSize || null
        });
    }
    
    saveCart(cart);
    updateCartCount();
    return true;
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id != productId);
    saveCart(cart);
    updateCartCount();
}

function updateCartItemQuantity(productId, quantity) {
    let cart = getCart();
    const item = cart.find(item => item.id == productId);
    if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart(cart);
        }
    }
    updateCartCount();
}

function clearCart() {
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    updateCartCount();
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function getCartCount() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Cập nhật số lượng giỏ hàng trên header
function updateCartCount() {
    const count = getCartCount();
    const badge = document.getElementById('cart-count');
    if (badge) {
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Quản lý đơn hàng
function getOrders() {
    return JSON.parse(localStorage.getItem('orders')) || [];
}

async function saveOrder(order) {
    const orders = getOrders();
    const currentUser = getCurrentUser();
    
    const newOrder = {
        ...order,
        id: Date.now(),
        userId: currentUser ? currentUser.id : null,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Giảm số lượng tồn kho cho sản phẩm
    if (order.cart && order.cart.length > 0) {
        await updateProductStock(order.cart);
    }
    
    return newOrder;
}

// Hàm cập nhật tồn kho sản phẩm sau khi đặt hàng
async function updateProductStock(cartItems) {
    try {
        // Import Firebase functions (sử dụng dynamic import để tránh conflict)
        const firestoreModule = await import('https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js');
        const { getFirestore, doc, getDoc, updateDoc } = firestoreModule;
        
        // Sử dụng Firestore instance đã có sẵn từ productServices hoặc admin
        // Để tránh khởi tạo lại Firebase app
        const firebaseConfig = {
            apiKey: "AIzaSyCEEErX_ybhvvi2W_unmIMnZTO4vEGdYE0",
            authDomain: "webbanhang-cc2c7.firebaseapp.com",
            projectId: "webbanhang-cc2c7",
            storageBucket: "webbanhang-cc2c7.appspot.com",
            messagingSenderId: "777103483355",
            appId: "1:777103483355:web:cd03654e7cdad7114ec7fe",
            measurementId: "G-B138HGZSQ3"
        };
        
        // Kiểm tra nếu Firebase đã được khởi tạo
        const { initializeApp, getApps } = await import('https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js');
        const apps = getApps();
        const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
        const db = getFirestore(app);
        
        // Cập nhật từng sản phẩm trong Firestore
        for (const item of cartItems) {
            try {
                const productRef = doc(db, 'products', item.id);
                const productSnap = await getDoc(productRef);
                
                if (!productSnap.exists()) {
                    console.log(`Sản phẩm ${item.id} không tìm thấy trong Firestore`);
                    continue;
                }
                
                const product = productSnap.data();
                
                // Kiểm tra xem sản phẩm có cấu trúc sizes mới không
                if (product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0) {
                    if (typeof product.sizes[0] === 'object') {
                        // Cấu trúc mới: [{size: 'XS', stock: 10}, ...]
                        const selectedSize = item.selectedSize;
                        if (selectedSize) {
                            const updatedSizes = product.sizes.map(sizeObj => {
                                if (sizeObj.size === selectedSize) {
                                    return {
                                        ...sizeObj,
                                        stock: Math.max(0, (sizeObj.stock || 0) - item.quantity)
                                    };
                                }
                                return sizeObj;
                            });
                            
                            await updateDoc(productRef, { sizes: updatedSizes });
                            console.log(`Đã cập nhật stock cho ${item.title || item.name} - Size ${selectedSize}`);
                        }
                    } else {
                        // Cấu trúc cũ: ['XS', 'S', 'M'] với stock chung
                        if (product.stock !== undefined) {
                            const newStock = Math.max(0, product.stock - item.quantity);
                            await updateDoc(productRef, { stock: newStock });
                            console.log(`Đã cập nhật stock cho ${item.title || item.name}`);
                        }
                    }
                } else if (product.stock !== undefined) {
                    // Không có sizes, giảm stock chung
                    const newStock = Math.max(0, product.stock - item.quantity);
                    await updateDoc(productRef, { stock: newStock });
                    console.log(`Đã cập nhật stock cho ${item.title || item.name}`);
                }
            } catch (itemError) {
                console.error(`Lỗi khi cập nhật sản phẩm ${item.id}:`, itemError);
            }
        }
        
        console.log('Hoàn thành cập nhật tồn kho trong Firestore');
    } catch (error) {
        console.error('Lỗi khi cập nhật tồn kho:', error);
    }
}

function updateOrderStatus(orderId, status) {
    const orders = getOrders();
    const order = orders.find(o => o.id == orderId);
    if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        localStorage.setItem('orders', JSON.stringify(orders));
    }
}

function cancelOrder(orderId) {
    updateOrderStatus(orderId, 'Đã hủy');
}

// Quản lý sản phẩm
function getProducts() {
    return fetch("https://fakestoreapi.com/products")
        .then(res => res.json())
        .then(apiProducts => {
            const localProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
            const mappedLocal = localProducts.map((p, idx) => ({
                id: 'local-' + idx,
                image: p.image,
                title: p.name,
                price: p.price,
                description: p.description || 'Sản phẩm chất lượng cao',
                category: p.category || 'other'
            }));
            return [...mappedLocal, ...apiProducts];
        });
}

// Quản lý mã giảm giá
function getCoupons() {
    return JSON.parse(localStorage.getItem('coupons')) || [
        { code: 'SALE10', discount: 10, type: 'percent', minOrder: 100 },
        { code: 'SALE50K', discount: 50, type: 'fixed', minOrder: 200 },
        { code: 'FREESHIP', discount: 30, type: 'fixed', minOrder: 150 }
    ];
}

function applyCoupon(code, orderTotal) {
    const coupons = getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    
    if (!coupon) {
        return { success: false, message: 'Mã giảm giá không hợp lệ!' };
    }
    
    if (orderTotal < coupon.minOrder) {
        return { 
            success: false, 
            message: `Đơn hàng tối thiểu ${coupon.minOrder.toLocaleString()}$ để sử dụng mã này!` 
        };
    }
    
    let discount = 0;
    if (coupon.type === 'percent') {
        discount = (orderTotal * coupon.discount) / 100;
    } else {
        discount = coupon.discount;
    }
    
    return {
        success: true,
        discount: discount,
        coupon: coupon,
        message: `Đã áp dụng mã giảm giá ${coupon.discount}${coupon.type === 'percent' ? '%' : '$'}!`
    };
}

// Khởi tạo khi load trang
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Cập nhật link user button
    const userBtn = document.getElementById('user-btn');
    if (userBtn) {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            userBtn.href = 'auth.html';
            userBtn.title = 'Đăng nhập';
        } else {
            userBtn.href = 'account.html';
            userBtn.title = currentUser.name;
        }
    }
    
    // Xử lý hiển thị nút đăng nhập/icon user
    const userIcons = ['user-icon', 'user-icon-cart'];
    const loginBtns = ['login-btn', 'login-btn-cart'];
    
    userIcons.forEach((iconId, index) => {
        const userIcon = document.getElementById(iconId);
        const loginBtn = document.getElementById(loginBtns[index]);
        if (userIcon && loginBtn) {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                userIcon.style.display = 'none';
                loginBtn.style.display = 'inline-block';
            } else {
                userIcon.style.display = 'inline-block';
                loginBtn.style.display = 'none';
            }
        }
    });
    
    // Xử lý logout buttons
    const logoutBtns = ['logout-btn', 'logout-btn-header', 'logout-btn-cart'];
    logoutBtns.forEach(btnId => {
        const logoutBtn = document.getElementById(btnId);
        if (logoutBtn) {
            logoutBtn.onclick = function(e) {
                e.preventDefault();
                if (confirm('Bạn có chắc muốn đăng xuất?')) {
                    logout();
                }
            };
        }
    });
    
    // Xử lý cart icon
    const cartIcons = document.querySelectorAll('.cart-icon');
    cartIcons.forEach(icon => {
        icon.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'cart.html';
        });
    });
});
