
import { jest } from '@jest/globals';

// Mock the module before importing the tested file
jest.unstable_mockModule('../Javascript/calculate_distance.js', () => ({
  getTravelTime: jest.fn()
}));

// Dynamically import after mocking
const { filters, sortStandart } = await import('../Javascript/filter.js');
const { getTravelTime } = await import('../Javascript/calculate_distance.js');

beforeEach(() => {
  // Setup the checkboxes expected by filters()
  document.body.innerHTML = `
    <input id="distanceFilter" type="checkbox" />
    <input id="priceUpwardFilter" type="checkbox" />
    <input id="priceDownwardFilter" type="checkbox" />
  `;

  // Mock global fetch used in sortStandart
  global.fetch = jest.fn().mockResolvedValue({
    json: jest.fn().mockResolvedValue([
      { id: 1, revenue: 300 },
      { id: 2, revenue: 100 },
      { id: 3, revenue: 200 }
    ])
  });
});
//after each, clear all mocks
afterEach(() => {
  jest.clearAllMocks();
});

//test filter function
describe('filters', () => {
    //test product price ascending
  it('sorts products by price ascending when priceUpwardFilter is checked', async () => {
    //create 3 products with different prices
    const products = [
      { price: 300 },
      { price: 100 },
      { price: 200 }
    ];
    //set price upward filter to true
    document.getElementById('priceUpwardFilter').checked = true;

    //test if product at sorted with the lowest value first and decending
    const sorted = await filters(products);
    expect(sorted.map(p => p.price)).toEqual([100, 200, 300]);
  });
  //test product price descending
  it('sorts products by price descending when priceDownwardFilter is checked', async () => {
    //create test products with different prices
    const products = [
      { price: 100 },
      { price: 200 },
      { price: 300 }
    ];
    //toggle price down ward filter
    document.getElementById('priceDownwardFilter').checked = true;

    //test if prices are sorted from highest to lowest price
    const sorted = await filters(products);
    expect(sorted.map(p => p.price)).toEqual([300, 200, 100]);
  });

  //sort products based on travel time
  it('sorts products by shop travel time when distanceFilter is checked', async () => {
    //create 3 products with 3 different shop ids
    const products = [
      { shop_id: 1 },
      { shop_id: 2 },
      { shop_id: 3 }
    ];

    //set distance filter to true
    document.getElementById('distanceFilter').checked = true;

    //check travel time, using the fake travel time function which will set the order to 2,3 and 1
    getTravelTime.mockResolvedValue([
      { id: 2 },
      { id: 3 },
      { id: 1 }
    ]);

    //check if order is right based on fake travel time calculation
    const sorted = await filters(products);
    expect(sorted.map(p => p.shop_id)).toEqual([2, 3, 1]);
  });
});

//test sortstandart function
describe('sortStandart', () => {
    //test the standard setup
  it('returns top 3 most bought products followed by smallest shop revenue order', async () => {
    //create fake products
    const products = [
      { id: 1, shop_id: 3, bought: 10 },
      { id: 2, shop_id: 2, bought: 30 },
      { id: 3, shop_id: 1, bought: 20 },
      { id: 4, shop_id: 2, bought: 5 }
    ];

    //await the sortstandard function
    const sorted = await sortStandart(products);

    // Top 3 bought products first
    expect(sorted.slice(0, 3).map(p => p.id)).toEqual([2, 3, 1]);

    // Remaining should be ordered by smallest shop revenue (based on mocked shop data)
    expect(sorted.map(p => p.id)).toContain(4);
  });
});


