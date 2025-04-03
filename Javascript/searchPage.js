import { filters } from './filter.js';
let currentCity = new URLSearchParams(window.location.search).get(`city`);
document.getElementById("h1ProductPage").textContent = currentCity; //changes title of page to city
const productButtons = [], productContainer = document.getElementById('productList');
let productList = [], advertContainer = document.getElementById('advertList'); //list to contain all items of current chosen city, and container to place advert in.

function updateImage(products){
    productContainer.innerHTML = '';// Remove old products
    //go through products
    products.forEach(product => {
        console.log(product.product_name + " " + product.price);
        productList += product.id;

        //initialize all products.
        const productButton = document.createElement('button');
        const productImage = document.createElement('img');
        const productName = document.createElement('p');
        const productDesc = document.createElement('p');
        const productPrice = document.createElement('p');
        const productDiscount = document.createElement('p');
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
        productPrice.textContent = product.price + ",-";
        //discount
        productDiscount.classList.add('productDiscount');
        if(product.discount != 0 && product.discount != null)
        {productDiscount.textContent = "spar: " + product.discount + ",-"};

        //add onclick function to bring you to the specific products page
        productButton.onclick = () => {
            window.location.href = `./productpage?id=${encodeURIComponent(product.id)}`;
        }

        //add new product to "products" class
        productButtons.push(productButton);
        productContainer.appendChild(productButton);
        productButton.appendChild(productImage);
        productButton.appendChild(productName);
        productButton.appendChild(productDesc);
        productButton.appendChild(productPrice);
        productButton.appendChild(productDiscount);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    try{
        //we have city name. we need city id
        const response_city = await fetch('./cities'); // Fetch cities from the server
        const cities = await response_city.json();

        //Get the email from url
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        
        let currentCityId = cities.filter(city => city.city === currentCity)[0].id;
        if (currentCityId == undefined) throw "city ID not found"
        console.log(currentCityId);

        const response = await fetch('./products'); // Fetch products from the server
        let products = await response.json();
        products = products.filter(product => product.city_id === currentCityId); // Save only the chosen citys products 
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
                // Redirect if city is found
                window.location.href = `./productpage?id=${encodeURIComponent(matchingProduct.product.id)}`;
            }
        });

        // RIGHTSIDE AD
        // find the products in the chosen city
        /* this is done in the creation of products */

        // Pick a random product (this puts advertProduct as the products ID)
        /* A limit was set so that it can't choose the smallest nor biggest ID we have,
           to not cause issues when getting a number (it would sometimes give "undefined"),
           and this is the easiest solution that works to quickly move on */
        let advertProduct = productList[Math.max(1, Math.floor(Math.random() * productList.length)-1)];

        // Get the chosen product
        let advertChosen = products.find(product => product.id === products[advertProduct].id-1);
        console.log(advertChosen.product_name);

        // create classes so it can be modified in css and add elements
        const advertButton = document.createElement('button');
        const advertImage = document.createElement('img');
        const advertName = document.createElement('p');
        const advertDesc = document.createElement('p');
        const advertPrice = document.createElement('p');
        const advertDiscount = document.createElement('p');

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
        advertPrice.textContent = advertChosen.price + ",-";
        //discount
        advertDiscount.classList.add('productDiscount');
        if(advertChosen.discount != 0 && advertChosen.discount != null)
        {advertDiscount.textContent = "spar: " + advertChosen.discount + ",-"};

        // button function redirecting to product page
        advertButton.onclick = () => {
            window.location.href = `./productpage?id=${encodeURIComponent(advertChosen.id)}`;
        }

        // place button in container and add all elements to the button
        advertContainer.appendChild(advertButton);
        advertButton.appendChild(advertImage);
        advertButton.appendChild(advertName);
        advertButton.appendChild(advertDesc);
        advertButton.appendChild(advertPrice);
        advertButton.appendChild(advertDiscount);
    }
    catch(err){
        console.log(err);
    }
})