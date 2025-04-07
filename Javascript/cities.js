import { getTravelTime } from './calculateDistance.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('./cities'); // Fetch cities from the server
        const cities = await response.json();
        const container = document.getElementById('city-buttons'); // Target div
        const searchInput = document.getElementById('query');
        const searchForm = document.getElementById('form');

        //Get the email from URL
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');

        const cityButtons = [];


        const loader = document.getElementById("loader");
        loader.style.display = "block"; // Start loader
        
        // Get travel times to cities
        let travelTimes = await getTravelTime(cities);
        loader.style.display = "none"; // Hide loader
        travelTimes = travelTimes.map(item => ({ city: item.name, time: item.time })); // Convert "name" to "city"
       
        // If travelTimes is empty the cities priority will be taken from the server
        if (travelTimes.length === 0) {
            alert("Du valgte at sige NEJ til GPS, så byerne vil blive vist som de ligger på serveren.");
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

                // Redirect to new page when clicking button (only Aalborg)
                cityButton.onclick = () => {
                    if (matchingCity.city.toLowerCase() === 'aalborg') {
                        if(email){
                            window.location.href = `./searchpage?email=${encodeURIComponent(email)}&city=${encodeURIComponent(matchingCity.city)}`;
                        }else{
                            window.location.href = `./searchpage?city=${encodeURIComponent(matchingCity.city)}`;
                        }
                    } else {
                        alert("Byen er ikke sat op endnu.");
                    }
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

            // Redirect if city is found (only Aalborg)
            if (matchingCity.city.toLowerCase() === 'aalborg') {
                if(email){
                    window.location.href = `./searchpage?email=${encodeURIComponent(email)}&city=${encodeURIComponent(matchingCity.city)}`;
                }else{
                    window.location.href = `./searchpage?city=${encodeURIComponent(matchingCity.city)}`;
                }
            } else {
                alert("Byen er ikke sat op endnu.");
            }
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
    }
});
