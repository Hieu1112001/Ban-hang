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
async function renderAllProducts() {
  const products = await getProducts();
  console.log(products);

  const container = document.querySelector(".product-list");
  container.innerHTML = "";
  products.forEach((product) => {
    const item = `
                <div class="product-card">
                  <img src="${product.image}" alt="${product.title}">
                  <h3>${product.name}</h3>
                  <p class="price">${product.price.toLocaleString()}$</p>
                  <button class="btn add-to-cart" data-id="${
                    product.id
                  }">Add to cart</button>
                </div>
              `;
    container.innerHTML += item;
    container.querySelectorAll(".add-to-cart").forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-id");
        const product = products.find((p) => p.id === productId);
        handleAddToCart(product);
      });
    });
  });
}
renderAllProducts();

const cartIcon = document.querySelector(".cart-icon");
if (cartIcon) {
  cartIcon.addEventListener("click", function () {
    window.location.href = "cart.html";
  });
}
