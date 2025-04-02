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
    const distanceFilter = document.getElementById('distanceFilter')?.checked ?? false;
    let sortedProducts = [];
    try {
        const responseShop = await fetch('./shop'); // Fetch shops from the server
        const shops = await responseShop.json();
        
        // Apply filters based on the selected checkboxes
        if (distanceFilter) {
            const closestShops = await getTravelTime(shops); // Sort by travel time
            const closestShopIds = closestShops.map(shop => shop.id); // Create a separate id array
            console.log(closestShops);
            // Sort products
            products.sort((a, b) => {
                const indexA = closestShopIds.indexOf(a.shop_id);
                const indexB = closestShopIds.indexOf(b.shop_id);
                return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
            });
            sortedProducts = products;
        } else {
            const responseProducts = await fetch('./products'); // Fetch products from the server
            sortedProducts = await responseProducts.json();
        }
    } catch (error) {
        console.error('Error fetching shops:', error);
    }
    // Return the sortet products
    return sortedProducts;
};