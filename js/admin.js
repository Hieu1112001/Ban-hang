console.log('=== BẮT ĐẦU LOAD ADMIN.JS ===');

// Kiểm tra quyền admin (đã kiểm tra ở HTML, đây là lớp bảo vệ thứ 2)
const adminUser = JSON.parse(localStorage.getItem('adminUser'));
if (!adminUser) {
    console.error('Không có quyền truy cập!');
    throw new Error('Unauthorized');
}
console.log('Admin user:', adminUser.username);

import { getOrders } from "../services/cart.js";

console.log('Import getOrders thành công');

function showToast(id, message) {
  const toastEl = document.getElementById(id);
  toastEl.querySelector(".toast-body").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

// Hàm hiển thị trạng thái đơn hàng với màu sắc
function getStatusBadge(status) {
  const statusMap = {
    'pending': { text: 'Chờ xử lý', class: 'bg-warning' },
    'processing': { text: 'Đang xử lý', class: 'bg-info' },
    'shipping': { text: 'Đang giao hàng', class: 'bg-primary' },
    'completed': { text: 'Hoàn thành', class: 'bg-success' },
    'cancelled': { text: 'Đã hủy', class: 'bg-danger' }
  };
  const s = statusMap[status] || { text: 'Chờ xử lý', class: 'bg-warning' };
  return `<span class="badge ${s.class}">${s.text}</span>`;
}

// Cập nhật số lượng đơn hàng
function updateOrderCount() {
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const pendingCount = orders.filter(o => !o.status || o.status === 'pending').length;
  document.getElementById('order-count').textContent = pendingCount;
  document.getElementById('order-count').style.display = pendingCount > 0 ? 'inline' : 'none';
}

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCEEErX_ybhvvi2W_unmIMnZTO4vEGdYE0",
  authDomain: "webbanhang-cc2c7.firebaseapp.com",
  projectId: "webbanhang-cc2c7",
  storageBucket: "webbanhang-cc2c7.appspot.com",
  messagingSenderId: "777103483355",
  appId: "1:777103483355:web:cd03654e7cdad7114ec7fe",
  measurementId: "G-B138HGZSQ3",
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc, addDoc } 
from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Get products from Firestore
async function getProducts() {
  const querySnapshot = await getDocs(collection(db, "products"));

  const products = [];
  querySnapshot.forEach((doc) => {
    products.push({ id: doc.id, ...doc.data() });
  });

  return products;
}

async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Upload thất bại:", errText);
      throw new Error("Upload ảnh thất bại");
    }

    const data = await res.json();
    console.log("Upload thành công:", data);
    return data.url; // link ảnh ImageKit trả về
  } catch (error) {
    console.error("Lỗi upload ảnh:", error);
    throw error;
  }
}

// Hàm lưu sản phẩm vào Firestore
async function saveProduct(product) {
  const docRef = await addDoc(collection(db, "products"), product);
  return docRef.id;
}

document.getElementById("add-product-form").onsubmit = async function (e) {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  const price = parseFloat(document.getElementById("productPrice").value);
  const category = document.getElementById("productCategory").value;
  const brand = document.getElementById("productBrand").value.trim();
  const material = document.getElementById("productMaterial").value.trim();
  const description = document.getElementById("productDescription").value.trim();
  const file = document.getElementById("productImage").files[0];
  
  // Lấy các size có số lượng > 0
  const sizes = [];
  const sizeNames = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  sizeNames.forEach(sizeName => {
    const stock = parseInt(document.getElementById(`stock${sizeName}`).value) || 0;
    if (stock > 0) {
      sizes.push({ size: sizeName, stock: stock });
    }
  });

  if (!file) {
    alert("Vui lòng chọn ảnh!");
    return;
  }
  
  if (sizes.length === 0) {
    alert("Vui lòng nhập số lượng cho ít nhất một size!");
    return;
  }

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = "Đang xử lý...";

    // Upload ảnh qua backend
    const imageUrl = await uploadImage(file);

    // Lưu sản phẩm vào Firestore
    await saveProduct({
      name,
      price,
      category,
      brand,
      material,
      description,
      sizes,
      image: imageUrl,
      createdAt: new Date(),
    });

    showToast("toastSuccess", "Thêm sản phẩm thành công!");
    this.reset();
    renderProducts();
  } catch (error) {
    console.error("Error:", error);
    showToast("toastError", "Có lỗi xảy ra khi thêm sản phẩm!");
  } finally {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.innerHTML = "Thêm";
  }
};

