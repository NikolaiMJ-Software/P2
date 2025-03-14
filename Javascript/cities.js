document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/cities'); // Fetch cities from the server
        const cities = await response.json();
        const container = document.getElementById('city-buttons'); // Target div
        const searchInput = document.getElementById('query');
        const searchForm = document.getElementById('form');

        const cityButtons = [];


        cities.forEach(city => {
            // Create button
            const cityButton = document.createElement('button');
            cityButton.textContent = city.city;
            cityButton.classList.add('city-button');
            cityButton.dataset.city = city.city.toLowerCase();

            // Set the background to image if image exists
            if (city.image_path) {
                cityButton.style.backgroundImage = `url('${city.image_path}')`;
                //  Move images from Esbjerg, Aarhus and København down 30% from center
                if (city.city.toLowerCase() === 'esbjerg' || city.city.toLowerCase() === 'aarhus' || city.city.toLowerCase() === 'københavn') {
                    cityButton.style.backgroundPosition = 'center 30%';
                }
            }

            // Redirect to new page when clicking button
            cityButton.onclick = () => {
                window.location.href = `../searchpage/${encodeURIComponent(city.city)}`;
            };

            // add city button
            cityButtons.push(cityButton);
            container.appendChild(cityButton);
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
                window.location.href = `../html/city.html?city=${encodeURIComponent(matchingCity.city)}`;
            }
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
    }
});
