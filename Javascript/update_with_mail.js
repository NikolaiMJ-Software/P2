document.addEventListener('DOMContentLoaded', async () => {
    // Collect the code and id from URL
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get('id'));
    const code = params.get('code');
    const shop_id = params.get('shop_id');

    // If order_id and code is found, update DB
    if (code && id) {
        console.log('Opdater produkt DB...');
        await changesInProducts(id, code);
    } else if (shop_id && code) {
        console.log('Opdater bruger DB...');
        await changesInUsers(shop_id, code);
    } else {
        console.error('order_id/shop_id eller code ikke fundet i URL');
    }
});

async function changesInUsers(shop_id, code){
    // Fetching users from DB
    const responsUsers = await fetch('./get_users');
    const users = await responsUsers.json();

    // Update DB based on the order
    for (const user of users){
        // Check if the code matches the user, if not, skip/block if code is 0
        if (JSON.parse(user.code) !== code) {
            if (user.code == 0){
                alert('Bruger kan ikke skifte butik, eller har allerede skiftet.');
                break;
            }
            continue;
        }

        const respons = await fetch(`./update_userStores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                userId: user.id, 
                shopId: shop_id,
                code: "0",
                bypassAdmin: true
            })
        });

        if(respons.ok){
            const h1 = document.createElement("h1");
            h1.textContent = "Bruger er nu forbundet butikken, nu må du lukke vinduet";
            document.getElementById("message").appendChild(h1);
        } else {
            alert('Fejl ved oprettelse af bruger i DB.');
        }
    }
}

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
            alert('Ordre er allerede behandlet.');
            break;
        }

        // Save current order
        selectedOrder = order;
        const shop_id = order.shop_id;
        const orderProducts = JSON.parse(JSON.parse(order.products));

        // Changes from mail
        for (const orderProduct of orderProducts) {
            const product_id = Number(orderProduct.product_id); // The product;
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
            const diff = product.stock - change;
            if(diff < 0){
                if (product.stock > 0){
                    alert(`${product.product_name} kan ikke blive afhentet, fordi der er ikke nok på lager.`);
                } else{
                    alert(`${product.product_name} er ikke på lager.\nKan ikke bekræfte afhentning af produktet.`);
                }
                continue;
            }
            if (diff === 0){
                alert(`Det er den sidste af: ${product.product_name}, lager skal fyldes op.`);
            }

            // Calc new values
            const new_stock = product.stock - change;
            const new_bought = product.bought + change;
            const new_revenue = shopRevenue + (change * price);
            
            // Update stock
            await fetch("./mail_stock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    password: '1234', 
                    id: product_id, 
                    stock: new_stock })
            })

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