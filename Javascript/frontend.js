document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/cities'); // Fetch cities from server
        const cities = await response.json();
        const container = document.getElementById('city-buttons'); // Target div

        cities.forEach(city => {
            // Create button element
            const cityButton = document.createElement('button');
            cityButton.textContent = city.city;
            cityButton.classList.add('city-button');
            cityButton.onclick = () => {
                window.location.href = `../html/city.html?city=${encodeURIComponent(city.city)}`;
            };

            // Append button below the search bar
            container.appendChild(cityButton);
        });

    } catch (error) {
        console.error('Error fetching cities:', error);
    }
});