document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/cities'); // Fetch cities from the server
        const cities = await response.json();
        const container = document.getElementById('city-buttons'); // Target div

        cities.forEach(city => {
            // Create button
            const cityButton = document.createElement('button');
            cityButton.textContent = city.city;
            cityButton.classList.add('city-button');

            // Set the background to image if image exists
            if (city.image_path) {
                cityButton.style.backgroundImage = `url('${city.image_path}')`;
            }

            // Redirect to new page when clicking button
            cityButton.onclick = () => {
                window.location.href = `../html/city.html?city=${encodeURIComponent(city.city)}`;
            };

            // add city button
            container.appendChild(cityButton);
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
    }
});
