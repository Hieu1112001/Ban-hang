const header = document.querySelector("header")
window.addEventListener("scroll", function () {
    x = window.pageYOffset
    if (x > 0) {
        header.classList.add("sticky")
    }
    else {
        header.classList.remove("sticky");
    }
})
const imgPosition = document.querySelectorAll(".aspect-radio-169 img")
// console.log(imgPosition)
const imgContainer = document.querySelector('.aspect-radio-169')
const dotItem = document.querySelectorAll(".dot");
let index = 0;
let imgNumber = imgPosition.length
imgPosition.forEach(function (image, index) {
    // console.log(image, index)
    image.style.left = index * 100 + "%"
    dotItem[index].addEventListener("click", function () {
        slider(index)
    });

})

function imgSlide() {
    index++;
    // console.log(index)
    if (index >= imgNumber) {
        index = 0;
    }
    slider(index)
}

function slider(index) {
    imgContainer.style.left = "-" + index * 100 + "%"
    const dotActive = document.querySelector('.active')
    dotActive.classList.remove("active")
    dotItem[index].classList.add("active")
}

setInterval(imgSlide, 4000)




// body
function renderAllProducts() {
    fetch("https://fakestoreapi.com/products")
        .then(res => res.json())
        .then(apiProducts => {
   
            const localProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
        
            const mappedLocal = localProducts.map((p, idx) => ({
                id: 'local-' + idx,
                image: p.image,
                title: p.name,
                price: p.price
            }));
            const allProducts = [...mappedLocal, ...apiProducts];
            const container = document.querySelector(".product-list");
            container.innerHTML = '';
            allProducts.forEach(product => {
                const item = `
                <div class="product-card">
                  <img src="${product.image}" alt="${product.title}">
                  <h3>${product.title}</h3>
                  <p class="price">${product.price.toLocaleString()}$</p>
                  <button class="btn add-to-cart" data-id="${product.id}">Add to cart</button>
                </div>
              `;
                container.innerHTML += item;
            });
      
            document.querySelectorAll('.add-to-cart').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = this.getAttribute('data-id');
                    let product;
                    if (id.startsWith('local-')) {
                        const localProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
                        const idx = parseInt(id.replace('local-', ''));
                        product = localProducts[idx];
                        product = { ...product, id };
                    } else {
                        product = apiProducts.find(p => p.id == id);
                    }
                    let cart = JSON.parse(localStorage.getItem('cart')) || [];
                    const exist = cart.find(item => item.id == product.id);
                    if (exist) {
                        exist.quantity += 1;
                    } else {
                        cart.push({ ...product, quantity: 1 });
                    }
                    localStorage.setItem('cart', JSON.stringify(cart));
                    alert('Đã thêm vào giỏ hàng!');
                });
            });
        });
}
renderAllProducts();

const cartIcon = document.querySelector('.cart-icon');
if (cartIcon) {
    cartIcon.addEventListener('click', function() {
        window.location.href = 'cart.html';
    });
}