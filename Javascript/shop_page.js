document.addEventListener("DOMContentLoaded", async () => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const currentCity = urlParams.get('city');
        const email = urlParams.get('email');
        const shopId = Number(urlParams.get('shop_id'));

        //Set page title
        if (shopId) {
            const shopResponse = await fetch(`/shop?id=${shopId}`);
            const shopData = await shopResponse.json();
            
            if (shopData.shop_name) {
                document.getElementById("h1store_page").textContent = shopData.shop_name;
            } else {
                document.getElementById("h1store_page").textContent = "Ukendt butik";
            }
        } else {
            document.getElementById("h1store_page").textContent = currentCity;
        }

        // Get city list
        const response_city = await fetch('/cities');
        const cities = await response_city.json();

        // Get current city ID
        let currentCityId;
        for (let i = 0; i < cities.length; i++) {
            if (cities[i].city === currentCity) {
                currentCityId = i + 1;
                break;
            }
        }

        if (currentCityId === undefined) throw "city ID not found";
        console.log("City ID:", currentCityId);
        if (shopId) console.log("Filtering by shop_id:", shopId);

        // Get products
        const response = await fetch('/products');
        const products = await response.json();
        const productContainer = document.getElementById('productList');
        const searchInput = document.getElementById('inputProductSearch');
        const searchForm = document.getElementById('form');

        const productButtons = [];

        products.forEach(product => {
            // Filter by city AND (if present) shop_id
            if (product.city_id == currentCityId && (!shopId || product.shop_id == shopId)) {
                const productButton = document.createElement('button');
                const productImage = document.createElement('img');
                const productName = document.createElement('p');
                const productDesc = document.createElement('p');
                const productPrice = document.createElement('p');
                const productDiscount = document.createElement('p');
                productButton.dataset.product = product.product_name.toLowerCase();

                // Style + content
                productButton.classList.add('product');

                productImage.classList.add('productImage');
                productImage.src = `/${product.img1_path}`;

                productName.classList.add('productName');
                productName.textContent = product.product_name;

                productDesc.classList.add('productDesc');
                productDesc.textContent =
                    product.description.length > 75
                        ? product.description.slice(0, 75) + "..."
                        : product.description;

                productPrice.classList.add('productPrice');
                productPrice.textContent = product.price + ",-";

                productDiscount.classList.add('productDiscount');
                if (product.discount != 0) {
                    productDiscount.textContent = "spar: " + product.discount + ",-";
                }

                // Redirect to product page
                productButton.onclick = () => {
                    let url = `../productpage/?id=${encodeURIComponent(product.id)}`;
                    if (email) url += `&email=${encodeURIComponent(email)}`;
                    window.location.href = url;
                };

                // Build product element
                productButtons.push(productButton);
                productContainer.appendChild(productButton);
                productButton.appendChild(productImage);
                productButton.appendChild(productName);
                productButton.appendChild(productDesc);
                productButton.appendChild(productPrice);
                productButton.appendChild(productDiscount);
            }
        });

        // 🔎 Live search
        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.toLowerCase();
            productButtons.forEach(button => {
                button.hidden = !button.dataset.product.includes(searchValue);
            });
        });

        // 🔍 Search submit
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchValue = searchInput.value.trim().toLowerCase();
            const matchingProduct = products.find(
                product =>
                    product.product_name.toLowerCase() === searchValue &&
                    product.city_id == currentCityId &&
                    (!shopId || product.shop_id == shopId)
            );

            if (matchingProduct) {
                let url = `../productpage/?id=${encodeURIComponent(product.id)}&city=${encodeURIComponent(currentCity)}`;
                if (email) url += `&email=${encodeURIComponent(email)}`;
                window.location.href = url;
            }
        });

    } catch (err) {
        console.error("Error loading product list:", err);
    }
});
