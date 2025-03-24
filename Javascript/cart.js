import { stringify } from "querystring";

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
        products +',' + stringify(product_id);
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
        document.cookie = `products=${array.join(",")}; path=/; max-age=86400`;
    }
}
//End of cart functionality