let currentCity = new URLSearchParams(window.location.search).get(`city`);
document.getElementById("h1ProductPage").textContent = currentCity; //changes title of page to city

document.addEventListener("DOMContentLoaded", async () => {
    try{
        //we have city name. we need city id
        const response_city = await fetch('/cities'); // Fetch cities from the server
        const cities = await response_city.json();

        //Get the email from url
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        
        let currentCityId;
        for (let i = 0; i < cities.length; i++){
            if(cities[i].city == currentCity){
                currentCityId = i+1;
                break;
            }
        }
        if (currentCityId == undefined) throw "city ID not found"
        console.log(currentCityId);

        const response = await fetch('/products'); // Fetch products from the server
        const products = await response.json();
        const productContainer = document.getElementById('productList');
        const searchInput = document.getElementById('inputProductSearch');
        const searchForm = document.getElementById('form');

        const productButtons = [];

        //go through products, check if city matches selected, initialize
        products.forEach(product => {
            console.log(product.product_name + " " + product.price);

            //with city id, get all products with id.
            if (product.city_id == currentCityId){
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
                productImage.src = `/${product.img1_path}`;
                //name
                productName.classList.add('productName');
                productName.textContent = product.product_name;
                //description
                productDesc.classList.add('productDesc');
                productDesc.textContent = product.description;
                //price
                productPrice.classList.add('productPrice');
                productPrice.textContent = product.price + ",-";
                //discount
                productDiscount.classList.add('productDiscount');
                if(product.discount != 0)
                {productDiscount.textContent = "spar: " + product.discount + ",-"};

                //add onclick function to bring you to the specific products page
                productButton.onclick = () => {
                    if (email) {
                        window.location.href = `../productpage/?email=${encodeURIComponent(email)}&id=${encodeURIComponent(product.id)}`;
                    } else {
                        window.location.href = `../productpage/?id=${encodeURIComponent(product.id)}`;
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
            }
        });

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
                if (email) {
                    window.location.href = `../productpage/?email=${encodeURIComponent(email)}&id=${encodeURIComponent(matchingProduct.id)}`;
                } else {
                    window.location.href = `../productpage/?id=${encodeURIComponent(matchingProduct.product.id)}`;
                }
            }
        });
    }
    catch(err){
        console.log(err);
    }
})