document.addEventListener("DOMContentLoaded", async () =>{
    const product_list = document.getElementById("product_list");
    const add_button = document.getElementById("add-button");
    const add_panel = document.getElementById("product-modal");
    const close_button = document.getElementById("modal-close");
    const form = document.getElementById("product-form");
    const update_panel = document.getElementById("update-product-modal");
    const update_close_button = document.getElementById("update-modal-close");
    const update_form = document.getElementById("update-form");
    const parent_select = document.getElementById("parent-product");

    const res = await fetch("./shop_products");
    const products = await res.json();

    //make a list of products which does and does not have a parent ID
    const product_map = {};
    //append all products without a parent ID
    products.forEach(product => {
        if (!product.parent_id) {
            product_map[product.id] = { ...product, children: [] };
        }
    });
    
    //append all products with parent id to the designated parent product
    products.forEach(product => {
        if (product.parent_id && product_map[product.parent_id]) {
            product_map[product.parent_id].children.push(product);
        }
    });

    //call the product_list_create function for each parent and child in the list
    Object.values(product_map).forEach(parent_product => {
        const parent_card = product_list_create(parent_product);
        product_list.appendChild(parent_card);
    
        parent_product.children.forEach(child => {
            const child_card = product_list_create(child, true);
            product_list.appendChild(child_card);
        });
    });

    //creates the product list, both parents and children
    function product_list_create(product, is_child = false) {
        //creates html variable for designated product
        const list = document.createElement("div");
        list.classList.add("product-card");
        //if product is a child, then add a child to the list
        if (is_child) list.classList.add("child-product");
    
        //checks if product has discount, and if its over 0
        const has_discount = product.discount && product.discount > 0;
        //defines how much discount a product has in % 
        const discounted_price = has_discount ? product.price - (product.price * product.discount) / 100 : product.price;
    
        //inserts the product, and checks if there is discount, and if the product is a child or not
        list.innerHTML = `
            <div class="product-left">
                ${is_child ? '<span style="margin-left: 15px;"></span>' : ''}
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
    
        return list;
    }

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

        if (e.target.classList.contains("edit-button")) {
            const id = e.target.dataset.id;
            const product = products.find(p => String(p.id) === String(id));

            if (!product) {
                alert("Produkt ikke fundet.");
                return;
            }

            update_form.dataset.product_id = id;
        
            update_panel.style.display = "block";

            document.getElementById("update-product-name").value = product.product_name || "";
            document.getElementById("update-product-stock").value = product.stock || 0;
            document.getElementById("update-product-price").value = product.price || 0;
            document.getElementById("update-product-discount").value = product.discount || 0;
            document.getElementById("update-product-desc").value = product.description || "";
            document.getElementById("update-product-specs").value = product.specifications || "";


            document.getElementById("current-img1-name").textContent =`Nuværende fil: ${product.img1_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img2-name").textContent =`Nuværende fil: ${product.img2_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img3-name").textContent =`Nuværende fil: ${product.img3_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img4-name").textContent =`Nuværende fil: ${product.img4_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img5-name").textContent =`Nuværende fil: ${product.img5_path?.split("/").pop() || "Ingen"}`;

        }

    });

    update_form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        const form_data = new FormData(update_form);
        const product_id = update_form.dataset.product_id

        if (!product_id) {
            alert("Ingen produkt-ID fundet.");
            return;
        }

        form_data.append("id", product_id);

        const updateRes = await fetch("./update_product",{
            method: "POST",
            body: form_data,
        });
        
            if (updateRes.ok) {
                alert("Vare er blevet opdateret.");
                location.reload();
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
            }

    });

    update_close_button.addEventListener("click", () => {
        update_panel.style.display = "none";
        update_form.reset();
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

    try{
        const parent_res = await fetch("/parent_products");
        const parent_products = await parent_res.json();

        parent_products.forEach(prod =>{
            const option = document.createElement("option")
            option.value = prod.id;
            option.textContent = prod.product_name;
            parent_select.appendChild(option);
        });
    }catch (err) {
        console.error("Fejl ved hentning af parent produkter:", err);
    }
});



