let currentCity = new URLSearchParams(window.location.search).get(`city`);
document.getElementById("h1ProductPage").textContent = currentCity; //changes title of page to city

document.addEventListener("DOMContentLoaded", async () => {
    try{
        //we have city name. we need city id
        const response_city = await fetch('/cities'); // Fetch cities from the server
        const cities = await response_city.json();
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
        products.forEach(product => {
            console.log(product.product_name + " " + product.price);

            //with city id, get all products with id.
            if (product.city_id == currentCityId){
                //initialize all products.
                const cityButton = document.createElement('button');
                
            }
        });
        
    }
    catch(err){
        console.log(err);
    }
})