// Hàm xóa sản phẩm
async function deleteProduct(productId) {
    try {
        await deleteDoc(doc(db, "products", productId));
        showToast('toastSuccess', 'Xóa sản phẩm thành công!');
        renderProducts(); // Render lại danh sách
    } catch (error) {
        console.error("Error deleting product:", error);
        showToast('toastError', 'Lỗi khi xóa sản phẩm!');
    }
}

// Hàm cập nhật sản phẩm
async function updateProduct(productId, updateData) {
    try {
        await updateDoc(doc(db, "products", productId), updateData);
        showToast('toastSuccess', 'Cập nhật sản phẩm thành công!');
        renderProducts(); // Render lại danh sách
    } catch (error) {
        console.error("Error updating product:", error);
        showToast('toastError', 'Lỗi khi cập nhật sản phẩm!');
    }
}

// Xử lý sự kiện click nút Xóa
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-product')) {
        const productId = e.target.dataset.id;
        if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
            deleteProduct(productId);
        }
    }
});

// Xử lý sự kiện click nút Sửa
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-product')) {
        const productId = e.target.dataset.id;
        const sizesData = e.target.dataset.sizes ? JSON.parse(e.target.dataset.sizes) : [];
        
        const product = {
            name: e.target.dataset.name,
            price: e.target.dataset.price,
            category: e.target.dataset.category,
            brand: e.target.dataset.brand,
            material: e.target.dataset.material,
            description: e.target.dataset.description,
            sizes: sizesData,
            image: e.target.dataset.image
        };
        
        // Điền thông tin vào form
        document.getElementById('editProductId').value = productId;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.category || 'nu';
        document.getElementById('editProductBrand').value = product.brand || '';
        document.getElementById('editProductMaterial').value = product.material || '';
        document.getElementById('editProductDescription').value = product.description || '';
        document.getElementById('currentImage').src = product.image;
        
        // Reset tất cả các trường size
        const sizeNames = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
        sizeNames.forEach(sizeName => {
            document.getElementById(`editStock${sizeName}`).value = 0;
        });
        
        // Điền số lượng cho từng size
        if (Array.isArray(product.sizes)) {
            product.sizes.forEach(sizeObj => {
                if (typeof sizeObj === 'object' && sizeObj.size) {
                    const input = document.getElementById(`editStock${sizeObj.size}`);
                    if (input) input.value = sizeObj.stock || 0;
                }
            });
        }
        
        // Hiện modal
        const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
        modal.show();
    }
});

// Xử lý sự kiện Submit form sửa
document.getElementById('saveEditBtn').onclick = async function() {
    const productId = document.getElementById('editProductId').value;
    
    // Lấy sizes và số lượng
    const sizes = [];
    const sizeNames = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    sizeNames.forEach(sizeName => {
        const stock = parseInt(document.getElementById(`editStock${sizeName}`).value) || 0;
        if (stock > 0) {
            sizes.push({ size: sizeName, stock: stock });
        }
    });
    
    if (sizes.length === 0) {
        alert("Vui lòng nhập số lượng cho ít nhất một size!");
        return;
    }
    
    const updateData = {
        name: document.getElementById('editProductName').value.trim(),
        price: parseFloat(document.getElementById('editProductPrice').value),
        category: document.getElementById('editProductCategory').value,
        brand: document.getElementById('editProductBrand').value.trim(),
        material: document.getElementById('editProductMaterial').value.trim(),
        description: document.getElementById('editProductDescription').value.trim(),
        sizes: sizes
    };

    const imageFile = document.getElementById('editProductImage').files[0];
    
    try {
        this.disabled = true;
        this.innerHTML = 'Đang lưu...';
        
        if (imageFile) {
            // Nếu có ảnh mới, upload ảnh
            const imageUrl = await uploadImage(imageFile);
            updateData.image = imageUrl;
        }

        await updateProduct(productId, updateData);
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
    } catch (error) {
        console.error("Error:", error);
        showToast('toastError', 'Lỗi khi cập nhật sản phẩm!');
    } finally {
        this.disabled = false;
        this.innerHTML = 'Lưu thay đổi';
    }
};

// Thêm ImageKit configuration

// Sửa lại hàm uploadImage để dùng ImageKit

