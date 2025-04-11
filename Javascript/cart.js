//The purpose of this file is to manage, display, and reserve wares in the cart client-side
//See routes_reserve for server-side reservation script

//Function to update last visit time
import { updateLastVisit } from './calculateDistance.js';

//Global array for product data from database
let products = [];

//Function that adds product cart
function add_to_cart(product_id) {

    //Check if valid input
    product_id = parseInt(product_id);
    if(!Number.isInteger(product_id)) {
        console.error("ugyldigt produkt id for tilføjelse til kurv");
    }

    //Adds the product to the cart (cookie)
    let cart = getCookie("products").split(",");
    if(!cart || cart[0] === "") {
        document.cookie = `products=${product_id}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    } else {
        cart.push(product_id);
        cart.sort();
        document.cookie = `products=${cart.join(",")}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    }

    console.log("Tilføjede produkt med id " + product_id + "til din kurv");
}

//Function that removes an item from cart
function remove_from_cart(product_id) {

    //Checks the current cart for the index of product with product_id
    let products = getCookie("products").split(",");
    let index = products.findIndex(check_number)
    function check_number(number) {
        return number == product_id;
    }

    //Removes the index by splicing the array, then replaces the old cart with the new one
    if(index === -1) {
        console.error("Indekset for produktet kunne ikke findes, så det kunne ikke fjernes fra din kurv");
    } else {
        products.splice(index, 1);
        document.cookie = `products=${products.join(",")};path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`;
        console.log("Fjernede produkt med id " + product_id + "fra din kurv");
    }
}

//Function to get a specific cookie (relevant for other functions, taken from internet)
function getCookie(cname) {
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

//End of cart functionality

//Start of cart.html functionality

//Function for filling data table for cart
function fill_table() {
    updateLastVisit(); // Update users last visit
    console.log("Filling table...");
    let total_cost = 0;
    //Gets cart data from the cookie, and check if the there even is data
    let data = getCookie("products")
    if (!data) {
        console.log("Could not load cart...");
        document.getElementById("total_cost").textContent = "Endelig pris: 0 kr.";
        return;
    }
    data = data.split(",").map(Number);
    //Gets the location of the element that new rows will go into
    const tableBody = document.querySelector("#cart tbody");
    //forEach function that fills each row with product data and button
    let past_product = null;
    data.forEach(product => {
        if(product === past_product) {
            let amount = parseInt(document.getElementById(product).textContent);
            amount++;
            document.getElementById(product).textContent = amount;
            total_cost += products[product-1].price;
            document.getElementById("total_cost").textContent = "Endelig pris: " + total_cost + " kr.";
        } else {
            //create new row
            let row = document.createElement("tr");

            
            //creates and fills product image element
            let image_element = document.createElement("td");
            let image = document.createElement("img");
            image.style.width = "100px";
            image.style.padding = "10px";

            image.src = products[product-1].img1_path;

            image_element.appendChild(image);




            //creates and fills product name element
            let name_element = document.createElement("td");
            name_element.textContent = products[product-1].product_name;

            //creates and fills quantity toggle
            let button_element = document.createElement("td");
            let remove_button = document.createElement("BUTTON");
            remove_button.className = "button_reserve";

            //creates and fills product price element
            let price_element = document.createElement("td");
            price_element.textContent = products[product-1].price;
            total_cost += products[product-1].price;

            // "-" element
            let minus = document.createElement("span");
            minus.textContent = "- ";

            // Quantity value
            let quantity = document.createElement("span");
            quantity.textContent = "1";
            quantity.setAttribute("id", product);

            // "+" element
            let plus = document.createElement("span");
            plus.textContent = " +";


            const Rydknap = document.createElement("button");
            Rydknap.className = "cart-remove-button";
            Rydknap.textContent = "X";
            
            Rydknap.onclick = () => {
                let amount = parseInt(document.getElementById(product).textContent);
                for(let i = 0; i < amount; i++) {
                    remove_from_cart(product);
                }
                const tableBody = document.querySelector("#cart tbody");
                tableBody.innerHTML = ""; 
                fill_table(); 
                document.getElementById("total_cost").textContent = "Endelig pris: " + total_cost + " kr."; 
            }
            
            const removeContainer = document.createElement("td");
            removeContainer.className = "remove-cell-wrapper";
            removeContainer.appendChild(Rydknap);
            
            row.appendChild(removeContainer);


            // Append to button
            remove_button.appendChild(minus);
            remove_button.appendChild(quantity);
            remove_button.appendChild(plus);

            //remove_button.setAttribute("id", product)
            remove_button.addEventListener("click", function (event) {
                const clickX = event.offsetX;
                const buttonWidth = this.clientWidth;
                if (clickX < buttonWidth / 3) {
                    adjust_table("-", product);
                } else if (clickX > (2 * buttonWidth) / 3) {
                    if(parseInt(quantity.textContent) < products[product-1].stock) {
                        adjust_table("+", product);
                    } else {
                        alert("Du kan ikke tilføje flerer varer til din kurv end butikken har på lager");
                    }
                }
            });
            //adds button to a element in the row
            button_element.appendChild(remove_button);

            //adds all elements as a child to the row, and the row as a child to the table
            row.appendChild(image_element);
            row.appendChild(name_element);
            row.appendChild(button_element);
            row.appendChild(price_element);
            row.appendChild(Rydknap);
            tableBody.appendChild(row);
            

            document.getElementById("total_cost").textContent = "Endelig pris: " + total_cost + " kr.";
            past_product = product;
        }
    });
}

//function to remove a product from cart, and refresh table
function adjust_table(action, product_id) {
    if(action === "-") {
        console.log("Removed product with id " + product_id);
        remove_from_cart(product_id);
    } else if(action === "+") {
        console.log("Added product with id " + product_id);
        add_to_cart(product_id);
    } else {
        console.log("Invalid action");
    }
    //resets table
    const tableBody = document.querySelector("#cart tbody");
    tableBody.innerHTML = "";
    fill_table();
}

//Add to cart button (for product page)
const button = document.getElementById("cart_button");
if(button != null) {
    button.addEventListener("click", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        let amount = parseInt(document.getElementById("quantity-value").textContent)
        let cart = getCookie("products").split(",").map(Number);
        let currently_in_cart = cart.filter(val => val === productId).length;
        if(currently_in_cart + amount <= products[productId-1].stock) {
            for(let i=0; i<amount; i++) {
                add_to_cart(productId);
                console.log(i);
            }
            alert("Din vare(er) er tilføjet til kurven");
        } else {
            alert("Du kan ikke tilføje flere varer til din kurv end der er antal på lager");
        }
    });
}

//Reserve wares button (for cart page)
const button_reserve = document.getElementById("Confirm_button");
if(button_reserve != null) {
    button_reserve.addEventListener("click", reserve_wares);
}
async function reserve_wares() {
    if(window.getComputedStyle(document.getElementById("login")).display != "none") {
        alert("du skal være logget ind for at kunne reservere");
    }else {
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

        console.log("Sending sorted cart:", sorted_cart);

        const response = await fetch('./reserve_wares', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ cart: sorted_cart })
        });
        const final_response = await response;
        console.log(final_response.json());
    }
}

async function check_readiness() {
    console.log("Fetching product data...");
    const response = await fetch('./products'); // Fetch products from the server
    products = await response.json();  // Ensure products is fetched before using it

    function startUp() {
        console.log("Page loaded");
        let data = getCookie("products");
        console.log(data);
        fill_table();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startUp);
    } else {
        startUp();  // If already loaded, run immediately
    }
}
if(document.getElementById("cart") != null) {
    check_readiness();
}
//End of cart.html functionality