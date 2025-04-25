import { getTravelTime } from './calculate_distance.js';

document.addEventListener("DOMContentLoaded", async () => {
    const filterButton = document.getElementById('filterButton');
    const filterDropdown = document.getElementById('filterDropdown');

    // Reset all checkboxes to unchecked on page load
    document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
        checkbox.checked = false; // Uncheck all checkboxes
    });

    // Hide the dropdown menu when the filter button is clicked
    filterButton.addEventListener('click', () => {
        filterDropdown.classList.toggle('hidden');
    });

    // Change "Pris ⬆" checkbox
    document.getElementById('priceUpwardFilter').addEventListener('change', (event) => {
        if (event.target.checked) {
            // If "Pris ⬆" is chosed, remove "Pris ⬇"
            document.getElementById('priceDownwardFilter').checked = false;
        }
    });

    // Change "Pris ⬇" checkbox
    document.getElementById('priceDownwardFilter').addEventListener('change', (event) => {
        if (event.target.checked) {
            // If "Pris ⬇" is chosed, remove "Pris ⬆"
            document.getElementById('priceUpwardFilter').checked = false;
        }
    });
});

export async function filters(products) {
    // Check the selected filters
    const distanceFilter = document.getElementById('distanceFilter')?.checked ?? false;
    const priceUpwardFilter = document.getElementById('priceUpwardFilter')?.checked ?? false;
    const priceDownwardFilter = document.getElementById('priceDownwardFilter')?.checked ?? false;
    let sortedProducts = [];
    try {
        // Apply filters based on the selected checkboxes
        if(priceUpwardFilter){
            // Sort after upward price
            products.sort((a, b) => { return a.price - b.price; });
            sortedProducts = products;

        } else if(priceDownwardFilter){
            // Sort after downward price
            products.sort((a, b) => { return b.price - a.price; });
            sortedProducts = products;

        } else {
            // As standart sort by smalles shop (by revenue)
            sortedProducts = await sortStandart(products);
        }
        
        if (distanceFilter) {
            // Sort after closest distance to shop
            const closestShops = await getTravelTime('shops'); // Sort by travel time
            if (closestShops.length === 0) {
                alert("Filteret kræver, at du har aktiveret GPS");
            }
            const closestShopIds = closestShops.map(shop => shop.id); // Create a separate shop_id array
            console.log('Shortest distance to shops: ', closestShops);

            // Sort products, based on the sorted shop id
            products.sort((a, b) => {
                const indexA = closestShopIds.indexOf(a.shop_id);
                const indexB = closestShopIds.indexOf(b.shop_id);
                return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
            });
            sortedProducts = products;
        }
    } catch (error) {
        console.error('Error fetching shops:', error);
    }
    // Return the sortet products
    return sortedProducts;
};

// Sorts after smallest shops and top 3 most popular products (define by revenue and bought)
export async function sortStandart(products){
    const responseShop = await fetch('./shop'); // Fetch shops from the server
    const shops = await responseShop.json();
    
    // Sort shops after revenue
    shops.sort((a, b) => a.revenue - b.revenue);

    // Create a separate shop_id array
    const smallestShop = shops.map(shop => shop.id); 

    // Sort products by revenue based on shops sorted list
    const sortedProductsByShop = [...products].sort((a, b) => {
        return smallestShop.indexOf(a.shop_id) - smallestShop.indexOf(b.shop_id);
    });
    
    // Add some of the most popular products bought (top: 3)
    const topProducts = products
        .sort((a, b) => b.bought - a.bought) // Sort products by 'bought' count
        .slice(0, 3); // Only top 3
    
    // Merge the two sorted arraies
    const sortedProducts = [
        ...topProducts, 
        ...sortedProductsByShop.filter(product => !topProducts.includes(product))];
    
    return sortedProducts;
}