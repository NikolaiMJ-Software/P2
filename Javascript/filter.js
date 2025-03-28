import { getTravelTime } from './calculateDistance.js';

document.addEventListener('DOMContentLoaded', () => {
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');
    const applyFiltersButton = document.getElementById('applyFiltersButton');

    // Toggle the visibility of the dropdown menu when the filter button is clicked
    filterButton.addEventListener('click', () => {
        filterDropdown.classList.toggle('hidden');
    });

    applyFiltersButton.addEventListener('click', async () => {
        filterDropdown.classList.add('hidden');
        // Check the selected filters
        const distanceFilter = document.getElementById('distanceFilter');

        try {
            const response = await fetch('/shop'); // Fetch shops from the server
            let shops = await response.json();

            // Apply filters based on the selected checkboxes
            if (distanceFilter) {
                shops = await getTravelTime(shops); // Sort by travel time
                // debugging - sortest list
                console.log('Filtered shops:', shops);
            }

            // NEXT, opdate the product page

        } catch (error) {
            console.error('Error fetching shops:', error);
        }
    });
});