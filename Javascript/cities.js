import { getTravelTime } from './calculateDistance.js';


document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/cities'); // Fetch cities from the server
        const cities = await response.json();
        const container = document.getElementById('city-buttons'); // Target div
        const searchInput = document.getElementById('query');
        const searchForm = document.getElementById('form');

        const cityButtons = [];
        let travelTimes = await getTravelTime(); // Array for holding cities and travel time
        /* Debugging - Check sorted array
            console.log("Sorted travel times:", travelTimes);
        */
       
        // If travelTimes is empty the cities priority will be taken from the server
        if (travelTimes.length === 0) {
            alert("Du valgte at sige NEJ til GPS, så byerne ville blive vises som de ligger på serveren.");
            travelTimes = cities.map(city => ({ city: city.city }));
        }
        
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

                // Redirect to new page when clicking button
                cityButton.onclick = () => {
                    window.location.href = `../searchpage/?city=${encodeURIComponent(matchingCity.city)}`;
                };

                // add city button
                cityButtons.push(cityButton);
                container.appendChild(cityButton);
            }
        });

        searchInput.addEventListener('input', () => {
            const searchValue = searchInput.value.toLowerCase();
            cityButtons.forEach(button => {
                if (button.dataset.city.includes(searchValue)) {
                    button.style.display = 'flex'; // Show matching cities
                } else {
                    button.style.display = 'none'; // Hide non-matching cities
                }
            });
        });

        searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const searchValue = searchInput.value.trim().toLowerCase();
            const matchingCity = cities.find(city => city.city.toLowerCase() === searchValue);

            if (matchingCity) {
                // Redirect if city is found
                window.location.href = `../searchpage/?city=${encodeURIComponent(matchingCity.city)}`;
            }
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
    }
});
