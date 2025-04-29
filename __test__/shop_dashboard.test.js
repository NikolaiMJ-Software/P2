import { product_list_create } from '../Javascript/shop_dashboard.js';

describe('product_list_create', () => {
    //test if product elements are created
    it('creates a product list', () => {
        //create test product
        const test_product = {
            id: 1,
            img1_path: 'images/aalborg/dummy.png',
            product_name: 'test product',
            description: 'test',
            specifications: 'test',
            stock: 1,
            price: 200,
            discount: 50
        };

    const product = product_list_create(test_product);

    // Check container
    expect(product.classList.contains('product-card')).toBe(true);

    // Check edit button
    const edit_button = product.querySelector('.edit-button');
    expect(edit_button).not.toBeNull();
    expect(edit_button.dataset.id).toBe('1');

    // Check image
    const image = product.querySelector('.product-image');
    expect(image.src).toContain('images/aalborg/dummy.png');
    expect(image.alt).toBe('test product');

    // Check product info
    const name = product.querySelector('.product-name');
    expect(name.textContent).toBe('test product');

    const desc = product.querySelector('.product-desc');
    expect(desc.textContent).toBe('test');

    const specs = product.querySelector('.product-specs');
    expect(specs.textContent).toBe('test');

    // Check stock count
    const stock = product.querySelector('.stock-count');
    expect(stock.textContent).toBe('1');

    // Check discounted price
    const discounted_price = product.querySelector('.price-discounted');
    expect(discounted_price.textContent).toBe('150 kr.');

    const original_price = product.querySelector('.price-original');
    expect(original_price.textContent).toBe('200 kr.');

    const price_tag = product.querySelector('.price-tag');
    expect(price_tag.textContent).toBe('-50 kr.');

    // Check delete button
    const delete_button = product.querySelector('.delete-button');
    expect(delete_button.dataset.id).toBe('1');
    });

    //test if child functionality works
    it('adds child product class if is_child is true', () => {
        //create test product, and designate it as child
        const test_product = { id: 2, img1_path: '', product_name: '', description: '', specifications: '', stock: 0, price: 0, discount: 0 };
        const product = product_list_create(test_product, true);

        //check if product is a child product
        expect(product.classList.contains('child-product')).toBe(true);
    });
});