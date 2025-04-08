//Start of cart functionality

let products = [];

let total_cost = 0;
//Function that adds product to item cart which is stored in cookies
function add_to_cart(product_id) {
    product_id = parseInt(product_id);
    //Check if product_id is a number
    if(!Number.isInteger(product_id)) {
        console.error("Invalid product id for adding to cart");
    }
    //Get the cookies
    let products = getCookie("products").split(",");
    //Make a new cookie if this is the first item in the cart, otherwise add to existing cart
    if(!products || products[0] === "") {
        document.cookie = `products=${product_id}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    } else {
        products.push(product_id);
        products.sort();
        document.cookie = `products=${products.join(",")}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    }
    console.log(products);
}

//Function that removes an item from the cart
function remove_from_cart(product_id) {
    //Get the cookies and split them into an array of strings for the product id's
    let products = getCookie("products").split(",");
    //Find the index that makes the function check_number return true
    let index = products.findIndex(check_number)
    //Returns true if number (string) is the same as product_id (integer)
    function check_number(number) {
        return number == product_id;
    }
    //Runs if findIndex could not find a index
    if(index === -1) {
        console.error("The product could not be found in the cart");
    } else {
        //remove the element with the correct index and replaces the cookie with the new product list
        products.splice(index, 1);
        document.cookie = `products=${products.join(",")};path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`;
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
    console.log("Filling table...");
    total_cost = 0;
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

            //creates and fills product name element
            let name_element = document.createElement("td");
            name_element.textContent = products[product-1].product_name;

            //creates and fills product price element
            let price_element = document.createElement("td");
            price_element.textContent = products[product-1].price;
            total_cost += products[product-1].price;

            //creates and fills quantity toggle
            let button_element = document.createElement("td");
            let remove_button = document.createElement("BUTTON");
            remove_button.setAttribute("class", button_reserve);

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
                } else if (clickX > (2 * buttonWidth) / 3 && parseInt(quantity.textContent) < products[product].stock) {
                    adjust_table("+", product);
                }
            });
            //adds button to a element in the row
            button_element.appendChild(remove_button);

            //adds all elements as a child to the row, and the row as a child to the table
            row.appendChild(name_element);
            row.appendChild(price_element);
            row.appendChild(button_element);
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
        const productId = urlParams.get('id');
        let amount = parseInt(document.getElementById("quantity-value").textContent)
        for(let i=0; i<amount; i++) {
            add_to_cart(productId);
            console.log(i);
        }
        alert("Din vare(er) er tilføjet til kurven");
    });
}

//Reserve wares button (for cart page)
const button_reserve = document.getElementById("Confirm_button");
if(button_reserve != null) {
    button_reserve.addEventListener("click", reserve_wares);
}
function reserve_wares() {
    if(window.getComputedStyle(document.getElementById("login")).display != "none") {
        alert("du skal være login for at kunne reservere vare");
    }else {
        let cart = getCookie("products").split(",").map(Number);
        if (cart.length === 0) {
            alert("Kurven er tom!");
            return;
        }
        let sorted_cart = {};
        for (let i = 0; i < cart.length; i++) {
            let product_id = cart[i];
            let shop_id = products[product_id].shop_id;
            if (!sorted_cart[shop_id]) {
                sorted_cart[shop_id] = [];
            }
            sorted_cart[shop_id].push(product_id);
        }

        console.log("Sending sorted cart:", sorted_cart);

        fetch('./reserve_wares', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ cart: sorted_cart })
        });
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