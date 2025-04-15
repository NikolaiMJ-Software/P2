document.addEventListener('DOMContentLoaded', async () => {
    // Collect the code and id from URL
    const params = new URLSearchParams(window.location.search);
    const order_id = Number(params.get('id'));
    const code = params.get('code');

    // If order_id and code is found, update DB
    if (order_id && code) {
        console.log('Opdater DB...');
        await changesInProducts(order_id, code);
    } else {
        console.error('order_id eller code ikke fundet i URL');
    }
});

async function changesInProducts(id, code){
    // Fetching orders from DB
    const responsOrders = await fetch('./orders');
    const orders = await responsOrders.json();

    // Update DB based on the order
    for (const order of orders){    
        // Go to the next order, if order_id and code don't match
        if (order.id !== id || order.code !== code) {
            continue;
        }
        
        const shop_id = order.shop_id;

        // Changes from mail
        for (const orderProduct of order.products) {
            const product_id = orderProduct.product_id; // The product;
            const change = orderProduct.amount; // Amount
            const price = orderProduct.price; // Price for the product

            // The database update "revenue" and "bought" based on the confirmation
            const responseProducts = await fetch('./products'); // Fetch products from the server
            const products = await responseProducts.json();
            const product = products.find(p => p.product_id === product_id); // Find the products

            if (!product) {
                console.error(`Produkt med ID ${product_id} ikke fundet`);
                continue; // Skip to the next product in the order
            }

            // Calc new values
            const new_stock = product.stock - change;
            const new_bought = product.bought + change;
            const new_revenue = product.revenue + (change * price);
            
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
                    product_id, 
                    stock: new_stock })
            })

            // Update bought
            await fetch("./mail_bought", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    password: '1234',
                    product_id, 
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
    }

    // Add task complete to users website
    const h1 = document.createElement("h1");
    h1.textContent = "Det er blevent rigisteret, nu må du lukke vinduet";
    document.getElementById("message").appendChild(h1);
}