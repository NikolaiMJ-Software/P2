import { getTravelTime } from './calculateDistance.js';

document.addEventListener("DOMContentLoaded", async () => {
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');

    // Hide the dropdown menu when the filter button is clicked
    filterButton.addEventListener('click', () => {
        filterDropdown.classList.toggle('hidden');
    });
});

export async function filters(products) {
    // Check the selected filters
    const distanceFilter = document.getElementById('distanceFilter');

    try {
        const response = await fetch('/shop'); // Fetch shops from the server
        let shops = await response.json();

        // Apply filters based on the selected checkboxes
        if (distanceFilter) {
            let closestShops = await getTravelTime(shops); // Sort by travel time
            console.log('closestShops: ',closestShops);


            console.log('\nproducts: ',products);
            
            /*
            
            // Change so the products in the first shop is showed first
            for (let i = 0; i < products.shop_id.length; i++){
                if (products.shop_id[i] === shops.id){

                }
            }
            */
            
            // debugging - sortest list
            console.log('Filtered shops:', closestShops);
        }

        // NEXT, opdate the product page
        
    } catch (error) {
        console.error('Error fetching shops:', error);
    }
    // Return the sortet products array/object
    return products;
};