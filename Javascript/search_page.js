import { filters, sortStandart } from './filter.js';
import { updateLastVisit } from './calculate_distance.js';

let currentCity = new URLSearchParams(window.location.search).get(`city`);
document.getElementById("h1ProductPage").textContent = currentCity; //changes title of page to city
const productButtons = [], productContainer = document.getElementById('productList');
let productList = [], advertContainer = document.getElementById('advertList'); //list to contain all items of current chosen city, and container to place advert in.

//Get the email from url
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');

async function updateImage(products) {
    updateLastVisit(); // Update users last visit
    productContainer.innerHTML = ''; // Clear existing products
    advertContainer.innerHTML = ''; // empy the ad
    productButtons.length = 0; // Reset product buttons array
    //go through products
    for (const product of products) {
        console.log(product.product_name + " " + product.price);
        if(product.discount > 0){
            productList.push(product.id);
        }

        //initialize all products.
        const productButton = document.createElement('button');
        const productImage = document.createElement('img');
        const productName = document.createElement('p');
        const productDesc = document.createElement('p');
        const productPrice = document.createElement('p');
        const productDiscount = document.createElement('p');
        const productStore = document.createElement('a');
        const productText = document.createElement('p');
        const productRating = document.createElement('div');
        productButton.dataset.product = product.product_name.toLowerCase();

        //initialize all attributes.
        productButton.classList.add('product');
        //image
        productImage.classList.add('productImage');
        productImage.src = `./${product.img1_path}`;
        //name
        productName.classList.add('productName');
        if (product.product_name.length > 41){
            productName.textContent = product.product_name.slice(0, 41);
            productName.textContent += "...";
        }
        else productName.textContent = product.product_name;
        //description
        productDesc.classList.add('productDesc');
        if (product.description.length > 75){
            productDesc.textContent = product.description.slice(0, 75);
            productDesc.textContent += "...";
        }
        else productDesc.textContent = product.description;
        //price
        productPrice.classList.add('productPrice');
        let finalPrice = product.price;
        if (product.discount > 0) {
            finalPrice -= product.discount;
        }
        productPrice.textContent = `${finalPrice},-`;

        //discount
        productDiscount.classList.add('productDiscount');
        if(product.discount > 0)
        {productDiscount.textContent = "spar: " + product.discount + ",-"};
        
        productStore.classList.add('productStore');
        if(email){
            productStore.href = `./productlist?email=$${encodeURIComponent(email)}&city=${currentCity}&shop_id=${product.shop_id}`
        } else {
            productStore.href = `./productlist?city=${currentCity}&shop_id=${product.shop_id}`
        }
        let productStoreImage = document.createElement("img");
        const shopResponse = await fetch(`./shop?id=${product.shop_id}`);
        const shopData = await shopResponse.json();
        if(shopData.img_path){
            productStoreImage.src = `./${shopData.img_path}`
        }
        productStoreImage.alt = `${shopData.shop_name}`
        productStoreImage.style = "max-width: 125px; max-height: 75px;"
        productStore.appendChild(productStoreImage);
        //rating
        try {
            const ratingResponse = await fetch(`./comments?product_id=${product.id}`);
            const ratings = await ratingResponse.json();
            productRating.classList.add('rating');

            if (ratings.length > 0) {
                const total = ratings.reduce((sum, r) => sum + r.rating, 0);
                const average = total / ratings.length;

                // Display star icons based on average
                const stars = '★'.repeat(Math.round(average)) + '☆'.repeat(5 - Math.round(average));
                productRating.textContent = stars;
            } else {
                productRating.textContent = '☆'.repeat(5);
            }
        } catch (err) {
            console.error("Rating fetch failed:", err);
            productRating.textContent = "Bedømmelse ikke tilgængelig";
        }
        //add onclick function to bring you to the specific products page
        productButton.onclick = () => {
            if(email){
                window.location.href = `./productpage?email=${encodeURIComponent(email)}&id=${encodeURIComponent(product.id)}`;
            } else {
                window.location.href = `./productpage?id=${encodeURIComponent(product.id)}`;
            }
        }

        //add new product to "products" class
        productButtons.push(productButton);
        productContainer.appendChild(productButton);
        productButton.appendChild(productImage);
        productButton.appendChild(productName);
        productButton.appendChild(productDesc);
        productButton.appendChild(productPrice);
        productButton.appendChild(productDiscount);
        productButton.appendChild(productStore);
        productButton.appendChild(productText);
        productButton.appendChild(productRating);   
    }

        // RIGHTSIDE AD
        // find the products in the chosen city
        /* this is done in the creation of products */
        
        // Fetch products from the server
        const response = await fetch('./products'); 
        const responseJson = await response.json();
        let orderedProducts = {};
        responseJson.forEach(p => {
            orderedProducts[p.id] = p;
        });

        // Pick a random product (this puts advertProduct as the products ID)
        let advertProduct = productList[Math.floor(Math.random() * productList.length)];

        // Get the chosen product
        let advertChosen = orderedProducts[advertProduct];
        console.log(advertChosen.product_name);

        // create classes so it can be modified in css and add elements
        const advertButton = document.createElement('button');
        const advertImage = document.createElement('img');
        const advertName = document.createElement('p');
        const advertDesc = document.createElement('p');
        const advertPrice = document.createElement('p');
        const advertDiscount = document.createElement('p');
        const advertStore = document.createElement('a');
        const advertText = document.createElement('p');
        const productRating = document.createElement('div');

        //button
        advertButton.classList.add('advertButton');
        //image
        advertImage.classList.add('productImage');
        advertImage.src = `./${advertChosen.img1_path}`;
        //name
        advertName.classList.add('productName');
        if (advertChosen.product_name.length > 41){
            advertName.textContent = advertChosen.product_name.slice(0, 41);
            advertName.textContent += "...";
        }
        else advertName.textContent = advertChosen.product_name;
        //description
        advertDesc.classList.add('productDesc');
        if (advertChosen.description.length > 75){
            advertDesc.textContent = advertChosen.description.slice(0, 75);
            advertDesc.textContent += "...";
        }
        else advertDesc.textContent = advertChosen.description;
        //price
        advertPrice.classList.add('productPrice');
        let finalAdvertPrice = advertChosen.price;
        if (advertChosen.discount > 0 && advertChosen.discount < advertChosen.price) {
            finalAdvertPrice -= advertChosen.discount;
        }
        advertPrice.textContent = `${finalAdvertPrice},-`;
        //discount
        advertDiscount.classList.add('productDiscount');
        if(advertChosen.discount != 0 && advertChosen.discount != null)
        {advertDiscount.textContent = "spar: " + advertChosen.discount + ",-"};
        //rating
        try {
            const ratingResponse = await fetch(`./comments?product_id=${advertChosen.id}`);
            const ratings = await ratingResponse.json();
            productRating.classList.add('rating');

            if (ratings.length > 0) {
                const total = ratings.reduce((sum, r) => sum + r.rating, 0);
                const average = total / ratings.length;

                // Display star icons based on average
                const stars = '★'.repeat(Math.round(average)) + '☆'.repeat(5 - Math.round(average));
                productRating.textContent = stars;
            } else {
                productRating.textContent = '☆'.repeat(5);
            }
        } catch (err) {
            console.error("Rating fetch failed:", err);
            productRating.textContent = "Bedømmelse ikke tilgængelig";
        }
        // button function redirecting to product page
        advertButton.onclick = () => {
            if(email){
                window.location.href = `./productpage?email=${encodeURIComponent(email)}&id=${encodeURIComponent(advertChosen.id)}`;
            } else {
                window.location.href = `./productpage?id=${encodeURIComponent(advertChosen.id)}`;
            }
        }
        //shop button 
        advertStore.classList.add('productStore');
        advertStore.href = `./productlist?city=${currentCity}&shop_id=${advertChosen.shop_id}`
        let advertStoreImage = document.createElement("img");
        const shopResponse = await fetch(`./shop?id=${advertChosen.shop_id}`);
        const shopData = await shopResponse.json();
        if(shopData.img_path){
            advertStoreImage.src = `./${shopData.img_path}`
        }
        advertStoreImage.alt = `${shopData.shop_name}`
        advertStoreImage.style = "max-width: 125px; max-height: 75px;"
        advertStore.appendChild(advertStoreImage);
        //AD text
        advertText.classList.add('productText');
        advertText.textContent = "Nuværende Tilbud";

        // place button in container and add all elements to the button
        advertContainer.appendChild(advertButton);
        advertButton.appendChild(advertImage);
        advertButton.appendChild(advertName);
        advertButton.appendChild(advertDesc);
        advertButton.appendChild(advertPrice);
        advertButton.appendChild(advertDiscount);
        advertButton.appendChild(advertStore);
        advertButton.appendChild(advertText);
        advertButton.appendChild(productRating);
}

