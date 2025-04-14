async function changesInProducts(order_id){
    /*
    * After product has been reserved its oploadet to ad DB with a id, this id is includet in the following link
    * Sends a mail with an button (includeig a link), can say "Kunden har hentet produkter"
    * If user click on link, redirect to "./user/email/{code}/id/confirm"
            * Can use: "UUID.randomUUID().toString()" for the code
        * Then this function run "changesInProducts"
        * Go into the DB and find the id's product and then run the rest of the function
        * NOW the page show the user: "Det er blevent rigisteret, nu må du lukke vinduet"
    */

    const responsOrders = await fetch('./orders');
    const orders = await responsOrders.json();

    // Update DB based on the order
    for (const order of orders){    
        // GO to the next order, if order_id don't match
        if (order.order_id !== order_id){
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
        const updateStock = await fetch("./mail_stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: '1234', 
                id, 
                stock: new_stock })
        })

        // Update bought
        const updateBought = await fetch("./mail_bought", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                password: '1234',
                id, 
                bought: new_bought })
        });

        // Update revenue
        const updateRevenue = await fetch("./mail_revenue", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                password: '1234',
                shop_id, 
                revenue: new_revenue })
        });

        // Check if the opdates is successful
        if (updateStock.ok) {
            console.log('Opdatere stock');
        } else {
            alert("Kunne ikke opdatere: stock.");
        }

        if (updateBought.ok) {
            console.log('Opdatere bought');
        } else {
            alert("Kunne ikke opdatere: bought.");
        }

        if (updateRevenue.ok) {
            console.log('Opdatere revenue');
        } else {
            alert("Kunne ikke opdatere revenue.");
        }
    }
}

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
        price })
})