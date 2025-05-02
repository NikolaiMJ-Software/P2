import { getCookie, add_to_cart, remove_from_cart, update_cart_button } from '../Javascript/cart.js';

// Mock `document.cookie` manually
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'products=1,2,3'
});

describe('cart.js basic functions', () => {
  //create test cookies  
  beforeEach(() => {
    // Reset cookie for every test
    document.cookie = 'products=1,2,3';
    //create fake html with cart button
    document.body.innerHTML = `
      <button id="cart_top_button">Din kurv (0)</button>
    `;
  });

  //test if correct cookies gets returned based on test cookies
  test('getCookie returns correct value', () => {
    expect(getCookie('products')).toBe('1,2,3');
  });

  //try to add a 4th product and test if cookies contain an extra
  test('add_to_cart appends product correctly', () => {
    add_to_cart(4);
    expect(document.cookie).toContain('1,2,3,4');
  });

  //try to remove a cookie from the cookie list, and chech value
  test('remove_from_cart removes product correctly', () => {
    remove_from_cart(2);
    expect(document.cookie).toContain('products=1,3');
  });

  //test cart update button, to check if button name changes based on amount of cookies
  test('update_cart_button updates button text with item count', () => {
    update_cart_button();
    const btn = document.getElementById('cart_top_button');
    expect(btn.textContent).toBe('Din kurv (3)');
  });
});
