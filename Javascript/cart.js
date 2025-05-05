//The purpose of this script is to managage, showcase, and reserve the product cart client-side
//The actual reservation is done server-side in routes_reserve.js

//Function used to keep track since user was last active
import { updateLastVisit } from './calculate_distance.js';

//Global array for imported product data
let products = [];

//Function that adds a product to the cart
export function add_to_cart(product_id) {

    //Verify input of product_id
    product_id = parseInt(product_id);
    if(!Number.isInteger(product_id)) {
        console.error("Ugyldig produkt id til tilføjelse til kurv");
    }

    //Add product with id to the current cart (or make a new cart if none exist)
    let cart = getCookie("products").split(",");
    if(!cart || cart[0] === "") {
        document.cookie = `products=${product_id}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    } else {
        cart.push(product_id);
        cart.sort();
        document.cookie = `products=${cart.join(",")}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    }
    console.log("Tilføjede produkt med id " + product_id + " til din kurv");
}

//Function that removes a product from the cart
export function remove_from_cart(product_id) {

    //Gets the current cart and finds index for specified product id
    let products = getCookie("products").split(",");
    let index = products.findIndex(check_id);
    function check_id(current_id) {
        return current_id == product_id;
    }

    //If a index could be found, remove the index from the cart
    if(index === -1) {
        console.error("Produktet med id " + product_id + " kunne ikke findes i din kurv");
    } else {
        products.splice(index, 1);
        document.cookie = `products=${products.join(",")};path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`;
        console.log("Fjernede produkt med id " + product_id + " fra din kurv");
    }
}

//Updates cart button number that showcases amount of wares in cart
export function update_cart_button() {
    let length = getCookie("products").split(",").length;
    if(length === 1 && getCookie("products").split(",")[0] === "") {
        length = 0;
    }
    console.log("length: " + length);
    document.getElementById("cart_top_button").textContent = "Din kurv (" + length + ")"
}

//Function to get a specific cookie (relevant for other functions) **taken from internet**
export function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}


