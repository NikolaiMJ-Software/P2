import { getTravelTime, getCurrentPositionPromise } from './calculate_distance.js';

//on page start load the following:
document.addEventListener('DOMContentLoaded', async () => {
    getCurrentPositionPromise(); // Get users location
    try {
        //tries to fetch cities and make city buttons
        const response = await fetch('./cities'); // Fetch cities from the server
        const cities = await response.json();
        const container = document.getElementById('city-buttons'); // Target div

        const searchInput = document.getElementById('query');
        const searchForm = document.getElementById('form');

        //Get the email from URL
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        //make empty list of city buttons
        const cityButtons = [];

        const loader = document.getElementById("loader");
        loader.style.display = "block"; // Start loader
        
        // Get travel times to cities
        let travelTimes = await getTravelTime('cities');
        loader.style.display = "none"; // Hide loader
        travelTimes = travelTimes.map(item => ({ city: item.name, time: item.time })); // Convert "name" to "city"

        // If travelTimes is empty the cities priority will be taken from the server
        if (travelTimes.length === 0) {
            alert("Du valgte at sige NEJ til GPS, så byerne vil blive vist som de ligger på serveren.");
            travelTimes = cities.map(city => ({ city: city.city }));
        }
        
        // Find product in cities
        const resProducts = await fetch('./products'); // Fetch cities from the server
        const products = await resProducts.json();
        const sortedCitire = products.map(product => product.city_id);
        const productsInCities = [...new Set(sortedCitire)];

        travelTimes.forEach(cityData => {
            const matchingCity = cities.find(city => city.city === cityData.city);

            if (matchingCity){
                // Create button
                const cityButton = document.createElement('button');
                cityButton.textContent = matchingCity.city;
                cityButton.classList.add('city-button');
                cityButton.dataset.city = matchingCity.city.toLowerCase();

                // Set the background to image if image exists
                if (matchingCity.image_path) {
                    cityButton.style.backgroundImage = `url('${matchingCity.image_path}')`;
                    //  Move images from Esbjerg, Aarhus and København down 30% from center
                    if (['esbjerg', 'aarhus', 'københavn'].includes(matchingCity.city.toLowerCase())) {
                        cityButton.style.backgroundPosition = 'center 30%';
                    }
                }

                // Redirect to new page when clicking button (only cities with products)
                cityButton.onclick = () => {
                    if (matchingCity && productsInCities.includes(matchingCity.id)) {
                        if(email){
                            window.location.href = `./searchpage?email=${encodeURIComponent(email)}&city=${encodeURIComponent(matchingCity.city)}`;
                        }else{
                            window.location.href = `./searchpage?city=${encodeURIComponent(matchingCity.city)}`;
                        }
                    } else {
                        alert('Byen er ikke sat op endnu.');
                    }
                };

                // add city button
                cityButtons.push(cityButton);
                container.appendChild(cityButton);
            }
        });

        //function that finds cities based on input in searchbar
        searchInput.addEventListener('input', () => {
            //values in searchbar set to lower case
            const searchValue = searchInput.value.toLowerCase();
            //only shows city buttons matching search input
            cityButtons.forEach(button => {
                if (button.dataset.city.includes(searchValue)) {
                    button.style.display = 'flex'; // Show matching cities
                } else {
                    button.style.display = 'none'; // Hide non-matching cities
                }
            });
        });

        //function that waits for a submit on the searchbar
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            //checks if any city matches search, if it does, then go to matching city
            const searchValue = searchInput.value.trim().toLowerCase();
            const matchingCity = cities.find(city => city.city.toLowerCase() === searchValue);

            // Redirect if city is found
            if (matchingCity) {
                if(email){
                    window.location.href = `./searchpage?email=${encodeURIComponent(email)}&city=${encodeURIComponent(matchingCity.city)}`;
                }else{
                    window.location.href = `./searchpage?city=${encodeURIComponent(matchingCity.city)}`;
                }
            }
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
    }
});