//const response = await fetch('/stock'); // Fetch stock from the server
//const stock = await response.json();

let quantity = 1;
const maxStock = 3; // stock count

document.getElementById('quantity-toggle').addEventListener('click', function (event) {
    const clickX = event.offsetX;
    const buttonWidth = this.clientWidth;

    if (clickX < buttonWidth / 3 && quantity > 1) {
        // Clicked on the left side (-)
        quantity--;
    } else if (clickX > (2 * buttonWidth) / 3 && quantity < maxStock) {
        // Clicked on the right side (+)
        quantity++;
    }

    document.getElementById('quantity-value').innerText = quantity;
});