//Function for filling the cart table (used in cart.html)
function fill_table() {

    //Setting up variables and checks if the cart is available
    let total_cost = 0;
    let past_product = null;
    const table_body = document.querySelector("#cart tbody");
    let data = getCookie("products").split(",").map(Number);
    document.getElementById("total_cost").textContent = "Endelig pris: 0 kr.";
    if (!data) {
        console.log("Kunne ikke finde din kurv, har du tilføjet varer til den?");
        return;
    }
    console.log("Udfylder tabel med dine varer...");

    //Goes through each product and adds them to the table
    data.forEach(product => {

        //Increases quantity value instead of adding new row if product already has a row
        if(product === past_product) {
            let amount = parseInt(document.getElementById(product).textContent);
            amount++;
            document.getElementById(product).textContent = amount;

            let product_price = parseInt(document.getElementById(product + "price").textContent);
            product_price += products[product-1].price - products[product-1].discount;
            document.getElementById(product + "price").textContent = product_price;
            
            total_cost += products[product-1].price - products[product-1].discount;
            document.getElementById("total_cost").textContent = "Endelig pris: " + total_cost + " kr.";
        } else {

            //Creates a new row in the table
            let row = document.createElement("tr");

            //Creates and fills first column in the row (picture of product)
            let image_element = document.createElement("td");
            let image = document.createElement("img");
            image.setAttribute("id", "pictures");
            image.src = products[product-1].img1_path;
            image_element.appendChild(image);
            row.appendChild(image_element);

            //Creates and fills second column in the row (name of product)
            let name_element = document.createElement("td");
            name_element.textContent = products[product-1].product_name;
            row.appendChild(name_element);

            //Creates and fills third column in the row (button to show & change quantity)
            let button_element = document.createElement("td");
            let quantity_button = document.createElement("BUTTON");
            quantity_button.className = "button_reserve";

            //Adds text "-n+"" within the quantity button to showcase quantity and indicate quantity changing function
            let minus = document.createElement("span");
            minus.textContent = "- ";
            let quantity = document.createElement("span");
            quantity.textContent = "1";
            quantity.setAttribute("id", product);
            let plus = document.createElement("span");
            plus.textContent = " +";
            quantity_button.appendChild(minus);
            quantity_button.appendChild(quantity);
            quantity_button.appendChild(plus);

            //Adds event listener for clicking button that changes quantity depending on where you click
            quantity_button.addEventListener("click", function (event) {
                const rect = this.getBoundingClientRect();
                const clickX = event.clientX - rect.left;
                const buttonWidth = this.clientWidth;
                if (clickX < buttonWidth / 3) {
                    adjust_table("-", product);
                } else if (clickX > 2/3 * buttonWidth) {
                    if(parseInt(quantity.textContent) < products[product-1].stock) {
                        adjust_table("+", product);
                    } else {
                        alert("Du kan ikke tilføje flerer varer til din kurv end butikken har på lager");
                    }
                }
            });

            //Attaches the quantity button to the column, and column to the row
            button_element.appendChild(quantity_button);
            row.appendChild(button_element);

            //Creates and fills the fourth column in the row (price of product)
            let price_element = document.createElement("td");
            price_element.setAttribute("id", product + "price");
            price_element.textContent = products[product-1].price - products[product-1].discount;
            total_cost += products[product-1].price - products[product-1].discount;
            row.appendChild(price_element);

            //Creates and fills the fifth column in the row (button to remove all instances of product from cart)
            let remove_element = document.createElement("td");
            let remove_button = document.createElement("button");
            remove_button.className = "cart-remove-button";
            remove_button.textContent = "X";
            
            //Add event listener that removes all instances of the product and refreshes table on click
            remove_button.onclick = () => {
                let amount = parseInt(document.getElementById(product).textContent);
                for(let i = 0; i < amount; i++) {
                    remove_from_cart(product);
                }
                const table_body = document.querySelector("#cart tbody");
                table_body.replaceChildren();
                fill_table();
                document.getElementById("total_cost").textContent = "Endelig pris: " + total_cost + " kr."; 
            } 

            //Attaches the remove button to the column, and column to the row
            remove_element.appendChild(remove_button);
            row.appendChild(remove_element);
            
            //Updates variables and attaches the row to the main table
            document.getElementById("total_cost").textContent = "Endelig pris: " + total_cost + " kr.";
            past_product = product;
            table_body.appendChild(row);
        }
    });
}

//Function to edit cart and refresh cart table (used cart.html)
function adjust_table(action, product_id) {
    if(action === "-") {
        remove_from_cart(product_id);
    } else if(action === "+") {
        add_to_cart(product_id);
    } else {
        console.log("Ugyldig input til adjust_table");
    }
    const table_body = document.querySelector("#cart tbody");
    table_body.replaceChildren();
    fill_table();
}

//Button that adds a product to your cart on click (used in product_page.html)
const button = document.getElementById("cart_button");
if(button != null) {
    button.addEventListener("click", async () => {

        //Gets the id from the url, and amount from quantity selector
        const url_parameters = new URLSearchParams(window.location.search);
        const product_id = parseInt(url_parameters.get('id'));
        let amount = parseInt(document.getElementById("quantity-value").textContent)

        //Checks cart if the added products + products in cart exceed store stock, if not, add to cart
        let cart = getCookie("products").split(",").map(Number);
        let currently_in_cart = cart.filter(val => val === product_id).length;

        if (products[product_id-1].stock === 0){
            alert("Varen er ikke på lager");
        }else if(currently_in_cart + amount <= products[product_id-1].stock && products[product_id-1].stock > 0) {
            for(let i = 0; i < amount; i++) {
                add_to_cart(product_id);
            }
            alert("Din vare(er) er tilføjet til kurven");
            update_cart_button();
        }else {
            alert("Du kan ikke tilføje flere varer til din kurv end der er antal på lager");
        }
    });
}

