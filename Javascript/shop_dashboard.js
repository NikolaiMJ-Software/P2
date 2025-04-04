document.addEventListener("DOMContentLoaded", async () =>{
    const product_list = document.getElementById("product_list");
    const add_button = document.getElementById("add-button");
    const add_panel = document.getElementById("product-modal");
    const close_button = document.getElementById("modal-close");
    const form = document.getElementById("product-form");

    const res = await fetch("./shop_products");
    const products = await res.json();

    products.forEach(product =>{
        const add_product = document.createElement("div");
        add_product.classList.add("product-card")


        const has_discount = product.discount && product.discount > 0;
        const discounted_price = has_discount ? product.price - (product.price * product.discount) / 100 : product.price;

        add_product.innerHTML=`
            <div class="product-left">
                <button class="edit-button" data-id="${product.id}">✎</button>
                <img class="product-image" src="${product.img1_path}" alt="${product.product_name}">
                <div class="product-info">
                    <div class="product-name">${product.product_name}</div>
                    <div class="product-desc">${product.description}</div>
                    <div class="product-specs">${product.specifications}</div>
                </div>
            </div>
            <div class="product-stock">
                <button class="stock-button stock-minus" data-id="${product.id}">-</button>
                <span class="stock-count" id="stock-${product.id}">${product.stock}</span>
                <button class="stock-button stock-plus" data-id="${product.id}">+</button>
                <div class="product-price">
                ${
                    has_discount
                    ? `<span class="price-discounted">${discounted_price.toFixed(2)} kr.</span>
                       <span class="price-original">${product.price} kr.</span>
                       <span class="price-tag">-${product.discount}%</span>`
                    : `${product.price} kr.`
                }
                </div>
                <button class="delete-button" data-id="${product.id}">X</button>
            </div>
        `;

        product_list.appendChild(add_product);
    });


    product_list.addEventListener("click", async (e) => {
        if (e.target.classList.contains("stock-plus") || e.target.classList.contains("stock-minus")) {
            const id = e.target.dataset.id;
            const span = document.getElementById(`stock-${id}`);
            let current = parseInt(span.textContent);
            const change = e.target.classList.contains("stock-plus") ? 1 : -1;
            const new_stock = current + change;
    
            const updateRes = await fetch("./update_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, stock: new_stock })
            });
    
            if (updateRes.ok) {
                span.textContent = new_stock;
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
            }
        }
        if(e.target.classList.contains("delete-button")){
            const id = e.target.dataset.id;
            const span = document.getElementById(`stock-${id}`);

            const updateRes = await fetch("./delete_ware", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            if (updateRes.ok) {
                alert("Vare er blevet fjernet.");
                location.reload();
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
            }
        }
    });

    add_button.addEventListener("click", async (e) => {
        add_panel.style.display = "block";
    });

    close_button.addEventListener("click", async (e) => {
        add_panel.style.display = "none";
        document.getElementById("product-form").reset();
    });

    form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const form_data = new FormData(form);

        const updateRes = await fetch("./add_product",{
            method: "POST",
            body: form_data,
        });
        
            if (updateRes.ok) {
                alert("Vare er blevet tilføjet.");
                location.reload();
                document.getElementById("product-form").reset();
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
                document.getElementById("product-form").reset();
            }
    });

});



