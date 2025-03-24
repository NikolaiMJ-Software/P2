document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (!productId) {
        document.body.innerHTML = "<h1>No product ID provided.</h1>";
        return;
    }

    try {
        // Fetch data from the server
        const response = await fetch(`/product?id=${productId}`);
        const product = await response.json();

        if (product.error) {
            document.body.innerHTML = `<h1>${product.error}</h1>`;
            return;
        }
        //Get product details from the object
        const {
            id, parent_id,
            product_name, shop_id, stock, price, description,
            discount, specifications,
            img1_path, img2_path, img3_path, img4_path, img5_path
        } = product;

        // update text content
        const updateElement = (id, value) => {
            if (value) document.getElementById(id).innerText = value;
        };
        //function to update the `src` of an image by ID
        const updateImage = (id, src) => {
            if (src) {
                const fixedPath = src.startsWith('/') ? src : `/${src}`;
                document.getElementById(id).src = fixedPath;
            }
        };
        // Set the product details into the page
        updateElement('product_name', product_name);
        updateElement('shop_id', shop_id);
        updateElement('stock', stock);
        updateElement('price', price);
        updateElement('description', description);
        updateElement('discount', discount);

        // Set the main product image (img1)
        updateImage('img1', img1_path);

        //Make save disapear if there is no discount
        if (discount > 0) {
            document.getElementById("discount").innerText = discount;
            document.querySelector(".save").style.display = "block";
        }

        // === Dynamic image gallery
        // Replace hardcoded thumbnails with dynamic image list
        const imageVariants = document.getElementById('image-variants');
        imageVariants.innerHTML = ''; //Clear any existing

        // Loop through all available image paths
        [img1_path, img2_path, img3_path, img4_path, img5_path].forEach(path => {
            if (path && path.trim() !== '') {
                const fixedPath = path.startsWith('/') ? path : `/${path}`;
                
                // Create new img element for the thumbnail
                const thumb = document.createElement('img');
                thumb.src = fixedPath;
                thumb.alt = 'Extra product image';

                // When clicked, the thumbnail updates the main image
                thumb.addEventListener('click', () => {
                    document.getElementById('img1').src = fixedPath;
                });
                // Add thumbnail to the gallery container
                imageVariants.appendChild(thumb);
            }
        });

        // === Specifications
        // If there are specs, split them by commas and display as li elements
        if (specifications) {
            const specList = document.getElementById('specifications');
            specList.innerHTML = '';
            specifications.split(',').forEach(spec => {
                const li = document.createElement('li');
                li.innerText = spec.trim();
                specList.appendChild(li);
            });
        }

        // === Quantity Selector
        let quantity = 1;
        const maxStock = stock;

        const quantityToggle = document.getElementById('quantity-toggle');
        const quantityValue = document.getElementById('quantity-value');

        /* Clicking on the left third of the button subtracts quantity
           Clicking on the right third adds quantity*/
        quantityToggle.addEventListener('click', function (event) {
            const clickX = event.offsetX;
            const buttonWidth = this.clientWidth;

            if (clickX < buttonWidth / 3 && quantity > 1) {
                quantity--;
            } else if (clickX > (2 * buttonWidth) / 3 && quantity < maxStock) {
                quantity++;
            }

            quantityValue.innerText = quantity;
        });
     
// === Fetch variants by parent_id
try {
        // Figure out the correct parent ID to fetch all related variants
    const variantParentId = Number(parent_id || id); // Ensure it's a number
    console.log("Using parent_id for variants:", variantParentId); // Debug log

    // Fetch all variant products
    const response = await fetch(`/allVariants?parent_id=${variantParentId}`);
    const variants = await response.json();
    console.log("Fetched variants:", variants); // Debug log

    // Get the container where variant boxes will go
    const container = document.getElementById('variant-container');
    container.innerHTML = ''; // Clear any existing content

    // Loop through each variant returned from the backend
    variants.forEach((variant) => {
        // Create a new box for the variant
        const box = document.createElement('div');
        box.classList.add('variant-box');
        box.style.width = '100px';
        box.style.height = '100px';
        box.style.cursor = 'pointer';
        box.style.border = '1px solid #ccc';
        box.style.marginRight = '10px';

        // Fill box with thumbnail image
        const img = document.createElement('img');
        const imgPath = variant.img1_path || ''; // Use variant's first image path

        // Ensure the image path starts with a slash (for proper URL resolution)
        img.src = imgPath.startsWith('/') ? imgPath : `/${imgPath}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.alt = variant.product_name;

        // Append image to the box
        box.appendChild(img);

        // Add click to switch
        box.addEventListener('click', () => {
            if (variant.id !== id) {
                window.location.href = `/productpage/?id=${variant.id}`;
            }
        });

        // Highlight current product
        if (variant.id === id) {
            box.style.border = '2px solid red';
        }

        // Append the box to the container
        container.appendChild(box);
    });
} catch (err) {
    console.error("Error fetching variants:", err);
}

    } catch (error) {
        console.error('Error loading product:', error);
        document.body.innerHTML = `<h1>Error loading product</h1>`;
    }
});