//Button that sends reservation data to the server (used in cart.html)
const button_reserve = document.getElementById("Confirm_button");
if(button_reserve != null) {
    button_reserve.addEventListener("click", async () => {

        //Gets the cart, and sorts the products into sub-arrays based on which store they belong to
        let cart = getCookie("products").split(",").map(Number);
        if (cart.length === 0) {
            alert("Kurven er tom!");
            return;
        }
        let sorted_cart = {};
        for (let i = 0; i < cart.length; i++) {
            let product_id = cart[i];
            let shop_id = products[product_id-1].shop_id;
            if (!sorted_cart[shop_id]) {
                sorted_cart[shop_id] = [];
            }
            sorted_cart[shop_id].push(product_id);
        }

        //Asks user for a reservation email if user is not logged in
        let user_email = null;
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(window.getComputedStyle(document.getElementById("login")).display != "none") {
            user_email = prompt("Hvilken email skal reservationen sendes til?","Din email her");
            if(!email_regex.test(user_email)) {
                alert("Ugyldig email");
                return;
            }
            //Checks if email is already used for an account
            const email_account_response = await fetch('./email_status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: user_email })
            });
            const email_account = await email_account_response.json();
            if(email_account.exists) {
                alert("Fejl: email er allerede brugt af en konto");
                return;
            }

            //Sends signal to server to generate email verification key
            const generate_key_response = await fetch('./generate_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: user_email })
            });
            const generated_key = await generate_key_response.json();
            if(!generated_key.success == true){
                alert("Kunne ikke generere nøgle til din email, hvis du lige har genereret en nøgle, så vendt 5 minutter og prøv igen");
                return;
            }

            //Makes the authentication box visible
            let auth_box = document.getElementById("authentication_box");
            auth_box.style.display = "flex";
            document.getElementById("auth_submit").onclick = async function() {
                let input = document.querySelector("#authentication_box input");
                let key = input.value;

                //Asks for the key sent over email before and verifies with server
                const response_1 = await fetch('./authenticate_email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ email: user_email, key: key, cart: sorted_cart })
                });
                const auth_response = await response_1.json();
                console.log(auth_response);
    
                //If verification was successful, email would also have been sent
                if(auth_response.success){
                    auth_box.style.display = "none";
                    input.value = "";
                    alert("Du har nu reserveret dine varer, check din email");
                    document.cookie = `products=;path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`;
                    const table_body = document.querySelector("#cart tbody");
                    table_body.replaceChildren();
                    fill_table();
                    return;
                }

                //Makes alert if reservation was unsuccessful
                auth_box.style.display = "none";
                input.value = "";
                alert("Kunne ikke reservere varen, da autentiseringen fejlede");
                return;
            }
            return;
        }
    
        //Sends the sorted cart server-side for it to send reservation email (see routes_reserve.js for server-side)
        console.log("Sender sorteret kurv:", sorted_cart);
        const response = await fetch('./reserve_wares', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ cart: sorted_cart })
        });
        const reserve_response = await response.json();
        console.log(reserve_response);
        if (reserve_response.success) {
          alert("Du har nu reserveret dine varer, check din email");
          document.cookie = `products=;path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`;
          const table_body = document.querySelector("#cart tbody");
          table_body.replaceChildren();
          fill_table();
        } else {
          alert("Reservationen fejlede, prøv igen senere.");
        }
    });
}

//Starting up function for all pages this script is used in
(async function(){

    //Update timestamp for last visit
    updateLastVisit();

    //If on searchPage.html or product_page.html, update the cart button to show number of wares
    window.addEventListener('pageshow', () => {
        if(document.getElementById("filterButton") != null || document.getElementById("shop_name_button") != null) {
            update_cart_button();
        }
    });

    //If on product_page.html or cart.html, load the product database
    if(document.getElementById("shop_name_button") != null || document.getElementById("cart") != null) {
        console.log("Henter produkt data...");
        const response = await fetch('./products');
        products = await response.json();
    }

    //If on cart.html, add event listener for ready state if not loaded, otherwise just start up
    if(document.getElementById("cart") != null) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", start_up);
        } else {
            start_up();
        }
        function start_up() {
            console.log("nuværende kurv: " + getCookie("products"));
            fill_table();
        }
    }
})();