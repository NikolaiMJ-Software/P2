document.addEventListener('DOMContentLoaded', async () => {
    // Collect the code and id from URL
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));
    const code = params.get('code');

    // If id and code is found, update DB
    if (id && code) {
        console.log('Opdater DB...');
        await changesInProducts(id, code);
    } else {
        console.error('ID eller code ikke fundet i URL');
    }
});

async function changesInProducts(order_id, code){
    /*
    * After product has been reserved its oploadet to ad DB with a id, this id is includet in the following link
    * Sends a mail with an button (includeig a link), can say "Kunden har hentet produkter"
    * If user click on link, redirect to "./user/email/{code}/{id}/confirm"
            * Can use: "crypto.randomUUID();" for the code
        * Then this function run "changesInProducts"
        * Go into the DB and find the id's product and then run the rest of the function
        * NOW the page show the user: "Det er blevent rigisteret, nu må du lukke vinduet"
    */
    // Fetching orders from DB
    const responsOrders = await fetch('./orders');
    const orders = await responsOrders.json();

    // Update DB based on the order
    for (const order of orders){    
        // Go to the next order, if order_id and code don't match
        if (order.order_id !== order_id || order.code !== code) {
            continue;
        }
    
        // Changes form mail
        const id = order.product_id; // The product;
        const change = order.amount; // amount
        const price = order.price; // price for the product
        const shop_id = order.shop_id;

        // The database update "revenue" and "bought" based on the confirmation
        const responseProducts = await fetch('./products'); // Fetch products from the server
        const products = await responseProducts.json();
        const product = products.find(p => p.id === id); // Find the products

        if (!product) {
            return alert("Produkt ikke fundet");
        }

        // Calc new values
        const new_stock = product.stock - change;
        const new_bought = product.bought + change;
        const new_revenue = change * price;
        
        // See changes
        console.log("Before changes:", product);
        console.log("After changes:", {
            stock: new_stock,
            bought: new_bought,
            revenue: new_revenue
        });

        // Update stock
        await fetch("./mail_stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: '1234', 
                id, 
                stock: new_stock })
        })

        // Update bought
        await fetch("./mail_bought", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                password: '1234',
                id, 
                bought: new_bought })
        });

        // Update revenue
        await fetch("./mail_revenue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                password: '1234',
                shop_id: shop_id, 
                revenue: new_revenue })
        });
    }

    // Add task complete to users website
    const h1 = document.createElement("h1");
    h1.textContent = "Det er blevent rigisteret, nu må du lukke vinduet";
    document.getElementById("message").appendChild(h1);
}

/*
const code = crypto.randomUUID();

// Update orders
const updateStock = await fetch("./mail_order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        password: '1234', 
        shop_id, 
        order_id,
        product_id, 
        amount,
        price,
        code })
})
*/