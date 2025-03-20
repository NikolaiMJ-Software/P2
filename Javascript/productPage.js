//Imports reservation mails function from mail sender
const { reservation_mails } = require('./mail_sender');

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id'); // Get product ID from URL

    if (!productId) {
        console.warn("No product ID found in URL. Using default ID: 1");
      //  productId = 1; // Default to product ID 1
    }


    try {
        const response = await fetch(`/product?id=${productId}`);
        const product = await response.json();

        if (product.error) {
            document.body.innerHTML = `<h1>${product.error}</h1>`;
            return;
        }

        //update
        const updateElement = (id, value) => {
            if (value) document.getElementById(id).innerText = value;
        };

        //update the scr attribute
        const updateImage = (id, src) => {
            if (src) {
                console.log(`Trying to load image: ${src}`);
                document.getElementById(id).src = src;
            }
        };

        //Assign product details
        updateElement('product_name', product.product_name);
        updateElement('shop_id', product.shop_id);
        updateElement('stock', product.stock);
        updateElement('price', product.price);
        updateElement('description', product.description);
        updateElement('discount', product.discount);

        // reassign the path for images
        const img1Path = product.img1_path.startsWith("/") ? product.img1_path : `/${product.img1_path}`;
        const img2Path = product.img2_path.startsWith("/") ? product.img2_path : `/${product.img2_path}`;
        const img3Path = product.img3_path.startsWith("/") ? product.img3_path : `/${product.img3_path}`;
        console.log("Final image paths:", img1Path, img2Path);
        // src update for specific images
        updateImage('img1', img1Path);
        updateImage('img2', img2Path);
        updateImage('img3', img3Path);

        // empty prior
        if (product.specifications) {
            const specList = document.getElementById('specifications');
            specList.innerHTML = '';
            product.specifications.split(',').forEach(spec => {
                const li = document.createElement('li');
                li.innerText = spec.trim();
                specList.appendChild(li);
            });
        }

    

    
 // === Quantity Selector ===
 let quantity = 1;
 const maxStock = product.stock; // Set max stock from database

 const quantityToggle = document.getElementById('quantity-toggle');
 const quantityValue = document.getElementById('quantity-value');

 quantityToggle.addEventListener('click', function (event) {
     const clickX = event.offsetX;
     const buttonWidth = this.clientWidth;

     if (clickX < buttonWidth / 3 && quantity > 1) {
         quantity--; // Clicked on the left (-)
     } else if (clickX > (2 * buttonWidth) / 3 && quantity < maxStock) {
         quantity++; // Clicked on the right (+)
     }

     quantityValue.innerText = quantity;
 });

} catch (error) {
    console.error('Error fetching product:', error);
}
});
db.close((err) => {
    if (err) {
        console.error('Error closing database:', err.message);
    } else {
        console.log('Database connection closed.');
    }
});

//Work in progress for reservation through button
const button = document.getElementById("cart_button");
button.addEventListener("click", reservation);
function reservation() {
    db.get("SELECT shops.email FROM products JOIN shops ON products.shop_id = shops.id WHERE products.id = ?;", [id], (err, row) => {
        if(err) {
            console.log("Could not get email from shop");
        }
        if(row) {
            console.log("Succedded in getting shop email");
        }
        let email = prompt("Please enter your email", "Your email");
        reservation_mails(email, row.email, id);
    });
}
