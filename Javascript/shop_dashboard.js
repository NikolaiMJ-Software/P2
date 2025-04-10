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
    const header = document.getElementById("header");


    //get shop name
    const shop_name_res = await fetch("./shop_name");
    const name = await shop_name_res.json();
    
    // Create and append the shop name
    const name_span = document.createElement("span");
    name_span.textContent = name.shop_name;
    header.appendChild(name_span);
    
    // Create and append the edit button
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.dataset.id = name.id; // Optional if you include shop id
    editButton.textContent = "✎";
    editButton.style.marginLeft = "10px"; // optional spacing
    
    header.appendChild(editButton);
    
    header.addEventListener("click", async (e) => {
        if (e.target.classList.contains("edit-button")) {
            const id = e.target.dataset.id;
            const product = products.find(p => String(p.id) === String(id));

            if (!product) {
                alert("Produkt ikke fundet.");
                return;
            }
        }
    });

    //get all products
    const res = await fetch("./shop_products");
    const products = await res.json();

    //make a list of products which does and does not have a parent ID
    const product_map = {};
    //append all products without a parent ID, and create a children list for each
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

    //creates the product list, for both child and parent products
    function product_list_create(product, is_child = false) {
        //define the list
        const list = document.createElement("div");
        //add html class product-card (defines its css)
        list.classList.add("product-card");
        //checks if input is a child, if so add a child-product class (defines its css)
        if (is_child) list.classList.add("child-product");
    
        //creates the left part of each product element (picture, name, description and specifications)
        const product_left = document.createElement("div");
        product_left.className = "product-left";
        //if its a child space it to the right
        if (is_child) {
            const spacer = document.createElement("span");
            spacer.style.marginLeft = "15px";
            product_left.appendChild(spacer);
        }
    
        //create edit button
        const editButton = document.createElement("button");
        editButton.className = "edit-button";
        editButton.dataset.id = product.id;
        editButton.textContent = "✎";
    
        //create image
        const image = document.createElement("img");
        image.className = "product-image";
        image.src = product.img1_path;
        image.alt = product.product_name;
    
        //create info element regarding product
        const info = document.createElement("div");
        info.className = "product-info";
    
        //insert product name
        const name = document.createElement("div");
        name.className = "product-name";
        name.textContent = product.product_name;
    
        //insert product description
        const desc = document.createElement("div");
        desc.className = "product-desc";
        desc.textContent = product.description;
    
        //insert product specifications
        const specs = document.createElement("div");
        specs.className = "product-specs";
        specs.textContent = product.specifications;
    
        //append the elements to the info and product_left to create the first part of the product showcasing
        info.append(name, desc, specs);
        product_left.append(editButton, image, info);
    
        //create new div stock, with the className product stock
        const stock = document.createElement("div");
        stock.className = "product-stock";
    
        //add minus button to the stock div
        const minus = document.createElement("button");
        minus.className = "stock-button stock-minus";
        minus.dataset.id = product.id;
        minus.textContent = "-";
    
        //add count to the stock div
        const count = document.createElement("span");
        count.className = "stock-count";
        count.id = `stock-${product.id}`;
        count.textContent = product.stock;
    
       //add + to the stock div
        const plus = document.createElement("button");
        plus.className = "stock-button stock-plus";
        plus.dataset.id = product.id;
        plus.textContent = "+";
    
        // make new div for the price container
        const price_container = document.createElement("div");
        price_container.className = "product-price";
    
        //define discount for the product, anc check if discount is over 0
        const has_discount = product.discount && product.discount > 0;
        //make the discount to a %
        const discounted_price = has_discount ? product.price - (product.price * product.discount) / 100 : product.price;
    
        //if product has discount add the discount element
        if (has_discount) {
            const discounted = document.createElement("span");
            discounted.className = "price-discounted";
            discounted.textContent = `${discounted_price.toFixed(2)} kr.`;
    
            const original = document.createElement("span");
            original.className = "price-original";
            original.textContent = `${product.price} kr.`;
    
            const tag = document.createElement("span");
            tag.className = "price-tag";
            tag.textContent = `-${product.discount}%`;
    
            price_container.append(discounted, original, tag);
        } else {
            price_container.textContent = `${product.price} kr.`;
        }
        
        //set up the delete button for the product with the designated product id
        const del = document.createElement("button");
        del.className = "delete-button";
        del.dataset.id = product.id;
        del.textContent = "X";
    
        //append all the inputs to the stock div, and append product_left and stock to the main div list
        stock.append(minus, count, plus, price_container, del);
        list.append(product_left, stock);
    
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
        const parent_res = await fetch("./parent_products");
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



