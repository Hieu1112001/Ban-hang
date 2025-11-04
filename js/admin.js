import { getOrders } from "../services/cart.js";
function showToast(id, message) {
  const toastEl = document.getElementById(id);
  toastEl.querySelector(".toast-body").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
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
    return data.url; // link ảnh ImageKit trả về
  } catch (error) {
    console.error(error);
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
  const file = document.getElementById("productImage").files[0];

  if (!file) {
    alert("Vui lòng chọn ảnh!");
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
        const product = {
            name: e.target.dataset.name,
            price: e.target.dataset.price,
            category: e.target.dataset.category,
            image: e.target.dataset.image
        };
        
        // Điền thông tin vào form
        document.getElementById('editProductId').value = productId;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCategory').value = product.category || 'nu';
        document.getElementById('currentImage').src = product.image;
        
        // Hiện modal
        const modal = new bootstrap.Modal(document.getElementById('editProductModal'));
        modal.show();
    }
});

// Xử lý sự kiện Submit form sửa
document.getElementById('saveEditBtn').onclick = async function() {
    const productId = document.getElementById('editProductId').value;
    const updateData = {
        name: document.getElementById('editProductName').value.trim(),
        price: parseFloat(document.getElementById('editProductPrice').value),
        category: document.getElementById('editProductCategory').value
    };

    const imageFile = document.getElementById('editProductImage').files[0];
    
    try {
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
    const orders = await getOrders();
    const tbody = document.querySelector("#order-table tbody");

    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Chưa có đơn hàng</td></tr>`;
        return;
    }

    // Sắp xếp đơn hàng theo ngày từ mới đến cũ
    const sortedOrders = orders.sort((a, b) => {
        const dateA = a.createdAt?.seconds || a.orderDate?.seconds || 0;
        const dateB = b.createdAt?.seconds || b.orderDate?.seconds || 0;
        return dateB - dateA; // Đảo ngược để từ mới đến cũ
    });

    tbody.innerHTML = "";
    sortedOrders.forEach((order, i) => {
        const products = order.products || [];
        if (products.length === 0) return;

        const rowspan = products.length;
        
        // Format ngày theo dd/mm/yyyy
        const orderDate = formatDate(order.createdAt || order.orderDate);

        products.forEach((item, index) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                ${index === 0 ? `<td rowspan="${rowspan}">${i + 1}</td>` : ""}
                ${index === 0 ? `<td rowspan="${rowspan}">${orderDate}</td>` : ""}
                ${index === 0 ? `<td rowspan="${rowspan}">${order.customerName || ""}</td>` : ""}
                ${index === 0 ? `<td rowspan="${rowspan}">${order.phoneNumber || ""}</td>` : ""}
                ${index === 0 ? `<td rowspan="${rowspan}">${order.shippingAddress || ""}</td>` : ""}
                ${index === 0 ? `<td rowspan="${rowspan}">${order.paymentMethod || "Tiền mặt"}</td>` : ""}
                <td>${item.name} x${item.quantity}</td>
                <td>${(item.price * item.quantity).toLocaleString()}₫</td>
            `;

            tbody.appendChild(tr);
        });

        const total = products.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const trTotal = document.createElement("tr");
        trTotal.innerHTML = `
            <td colspan="7" class="text-end fw-bold">Tổng</td>
            <td class="fw-bold">${total.toLocaleString()}₫</td>
        `;
        tbody.appendChild(trTotal);
    });
}

async function renderProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const tbody = document.querySelector('#product-table tbody');
        tbody.innerHTML = '';
        
        querySnapshot.forEach((doc, index) => {
            const product = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td><img src="${product.image}" style="height:50px;object-fit:contain"></td>
                    <td>${product.name}</td>
                    <td>${product.price.toLocaleString()}₫</td>
                    <td>${product.category || 'N/A'}</td>
                    <td>
                        <button class="btn btn-primary btn-sm edit-product" 
                            data-id="${doc.id}"
                            data-name="${product.name}"
                            data-price="${product.price}"
                            data-category="${product.category || 'nu'}"
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

renderProducts();
renderOrders();
