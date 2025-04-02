document.addEventListener("DOMContentLoaded", async () =>{
    const product_list = document.getElementById("product_list");

    const res = await fetch("./shop_products");
    const products = await res.json();

    products.forEach(product =>{
        const add_product = document.createElement("div");
        add_product.classList.add("product-card")

        add_product.innerHTML=`
            <div class="product-left">
                <img class="product-image" src="${product.img1_path}" alt="${product.product_name}">
                <div class="product-info">
                    <div class="product-name">${product.product_name}</div>
                    <div class="product-desc">${product.description}</div>
                </div>
            </div>
            <div class="product-stock">
                <button class="stock-button stock-minus" data-id="${product.id}">-</button>
                <span class="stock-count" id="stock-${product.id}">${product.stock}</span>
                <button class="stock-button stock-plus" data-id="${product.id}">+</button>
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

            const updateRes = await fetch("/delete_ware", {
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

});



