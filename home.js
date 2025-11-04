import {
    getCart
} from "./services/cart.js";
import { getProducts } from "./services/productServices.js";

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
    // Lấy giỏ hàng hiện tại từ localStorage
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    // Kiểm tra xem sản phẩm đã có trong giỏ chưa
    const index = cart.findIndex((item) => item.id === product.id);
    if (index >= 0) {
      cart[index].quantity += 1; // nếu có rồi thì tăng số lượng
    } else {
      cart.push({ ...product, quantity: 1 }); // nếu chưa có thì thêm mới
    }

    // Lưu lại giỏ hàng vào localStorage
    localStorage.setItem("cart", JSON.stringify(cart));

    showToast("toastSuccess", "Đã thêm sản phẩm vào giỏ hàng!");
    setTimeout(() => {
    //   window.location.href = "cart.html";
    }, 1000);
    // Chuyển sang trang giỏ hàng (nếu muốn)
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
    
    // Lưu thông tin sản phẩm hiện tại
    document.getElementById('addToCartFromModal').dataset.productId = product.id;
    
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

        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-wrapper">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="add-to-cart-overlay">
                        <button class="add-to-cart-btn" data-id="${product.id}">
                            <i class="fas fa-plus"></i>
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
                </div>
            </div>
        `).join('');

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
            // Thêm vào giỏ hàng với số lượng
            for (let i = 0; i < quantity; i++) {
                handleAddToCart(product);
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
