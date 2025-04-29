    //creates the product list, for both child and parent products
    export function product_list_create(product, is_child = false) {
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
        const discounted_price = has_discount ? product.price - product.discount : product.price;
    
        //if product has discount add the discount element
        if (has_discount) {
            //creates span element for discounted price
            const discounted = document.createElement("span");
            //defines discounted class to work with css
            discounted.className = "price-discounted";
            //define discounted price in kr. using former caluclation variable and limiting the discounted price to two decimals
            discounted.textContent = `${discounted_price} kr.`;
    
            //create span element for original price
            const original = document.createElement("span");
            //define originals class to work with css
            original.className = "price-original";
            //define the original price as kr
            original.textContent = `${product.price} kr.`;
    
            //create span element for the procentage discount
            const tag = document.createElement("span");
            //define class for css
            tag.className = "price-tag";
            //define discount amount and add - and % in front and end
            tag.textContent = `-${product.discount} kr.`;
    
            // append these features
            price_container.append(discounted, original, tag);
        } 
        //if not discount only append original price
        else {
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



//on page load this function is called
document.addEventListener("DOMContentLoaded", async () =>{
    //defining list of variables connected to elements in html
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
    const shop_name = document.getElementById("shop-name");
    const logo_panel = document.getElementById("logo-modal");
    const logo_form = document.getElementById("logo-form");
    const logo_close_button = document.getElementById("logo-modal-close");



    //get shop name
    const shop_name_res = await fetch("./shop_name");
    const shop_info = await shop_name_res.json();
    
    // setup shop name and logo:
    // Set shop name
    shop_name.textContent = shop_info.shop_name;
    // Set logo
    const logo = document.getElementById("logo");
    logo.src = shop_info.img_path;
    //event listener for all button within the class header
    header.addEventListener("click", async (e) => {
        //checks if edit button is clicked and opens edit panel
        if (e.target.classList.contains("edit-button")) {
            //set the panel to visible
            logo_panel.style.display = "block";
        }
    });

    //close button for edit panel
    logo_close_button.addEventListener("click", async (e) => {
        //make edit panel invisible
        logo_panel.style.display = "none";
        //removes any data left in the panel
        logo_form.reset();
    });


    //add event listener for the update form, loooking after submit button
    logo_form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        //takes all data from the form
        const form_data = new FormData(logo_form);

        //sent all the form data to the update_product route and await updates
        const updateRes = await fetch("./update_logo",{
            method: "POST",
            body: form_data,
        });
        
            //if product is update sent approval alert and reload page, if not alert update error
            if (updateRes.ok) {
                alert("Logo er blevet opdateret.");
                location.reload();
            } else {
                alert("Kunne ikke opdatere logo.");
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

    //event listener when clicked for all buttons within the product list container
    product_list.addEventListener("click", async (e) => {
        //check if button is plus or minus stock button
        if (e.target.classList.contains("stock-plus") || e.target.classList.contains("stock-minus")) {
            //defines id for product
            const id = e.target.dataset.id;
            //get current stock based on id
            const span = document.getElementById(`stock-${id}`);
            //define current stock as an int
            let current = parseInt(span.textContent);
            //define change, if stok button was clicked was plus, then change is 1 else -1
            const change = e.target.classList.contains("stock-plus") ? 1 : -1;
            //define new stock by current stock + change
            const new_stock = current + change;
    
            //call route, and send id and new_stock to route
            const updateRes = await fetch("./update_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, stock: new_stock })
            });
            
            //if route succes, change stock to new stock or sent an alert because of failure 
            if (updateRes.ok) {
                span.textContent = new_stock;
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
            }
        }
        //check if delete button is clicked
        if(e.target.classList.contains("delete-button")){
            //identify id for specific product to delete
            const id = e.target.dataset.id;

            //sent id to delete wares route
            const updateRes = await fetch("./delete_ware", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });

            //if item is deleted then sent alert and reload location, if not sent alert with error
            if (updateRes.ok) {
                alert("Vare er blevet fjernet.");
                location.reload();
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
            }
        }
        //check if edit button i clicked
        if (e.target.classList.contains("edit-button")) {
            //define id for specific product wanting edited
            const id = e.target.dataset.id;
            //searches through all products to check if product actually exists
            const product = products.find(p => String(p.id) === String(id));

            //if product does not exist alert that no product is found
            if (!product) {
                alert("Produkt ikke fundet.");
                return;
            }

            //define id for the product to update form (update form being the information for the product panel for the specific product)
            update_form.dataset.product_id = id;
        
            //make update panel visible
            update_panel.style.display = "block";

            //insert values into update panel/form based on information on the product, so name, stock, price, discount...
            document.getElementById("update-product-name").value = product.product_name || "";
            document.getElementById("update-product-stock").value = product.stock || 0;
            document.getElementById("update-product-price").value = product.price || 0;
            document.getElementById("update-product-discount").value = product.discount || 0;
            document.getElementById("update-product-desc").value = product.description || "";
            document.getElementById("update-product-specs").value = product.specifications || "";

            //insert picture names for each product, based on each products 5 different image paths
            document.getElementById("current-img1-name").textContent =`Nuværende fil: ${product.img1_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img2-name").textContent =`Nuværende fil: ${product.img2_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img3-name").textContent =`Nuværende fil: ${product.img3_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img4-name").textContent =`Nuværende fil: ${product.img4_path?.split("/").pop() || "Ingen"}`;
            document.getElementById("current-img5-name").textContent =`Nuværende fil: ${product.img5_path?.split("/").pop() || "Ingen"}`;

        }

    });

    //add event listener for the update form, loooking after submit button
    update_form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        //takes all data from the form
        const form_data = new FormData(update_form);
        //defines product id in the form
        const product_id = update_form.dataset.product_id
        //if not product id is found, then it won proceed
        if (!product_id) {
            alert("Ingen produkt-ID fundet.");
            return;
        }

        //append id to the form_data
        form_data.append("id", product_id);

        //sent all the form data to the update_product route and await updates
        const updateRes = await fetch("./update_product",{
            method: "POST",
            body: form_data,
        });
        
            //if product is update sent approval alert and reload page, if not alert update error
            if (updateRes.ok) {
                alert("Vare er blevet opdateret.");
                location.reload();
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
            }

    });

    //listen after update close button, if close button is pressed, close down update panel and reset form
    update_close_button.addEventListener("click", () => {
        update_panel.style.display = "none";
        update_form.reset();
    });

    // if add button is clicked, show add panel
    add_button.addEventListener("click", async (e) => {
        add_panel.style.display = "block";
    });

    //if close button is clicked, close add panel
    close_button.addEventListener("click", async (e) => {
        add_panel.style.display = "none";
        document.getElementById("product-form").reset();
    });

    //wait for subit button click in the add product form/panel
    form.addEventListener("submit", async (e)=>{
        e.preventDefault();

        //define all data in the form
        const form_data = new FormData(form);

        //sent all data from the form to the route add_product
        const updateRes = await fetch("./add_product",{
            method: "POST",
            body: form_data,
        });
        
            //if product is added sent succes alert, reload page and reset the form to empty it for data, else sent failed error, and empty form for data
            if (updateRes.ok) {
                alert("Vare er blevet tilføjet.");
                location.reload();
                document.getElementById("product-form").reset();
            } else {
                alert("Kunne ikke opdatere lagerbeholdning.");
                document.getElementById("product-form").reset();
            }
    });

    // feature to make a list of parent products
    try{
        //call route parent_products, which makes a list of all products without a parent_id
        const parent_res = await fetch("./parent_products");
        const parent_products = await parent_res.json();

        //for each parent product
        parent_products.forEach(prod =>{
            //in the form add product, add an element for each parent element
            const option = document.createElement("option")
            //the value for each parent element is defined as the output
            option.value = prod.id;
            //and the name for each parent element is defined as the content
            option.textContent = prod.product_name;
            //append each element to the parent selector in the add product form
            parent_select.appendChild(option);
        });
    }
    //if there is an error with any parent product, define error
    catch (err) {
        console.error("Fejl ved hentning af parent produkter:", err);
    }
});