import { stringify } from "querystring";

//Makes a path to the current database (which can't be directly interacted with)
const db_path = path.join(process.cwd(), 'databases', 'click_and_collect.db');

//Makes a new database with data from the current database (which can be interacted with)
const db = new sqlite3.Database(db_path, (err) => {
    if (err) return console.error('Reserve DB error:', err.message);
    console.log('Connected to SQLite database (reserve router).');
    db.run("PRAGMA foreign_keys = ON;");
});

//Start of cart functionality
//Function that adds product to item cart which is stored in cookies
export function add_to_cart(product_id) {
    //Check if product_id is a number
    if(!Number.isInteger(product_id)) {
        console.error("Invalid product id for adding to cart");
    }
    //Get the cookies
    let products = getCookie("products");
    //Make a new cookie if this is the first item in the cart, otherwise add to existing cart
    if(!products) {
        document.cookie = `products=${product_id}`
    } else {
        products += ',' + stringify(product_id);
        document.cookie = `products=${products}`
    }
}

//Function that removes an item from the cart
export function remove_from_cart(product_id) {
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
        document.cookie = `products=${array.join(",")}`;
    }
}
//End of cart functionality

//Start of cart.html functionality

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("TEST");
        let data = getCookie("products").split(",").map(Number);
        const tableBody = document.querySelector("#cart tbody");
        data.forEach(product => {
            let remove_button = document.createElement("BUTTON");
            remove_button.setAttribute("id", product)
            let row = document.createElement("tr");
            row.innerHTML =
            `<td>${db.get(`SELECT product_name FROM products WHERE id = ?`, [product])}</td>
            <td>${db.get(`SELECT price FROM products WHERE id = ?`, [product])}</td>
            <td>${remove_button}</td>`;
            tableBody.appendChild(row);
        });
    }
    catch(error){
        console.error("There was a problem loading your cart", error);
    }
});

//End of cart.html functionality