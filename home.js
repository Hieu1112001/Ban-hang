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
fetch("https://fakestoreapi.com/products")
    .then(res => res.json())
    .then(products => {
        const container = document.querySelector(".product-list");
        products.forEach(product => {
            const item = `
        <div class="product-card">
          <img src="${product.image}" alt="${product.title}">
          <h3>${product.title}</h3>
          <p class="price">${product.price.toLocaleString()}$</p>
          <button class="btn">Add to cart</button>
        </div>
      `;
            container.innerHTML += item;
        });
    });