// Thêm hàm format ngày
function formatDate(date) {
    if (!date) return 'N/A';
    
    let d;
    
    // Kiểm tra nếu là Firestore Timestamp
    if (date.seconds) {
        // Chuyển Firestore Timestamp sang Date
        d = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
        d = date;
    } else {
        // Thử parse string hoặc số
        d = new Date(date);
    }
    
    if (isNaN(d.getTime())) return 'N/A';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    
    return `${day}/${month}/${year}`;
}

// Cập nhật hàm renderOrders
export async function renderOrders() {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const tbody = document.querySelector("#order-table tbody");

    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Chưa có đơn hàng</td></tr>`;
        updateOrderCount();
        return;
    }

    // Sắp xếp đơn hàng theo ngày từ mới đến cũ
    const sortedOrders = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
    });

    tbody.innerHTML = "";
    sortedOrders.forEach((order) => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
        const products = order.cart || [];
        const productList = products.map(p => `${p.title || p.name} (x${p.quantity})`).join('<br>');
        const status = order.status || 'pending';
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${order.id.toString().slice(-6)}</td>
            <td>${orderDate}</td>
            <td>${order.customerName || ""}</td>
            <td>${order.customerPhone || ""}</td>
            <td style="max-width:200px;">${productList}</td>
            <td class="fw-bold">${order.total.toLocaleString()}$</td>
            <td>${getStatusBadge(status)}</td>
            <td>
                <select class="form-select form-select-sm status-select" data-order-id="${order.id}">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
                    <option value="processing" ${status === 'processing' ? 'selected' : ''}>Đang xử lý</option>
                    <option value="shipping" ${status === 'shipping' ? 'selected' : ''}>Đang giao hàng</option>
                    <option value="completed" ${status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
                    <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                </select>
                <button class="btn btn-danger btn-sm mt-1 delete-order" data-order-id="${order.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Xử lý thay đổi trạng thái
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const orderId = parseInt(this.dataset.orderId);
            const newStatus = this.value;
            updateOrderStatus(orderId, newStatus);
        });
    });
    
    // Xử lý xóa đơn hàng
    document.querySelectorAll('.delete-order').forEach(btn => {
        btn.addEventListener('click', function() {
            if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
                const orderId = parseInt(this.dataset.orderId);
                deleteOrder(orderId);
            }
        });
    });
    
    updateOrderCount();
}

function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrders();
        showToast('toastSuccess', 'Cập nhật trạng thái thành công!');
    }
}

function deleteOrder(orderId) {
    let orders = JSON.parse(localStorage.getItem('orders')) || [];
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem('orders', JSON.stringify(orders));
    renderOrders();
    showToast('toastSuccess', 'Đã xóa đơn hàng!');
}

async function renderProducts() {
    console.log('renderProducts được gọi');
    try {
        const tbody = document.querySelector('#product-table tbody');
        if (!tbody) {
            console.error('Không tìm thấy tbody của product-table');
            return;
        }
        
        console.log('Đang lấy sản phẩm từ Firestore...');
        const querySnapshot = await getDocs(collection(db, "products"));
        console.log('Số lượng sản phẩm:', querySnapshot.size);
        
        tbody.innerHTML = '';
        
        if (querySnapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">Chưa có sản phẩm nào</td></tr>';
            return;
        }
        
        querySnapshot.forEach((doc, index) => {
            const product = doc.data();
            console.log('Sản phẩm:', product.name);
            
            // Tính tổng số lượng từ tất cả sizes
            let totalStock = 0;
            let sizesDisplay = 'N/A';
            
            if (product.sizes && Array.isArray(product.sizes)) {
                // Kiểm tra xem sizes là mảng object hay mảng string
                if (product.sizes.length > 0 && typeof product.sizes[0] === 'object') {
                    // Mảng object mới: [{size: 'XS', stock: 10}, ...]
                    totalStock = product.sizes.reduce((sum, s) => sum + (s.stock || 0), 0);
                    sizesDisplay = product.sizes.map(s => `${s.size} (${s.stock})`).join(', ');
                } else {
                    // Mảng string cũ: ['XS', 'S', 'M']
                    sizesDisplay = product.sizes.join(', ');
                    totalStock = product.stock || 0;
                }
            }
            
            const stockStatus = totalStock > 0 ? 
                `<span class="badge bg-success">Còn hàng</span>` : 
                `<span class="badge bg-danger">Hết hàng</span>`;
            
            // Chuyển sizes thành JSON string để lưu vào data-attribute
            const sizesData = JSON.stringify(product.sizes || []);
            
            tbody.innerHTML += `
                <tr>
                    <td><img src="${product.image}" style="height:50px;object-fit:contain"></td>
                    <td>${product.name}</td>
                    <td>${product.price.toLocaleString()}$</td>
                    <td>${product.brand || 'N/A'}</td>
                    <td style="max-width:200px;">${sizesDisplay}</td>
                    <td>${totalStock}</td>
                    <td>${stockStatus}</td>
                    <td>
                        <button class="btn btn-primary btn-sm edit-product" 
                            data-id="${doc.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-category="${product.category || 'nu'}"
                            data-brand="${product.brand || ''}"
                            data-material="${product.material || ''}"
                            data-description="${product.description || ''}"
                            data-sizes='${sizesData}'
                            data-image="${product.image}">
                            Sửa
                        </button>
                        <button class="btn btn-danger btn-sm delete-product" 
                            data-id="${doc.id}">
                            Xóa
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error getting products:", error);
        showToast('toastError', 'Lỗi khi tải danh sách sản phẩm!');
    }
}

