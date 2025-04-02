//Start of cart functionality
//Function that adds product to item cart which is stored in cookies
function add_to_cart(product_id) {
    product_id = parseInt(product_id);
    //Check if product_id is a number
    if(!Number.isInteger(product_id)) {
        console.error("Invalid product id for adding to cart");
    }
    //Get the cookies
    let products = getCookie("products");
    console.log(products);
    //Make a new cookie if this is the first item in the cart, otherwise add to existing cart
    if(!products) {
        document.cookie = `products=${product_id}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    } else {
        products += ',' + product_id;
        document.cookie = `products=${products}; path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`
    }
}

//Function that removes an item from the cart
function remove_from_cart(product_id) {
    //Get the cookies and split them into an array of strings for the product id's
    let array = getCookie("products").split(",");
    //Find the index that makes the function check_number return true
    let index = array.findIndex(check_number)
    //Returns true if number (string) is the same as product_id (integer)
    function check_number(number) {
        return number == product_id;
    }
    //Runs if findIndex could not find a index
    if(index === -1) {
        console.error("The product could not be found in the cart");
    } else {
        //remove the element with the correct index and replaces the cookie with the new product list
        array.splice(index, 1);
        document.cookie = `products=${array.join(",")};path=/; domain=cs-25-sw-2-06.p2datsw.cs.aau.dk;`;
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
//Fetch product data from database
console.log("Fetching product data...");
const response = await fetch('./products'); // Fetch products from the server
const products = await response.json();

//Function for filling data table for cart
function fill_table() {
    console.log("Filling table...");
    //Gets cart data from the cookie, and check if the there even is data
    let data = getCookie("products")
    if (!data) {
        console.log("Could not load cart...");
        return;
    }
    data = data.split(",").map(Number);
    //Gets the location of the element that new rows will go into
    const tableBody = document.querySelector("#cart tbody");
    //forEach function that fills each row with product data and button
    data.forEach(product => {
        //creates row
        let row = document.createElement("tr");

        //creates and fills product name element
        let name_element = document.createElement("td");
        name_element.textContent = products[product].product_name;

        //creates and fills product price element
        let price_element = document.createElement("td");
        price_element.textContent = products[product].price;

        //creates preset button to remove product from cart, 
        let button_element = document.createElement("td")
        let remove_button = document.createElement("BUTTON");
        remove_button.textContent = "Remove";
        remove_button.addEventListener("click", () => remove_from_table(product));
        //adds button to a element in the row
        button_element.appendChild(remove_button);

        //adds all elements as a child to the row, and the row as a child to the table
        row.appendChild(name_element);
        row.appendChild(price_element);
        row.appendChild(button_element);
        tableBody.appendChild(row);
    });
}

//function to remove a product from cart, and refresh table
function remove_from_table(product_id) {
    console.log("Removed product with id " + product_id)
    //removes product from cookie cart
    remove_from_cart(product_id);
    //resets table
    const tableBody = document.querySelector("#cart tbody");
    tableBody.innerHTML = "";
    //fills table again
    fill_table();
}

//Add to cart button (for product page)
const button = document.getElementById("cart_button");
if(button != null) {
    button.addEventListener("click", async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        add_to_cart(productId);
        alert("Varen er tilføjet til din kurv");
    });
}

//Reserve wares button (for cart page)
const button_reserve = document.getElementById("Confirm_button");
if(button_reserve != null) {
    button_reserve.addEventListener("click", reserve_wares);
}
function reserve_wares() {
    let cart = getCookie("products").split(",").map(Number);
    let sorted_cart = {};
    for (let i = 0; i < cart.length; i++) {
        let product_id = cart[i];
        let shop_id = products[product_id].shop_id;
        if (!sorted_cart[shop_id]) {
            sorted_cart[shop_id] = [];
        }
        sorted_cart[shop_id].push(product_id);
    }

    console.log("Sending sorted_cart:", sorted_cart);

    fetch('/reserve_vares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: sorted_cart })
    });
}

//Function that starts automatically fills the table when site has loaded
while(1) {
    if (document.readyState !== 'loading') {
        let data = getCookie("products");
        console.log(data);
        fill_table();
        break;
    }
}
//End of cart.html functionality