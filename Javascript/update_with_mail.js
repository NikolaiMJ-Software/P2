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

    let selectedOrder = null;

    // Update DB based on the order
    for (const order of orders){
        // Go to the next order, if order_id and code don't match
        if (order.id !== id) {
            continue;
        }

        if (order.code !== `"${code}"`){
            alert('Ordre er allerede behandlet');
            break;
        }

        // Save current order
        selectedOrder = order;
        const shop_id = order.shop_id;
        const orderProducts = JSON.parse(JSON.parse(order.products)); // convert to an object

        let outOfStock = [];

        // Changes from mail
        for (const orderProduct of orderProducts) {
            const product_id = orderProduct.product_id; // The product;
            const change = orderProduct.amount; // Amount
            const price = orderProduct.price; // Price for the product

            const responsShops = await fetch('./shop'); // Fetch products from the server
            const shops = await responsShops.json();
            const currentShop = shops.find(s => s.id === shop_id); // Find the shop
            const shopRevenue = currentShop.revenue;
            const responseProducts = await fetch('./products'); // Fetch products from the server
            const products = await responseProducts.json();

            // The database update "stock", "bought" og "revenue" based on the confirmation
            const product = products.find(p => p.id === product_id); // Find the products
            console.log('Current product: ', product);
            
            // Skip to the next product in the order, if product is not found
            if (!product) {
                console.error(`Produkt med ID ${product_id} ikke fundet`);
                continue; 
            }

            // Skip to the next product in the order, if product is out of stock
            if (product.stock <= 0){
                for(let i = 0; i < outOfStock.length; i++){
                    if (product.product_name === outOfStock[i]){
                        continue;
                    }
                }
                outOfStock.push(product.product_name);
                alert(`${product.product_name} er ikke på lager.\nKan ikke bekrafte afhæntning`);
                continue;
            }

            // Calc new values
            const new_stock = product.stock - change;
            const new_bought = product.bought + change;
            const new_revenue = shopRevenue + (change * price);
            
            /* See changes
            console.log("Before changes:", product);
            console.log("After changes:", {
                stock: new_stock,
                bought: new_bought,
                revenue: new_revenue
            });*/

            //console.log('\nSTOCK UPDATE, pro_id & new_stock: ', product_id, new_stock);
            // Update stock
            await fetch("./mail_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: '1234', 
                    id: product_id, 
                    stock: new_stock })
            })

            //console.log('\nBOUGHT UPDATE, pro_id & new_bought: ', product_id, new_bought);
            // Update bought
            await fetch("./mail_bought", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    password: '1234',
                    id: product_id, 
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
        break;
    }

    // Delete the code
    if (selectedOrder){
        await fetch("./update_order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                password: '1234',
                id: selectedOrder.id,
                shop_id: selectedOrder.shop_id,
                products: selectedOrder.products,
                code: ""
            })
        });
    }
    

    // Add "task complete" to users webpage
    const h1 = document.createElement("h1");
    h1.textContent = "Det er blevent rigisteret, nu må du lukke vinduet";
    document.getElementById("message").appendChild(h1);
}