// Render ngay khi load
renderProducts();
renderOrders();
updateOrderCount();

console.log('Đã gọi renderProducts() và renderOrders()');

// Xử lý tìm kiếm sản phẩm
document.getElementById('searchProduct')?.addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#product-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
});

// Xử lý tìm kiếm đơn hàng
document.getElementById('searchOrder')?.addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#order-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
});

// Xử lý lọc trạng thái đơn hàng
document.getElementById('filterStatus')?.addEventListener('change', function(e) {
    const status = e.target.value;
    const rows = document.querySelectorAll('#order-table tbody tr');
    rows.forEach(row => {
        if (!status) {
            row.style.display = '';
        } else {
            const badge = row.querySelector('.badge');
            const rowStatus = row.querySelector('.status-select')?.value;
            row.style.display = rowStatus === status ? '' : 'none';
        }
    });
});

// Khởi tạo tab navigation
document.querySelectorAll('#adminTabs button').forEach(button => {
    button.addEventListener('shown.bs.tab', function (e) {
        if (e.target.id === 'orders-tab') {
            renderOrders();
        } else if (e.target.id === 'products-tab') {
            renderProducts();
        } else if (e.target.id === 'users-tab') {
            renderUsers();
        }
    });
});

// Hàm lấy danh sách users từ Firestore
async function getUsers() {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = [];
    querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
}

// Hàm hiển thị danh sách users
async function renderUsers() {
    try {
        const users = await getUsers();
        const tbody = document.querySelector('#users-table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = users.map((user, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="viewUserDetail('${user.id}')">
                        <i class="fas fa-eye"></i> Chi tiết
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        console.log(`Đã load ${users.length} tài khoản`);
    } catch (error) {
        console.error('Lỗi khi load users:', error);
        alert('Không thể tải danh sách tài khoản!');
    }
}

// Hàm xem chi tiết user
window.viewUserDetail = async function(userId) {
    try {
        const users = await getUsers();
        const user = users.find(u => u.id === userId);
        
        if (user) {
            const addresses = user.addresses && user.addresses.length > 0 
                ? user.addresses.map(addr => `- ${addr}`).join('\n')
                : 'Chưa có địa chỉ';
                
            alert(`Thông tin chi tiết:\n\nTên: ${user.name}\nEmail: ${user.email}\nSĐT: ${user.phone || 'N/A'}\nNgày đăng ký: ${new Date(user.createdAt).toLocaleString('vi-VN')}\n\nĐịa chỉ:\n${addresses}`);
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể xem chi tiết!');
    }
}

// Hàm xóa user
window.deleteUser = async function(userId) {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return;
    
    try {
        await deleteDoc(doc(db, "users", userId));
        alert('Đã xóa tài khoản thành công!');
        renderUsers();
    } catch (error) {
        console.error('Lỗi khi xóa:', error);
        alert('Xóa thất bại!');
    }
}

// Tìm kiếm user
document.getElementById('searchUser')?.addEventListener('input', function(e) {
    const searchText = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#users-table tbody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchText) ? '' : 'none';
    });
});