document.addEventListener("DOMContentLoaded", async () => {
    try{
        //we have city name. we need city id
        const response_city = await fetch('./cities'); // Fetch cities from the server
        const cities = await response_city.json();
        let currentCityId = cities.filter(city => city.city === currentCity)[0].id;
        if (currentCityId == undefined) throw "city ID not found"

        const response = await fetch('./products'); // Fetch products from the server
        let orderedProducts = await response.json();
        let products = orderedProducts.filter(product => product.city_id === currentCityId); // Save only the chosen citys products
        console.log(products)

        // Sort smallest store as standart filter
        products = await sortStandart(products);
        console.log('Standart sorted list:', products);
        
        const searchInput = document.getElementById('inputProductSearch');
        const searchForm = document.getElementById('form');

        // Get user selected filters, when clicked
        document.getElementById('applyFiltersButton').addEventListener('click', async () => {
            filterDropdown.classList.add('hidden');
            products = await filters(products);
            console.log('Sorted list', products);

            // Update products on search page
            updateImage(products);
        });

        // Update products on search page
        updateImage(products);

        //Search field
        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.toLowerCase();
            console.log(searchValue);
            productButtons.forEach(button => {
                if (button.dataset.product.includes(searchValue)) {
                    button.hidden = false; // Show matching cities
                } else {
                    button.hidden = true; // Hide non-matching cities
                }
            });
        });

        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchValue = searchInput.value.trim().toLowerCase();
            const matchingProduct = products.find(product => product.product_name.toLowerCase() === searchValue);

            if (matchingProduct) {
                if(email){
                    window.location.href = `./productpage?email=${encodeURIComponent(email)}&id=${encodeURIComponent(product.id)}`;
                } else {
                    window.location.href = `./productpage?id=${encodeURIComponent(product.id)}`;
                }
            }
        });
    }
    catch(err){
        console.log(err);
    }
})