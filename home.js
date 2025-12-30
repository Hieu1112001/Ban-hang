import {
    getCart
} from "./services/cart.js";
import { getProducts } from "./services/productServices.js";

// Expose getProducts ngay lập tức cho search.js
window.getProducts = getProducts;

// Thêm sản phẩm

function showToast(id, message) {
  const toastEl = document.getElementById(id);
  toastEl.querySelector(".toast-body").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

const handleAddToCart = (product) => {
  console.log(product);

  try {
    // Sử dụng hàm addToCart từ common.js
    addToCart(product, 1);

    showToast("toastSuccess", "Đã thêm sản phẩm vào giỏ hàng!");
    setTimeout(() => {
    //   window.location.href = "cart.html";
    }, 1000);
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
  }
};

// Hiển thị giỏ hàng
async function renderCart() {
  const cart = await getCart();
  console.log(cart);
}
renderCart();

const header = document.querySelector("header");
window.addEventListener("scroll", function () {
  x = window.pageYOffset;
  if (x > 0) {
    header.classList.add("sticky");
  } else {
    header.classList.remove("sticky");
  }
});
const imgPosition = document.querySelectorAll(".aspect-radio-169 img");
// console.log(imgPosition)
const imgContainer = document.querySelector(".aspect-radio-169");
const dotItem = document.querySelectorAll(".dot");
let index = 0;
let imgNumber = imgPosition.length;
imgPosition.forEach(function (image, index) {
  // console.log(image, index)
  image.style.left = index * 100 + "%";
  dotItem[index].addEventListener("click", function () {
    slider(index);
  });
});

function imgSlide() {
  index++;
  // console.log(index)
  if (index >= imgNumber) {
    index = 0;
  }
  slider(index);
}

function slider(index) {
  imgContainer.style.left = "-" + index * 100 + "%";
  const dotActive = document.querySelector(".active");
  dotActive.classList.remove("active");
  dotItem[index].classList.add("active");
}

setInterval(imgSlide, 4000);

// body
// Hiển thị modal chi tiết sản phẩm
function showProductDetail(product) {
    // Điền thông tin sản phẩm vào modal
    document.getElementById('modalProductImage').src = product.image;
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductPrice').textContent = product.price.toLocaleString() + ' ₫';
    
    // Hiển thị thông tin bổ sung
    const descriptionEl = document.getElementById('modalProductDescription');
    if (product.description) {
        descriptionEl.textContent = product.description;
    } else {
        descriptionEl.textContent = 'Sản phẩm chất lượng cao, thiết kế hiện đại, phù hợp cho mọi lứa tuổi.';
    }
    
    // Hiển thị nhãn hiệu và chất liệu
    const brandEl = document.getElementById('modalProductBrand');
    const materialEl = document.getElementById('modalProductMaterial');
    
    if (brandEl) {
        brandEl.textContent = product.brand || 'Đang cập nhật';
    }
    
    if (materialEl) {
        materialEl.textContent = product.material || 'Đang cập nhật';
    }
    
    // Tính tổng số lượng tồn kho từ tất cả sizes
    let totalStock = 0;
    let sizesArray = [];
    
    if (product.sizes && Array.isArray(product.sizes)) {
        if (product.sizes.length > 0 && typeof product.sizes[0] === 'object') {
            // Mảng object mới: [{size: 'XS', stock: 10}, ...]
            sizesArray = product.sizes;
            totalStock = product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
        } else {
            // Mảng string cũ: ['XS', 'S', 'M']
            sizesArray = product.sizes.map(s => ({ size: s, stock: product.stock || 0 }));
            totalStock = product.stock || 0;
        }
    }
    
    // Hiển thị số lượng tồn kho
    const stockEl = document.getElementById('modalProductStock');
    const isOutOfStock = totalStock <= 0;
    if (stockEl) {
        if (isOutOfStock) {
            stockEl.innerHTML = '<span class="badge bg-danger">Hết hàng</span>';
        } else {
            stockEl.innerHTML = `<span class="badge bg-success">Còn ${totalStock} sản phẩm</span>`;
        }
    }
    
    // Hiển thị sizes với số lượng
    const sizesContainer = document.getElementById('modalProductSizes');
    if (sizesContainer && sizesArray.length > 0) {
        sizesContainer.innerHTML = sizesArray.map(sizeObj => {
            const isDisabled = sizeObj.stock <= 0;
            const disabledClass = isDisabled ? 'disabled' : '';
            const displayText = `${sizeObj.size} ${sizeObj.stock > 0 ? '(' + sizeObj.stock + ')' : '(Hết)'}`;
            return `<button type="button" class="btn btn-outline-dark btn-sm size-option ${disabledClass}" 
                        data-size="${sizeObj.size}" data-stock="${sizeObj.stock}" 
                        ${isDisabled ? 'disabled' : ''}>${displayText}</button>`;
        }).join('');
        sizesContainer.parentElement.style.display = 'block';
        
        // Event listeners cho size buttons
        document.querySelectorAll('.size-option:not(.disabled)').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.size-option').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Cập nhật số lượng tối đa theo stock của size
                const sizeStock = parseInt(this.dataset.stock) || 0;
                const quantityInput = document.getElementById('modalQuantity');
                quantityInput.max = sizeStock;
                if (parseInt(quantityInput.value) > sizeStock) {
                    quantityInput.value = sizeStock;
                }
            });
        });
        
        // Tự động chọn size đầu tiên có hàng
        const firstAvailableSize = document.querySelector('.size-option:not(.disabled)');
        if (firstAvailableSize) {
            firstAvailableSize.classList.add('active');
            const sizeStock = parseInt(firstAvailableSize.dataset.stock) || 0;
            document.getElementById('modalQuantity').max = sizeStock;
        }
    } else if (sizesContainer) {
        sizesContainer.parentElement.style.display = 'none';
        document.getElementById('modalQuantity').max = totalStock || 999;
    }
    
    // Màu sắc
    const colorSamples = [
        { name: 'Đen', code: '#000' },
        { name: 'Trắng', code: '#fff' },
        { name: 'Xám', code: '#808080' }
    ];
    
    const colorsHtml = colorSamples.map((color, index) => `
        <span class="color-dot ${index === 0 ? 'active' : ''}" 
              style="background: ${color.code}; ${color.code === '#fff' ? 'border-color: #ddd;' : ''}"
              data-color="${color.name}"></span>
    `).join('');
    document.getElementById('modalProductColors').innerHTML = colorsHtml;
    
    // Reset số lượng
    document.getElementById('modalQuantity').value = 1;
    
    // Điền thông tin chi tiết sản phẩm
    const categoryMap = {
        'nu': 'Thời trang Nữ',
        'nam': 'Thời trang Nam',
        'tre-em': 'Thời trang Trẻ em',
        "women's clothing": 'Thời trang Nữ',
        "men's clothing": 'Thời trang Nam',
        'jewelery': 'Trang sức',
        'electronics': 'Điện tử'
    };
    
    // Cập nhật danh mục
    const categoryEl = document.getElementById('modalProductCategory');
    if (categoryEl) {
        categoryEl.textContent = categoryMap[product.category] || product.category || 'N/A';
    }
    
    // Cập nhật thông tin sizes
    const sizesRow = document.getElementById('modalSizesRow');
    const sizesInfoEl = document.getElementById('modalProductSizesInfo');
    if (sizesArray.length > 0) {
        if (sizesRow) sizesRow.style.display = 'table-row';
        if (sizesInfoEl) {
            const sizesText = sizesArray.map(s => `${s.size}: ${s.stock} sp`).join(', ');
            sizesInfoEl.textContent = sizesText;
        }
    } else {
        if (sizesRow) sizesRow.style.display = 'none';
    }
    
    // Cập nhật tổng tồn kho
    const totalStockEl = document.getElementById('modalProductTotalStock');
    if (totalStockEl) {
        if (totalStock > 0) {
            totalStockEl.innerHTML = `<span class="text-success fw-bold">${totalStock} sản phẩm</span>`;
        } else {
            totalStockEl.innerHTML = `<span class="text-danger fw-bold">Hết hàng</span>`;
        }
    }
    
    // Cập nhật mã sản phẩm
    const productIdEl = document.getElementById('modalProductId');
    if (productIdEl) {
        productIdEl.textContent = product.id || 'N/A';
    }
    
    // Vô hiệu hóa nút thêm giỏ hàng nếu hết hàng
    const addToCartBtn = document.getElementById('addToCartFromModal');
    if (isOutOfStock) {
        addToCartBtn.disabled = true;
        addToCartBtn.innerHTML = '<i class="fas fa-times"></i> Hết hàng';
        addToCartBtn.classList.add('btn-secondary');
        addToCartBtn.classList.remove('btn-dark');
    } else {
        addToCartBtn.disabled = false;
        addToCartBtn.innerHTML = 'THÊM VÀO GIỎ HÀNG';
        addToCartBtn.classList.add('btn-dark');
        addToCartBtn.classList.remove('btn-secondary');
    }
    
    // Lưu thông tin sản phẩm hiện tại
    addToCartBtn.dataset.productId = product.id;
    
    // Hiển thị modal
    const modal = new bootstrap.Modal(document.getElementById('productDetailModal'));
    modal.show();
    
    // Event listeners cho color dots
    document.querySelectorAll('#modalProductColors .color-dot').forEach(dot => {
        dot.addEventListener('click', function() {
            document.querySelectorAll('#modalProductColors .color-dot').forEach(d => d.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Render sản phẩm theo category
async function renderAllProducts() {
    const products = await getProducts();
    
    // Phân loại sản phẩm
    const categorizedProducts = {
        nu: products.filter(p => p.category === 'nu'),
        nam: products.filter(p => p.category === 'nam'),
        'tre-em': products.filter(p => p.category === 'tre-em')
    };

    // Màu sắc mẫu cho sản phẩm
    const colorSamples = [
        { name: 'Đen', code: '#000' },
        { name: 'Trắng', code: '#fff' },
        { name: 'Xám', code: '#808080' }
    ];

    // Render cho từng danh mục
    Object.entries(categorizedProducts).forEach(([category, products]) => {
        const container = document.querySelector(`#products-${category}`);
        if (!container) return;

        container.innerHTML = products.map(product => {
            // Tính tổng stock từ tất cả sizes
            let totalStock = 0;
            if (product.sizes && Array.isArray(product.sizes)) {
                if (product.sizes.length > 0 && typeof product.sizes[0] === 'object') {
                    // Cấu trúc mới: [{size: 'XS', stock: 10}, ...]
                    totalStock = product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
                } else {
                    // Cấu trúc cũ: ['XS', 'S', 'M']
                    totalStock = product.stock || 0;
                }
            } else {
                totalStock = product.stock || 0;
            }
            
            const isOutOfStock = totalStock <= 0;
            const stockBadge = isOutOfStock ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Hết hàng</span>' : '';
            
            return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-product-id="${product.id}">
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${product.name}" style="${isOutOfStock ? 'opacity:0.6;' : ''}">
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
                    <h3>${product.name}</h3>
                    ${isOutOfStock ? '<p class="text-danger fw-bold">Hết hàng</p>' : totalStock > 0 ? `<p class="text-muted">Còn ${totalStock} sản phẩm</p>` : ''}
                </div>
            </div>
        `;
        }).join('');

        // Add nút "Xem thêm" nếu có nhiều sản phẩm
        if (products.length > 0) {
            container.innerHTML += `
                <div class="view-more-wrapper" style="grid-column: 1/-1;">
                    <a href="#" class="view-more-btn">Xem thêm</a>
                </div>
            `;
        }

        // Event listeners cho click vào product card (hiện modal)
        container.querySelectorAll('.product-card').forEach(card => {
            const productId = card.dataset.productId;
            const product = products.find(p => p.id === productId);
            
            // Click vào card để xem chi tiết
            card.addEventListener('click', function(e) {
                // Không mở modal nếu click vào nút add to cart
                if (!e.target.closest('.add-to-cart-btn')) {
                    showProductDetail(product);
                }
            });
        });

        // Event listeners cho Add to cart nhanh
        container.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = button.getAttribute('data-id');
                const product = products.find(p => p.id === productId);
                
                // Kiểm tra tồn kho
                if (product.stock !== undefined && product.stock <= 0) {
                    alert('Sản phẩm này đã hết hàng!');
                    return;
                }
                
                handleAddToCart(product);
            });
        });
    });
}

// Xử lý click tabs
document.addEventListener('DOMContentLoaded', function() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            // Remove active class từ tất cả tabs
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));

            // Add active class cho tab được click
            this.classList.add('active');
            
            // Hiển thị content tương ứng
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Load sản phẩm
    renderAllProducts();
    
    // Expose functions cho search.js
    window.loadProducts = renderAllProducts;
    window.getProducts = getProducts;
    window.showProductDetail = showProductDetail;
    window.handleAddToCart = handleAddToCart;
    
    // Xử lý tăng/giảm số lượng trong modal
    document.getElementById('increaseQty').addEventListener('click', function() {
        const input = document.getElementById('modalQuantity');
        input.value = parseInt(input.value) + 1;
    });
    
    document.getElementById('decreaseQty').addEventListener('click', function() {
        const input = document.getElementById('modalQuantity');
        if (parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
        }
    });
    
    // Xử lý thêm vào giỏ hàng từ modal
    document.getElementById('addToCartFromModal').addEventListener('click', async function() {
        const productId = this.dataset.productId;
        const quantity = parseInt(document.getElementById('modalQuantity').value);
        
        // Lấy thông tin sản phẩm
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        
        if (product) {
            // Kiểm tra xem sản phẩm có size không và có size nào được chọn không
            const selectedSizeBtn = document.querySelector('.size-option.active');
            if (product.sizes && product.sizes.length > 0 && !selectedSizeBtn) {
                alert('Vui lòng chọn kích thước!');
                return;
            }
            
            const selectedSize = selectedSizeBtn ? selectedSizeBtn.dataset.size : null;
            
            // Thêm vào giỏ hàng với số lượng và size
            for (let i = 0; i < quantity; i++) {
                const productWithSize = selectedSize ? { ...product, selectedSize } : product;
                handleAddToCart(productWithSize);
            }
            
            // Đóng modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('productDetailModal'));
            modal.hide();
        }
    });
});

const cartIcon = document.querySelector(".cart-icon");
if (cartIcon) {
  cartIcon.addEventListener("click", function () {
    window.location.href = "cart.html";
  });
}

async function getProductsForFront() {
    // nếu bạn đang dùng Firestore/db:
    if (window.getDocs && window.collection && window.db) {
        const q = await getDocs(collection(db, 'products'));
        return q.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    // fallback localStorage:
    return JSON.parse(localStorage.getItem('admin_products')) || [];
}
