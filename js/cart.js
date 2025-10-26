import { saveCartToFirebase } from "../services/cart.js";
function showToast(id, message) {
  const toastEl = document.getElementById(id);
  toastEl.querySelector(".toast-body").textContent = message;
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}
function renderCart() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log(cart);

  const cartList = document.querySelector(".cart-list");
  const cartTotal = document.querySelector(".cart-total");
  if (cart.length === 0) {
    cartList.innerHTML =
      '<div class="col-12"><div class="alert alert-info">Giỏ hàng trống.</div></div>';
    cartTotal.innerHTML = "";
    document.getElementById("checkout-btn").style.display = "none";
    return;
  }
  let total = 0;
  cartList.innerHTML = cart
    .map((item) => {
      total += item.price * item.quantity;
      return `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100 shadow-sm">
                            <img src="${item.image}" alt="${
        item.name
      }" class="card-img-top p-3" style="height:180px;object-fit:contain;">
                            <div class="card-body d-flex flex-column">
                                <h5 class="card-title">${item.name}</h5>
                                <p class="card-text mb-1">Giá: <span class="fw-bold text-danger">${item.price.toLocaleString()}$</span></p>
                                <div class="d-flex align-items-center mb-2">
                                    <span class="me-2">Số lượng:</span>
                                    <span class="badge bg-secondary quantity">${
                                      item.quantity
                                    }</span>
                                </div>
                                <button class="btn btn-danger mt-auto remove-btn" data-id="${
                                  item.id
                                }">Xóa</button>
                            </div>
                        </div>
                    </div>
                `;
    })
    .join("");
  cartTotal.innerHTML = `<div class="alert alert-success text-end"><h4 class="mb-0">Tổng cộng: <span class="text-danger">${total.toLocaleString()}$</span></h4></div>`;
  document.getElementById("checkout-btn").style.display = "inline-block";

  document.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart = cart.filter((item) => item.id != id);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    });
  });
}
renderCart();

document.querySelectorAll(".cart-icon").forEach((icon) => {
  icon.addEventListener("click", function (e) {
    e.preventDefault();
    window.location.href = "cart.html";
  });
});

document.getElementById("checkout-btn").addEventListener("click", function () {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    alert("Giỏ hàng trống!");
    return;
  }
  const modal = new bootstrap.Modal(document.getElementById("checkoutModal"));
  modal.show();
});

document
  .getElementById("paymentMethod")
  .addEventListener("change", function () {
    const extra = document.getElementById("payment-extra");
    if (this.value === "cod") {
      extra.innerHTML =
        '<div class="alert alert-info">Vui lòng chuyển khoản đến số tài khoản: <b>123456789 - Ngân hàng ABC</b></div>';
      extra.style.display = "block";
    } else if (this.value === "credit") {
      extra.innerHTML =
        '<div class="mb-2"><label class="form-label">Số thẻ</label><input type="text" class="form-control" required></div><div class="mb-2"><label class="form-label">Tên chủ thẻ</label><input type="text" class="form-control" required></div><div class="mb-2"><label class="form-label">Ngày hết hạn</label><input type="text" class="form-control" placeholder="MM/YY" required></div><div class="mb-2"><label class="form-label">CVV</label><input type="password" class="form-control" required></div>';
      extra.style.display = "block";
    } else if (this.value === "qr") {
      extra.innerHTML =
        '<div class="text-center"><img src="https://img.vietqr.io/image/970422-123456789-compact2.png" alt="QR Code" style="max-width:180px;"><p>Quét mã để thanh toán</p></div>';
      extra.style.display = "block";
    } else {
      extra.innerHTML = "";
      extra.style.display = "none";
    }
  });

document
  .getElementById("payment-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const customerName = document.getElementById("customerName").value.trim();
    const customerPhone = document.getElementById("customerPhone").value.trim();
    const customerAddress = document
      .getElementById("customerAddress")
      .value.trim();
    const paymentMethod =
      document.getElementById("paymentMethod").options[
        document.getElementById("paymentMethod").selectedIndex
      ].text;
  
    await saveCartToFirebase({
      name: customerName,
      phone: customerPhone,
      address: customerAddress,
    });
    showToast("toastSuccess", "Đặt hàng thành công!");
    this.reset();
    localStorage.removeItem("cart");
    renderCart();
    bootstrap.Modal.getInstance(
      document.getElementById("checkoutModal")
    ).hide();
  });
