import { jest } from '@jest/globals';
import { initAutocomplete } from '../Javascript/new_shop.js';

let place_changed_callback; 

beforeEach(() => {
  // create fake html
  document.body.innerHTML = `
    <input id="address" />
    <input id="latitude" />
    <input id="longitude" />
    <div id="map"></div>
  `;

  // create fake global google object
  global.google = {
    maps: {
      places: {
        Autocomplete: jest.fn().mockImplementation(() => ({
          setFields: jest.fn(),
          addListener: jest.fn((event, callback) => {
            // Save the callback for manual triggering
            place_changed_callback = callback;
          }),
          //define location in lng and lat
          getPlace: jest.fn().mockReturnValue({
            geometry: {
              location: {
                lat: () => 12.34,
                lng: () => 56.78
              }
            }
          })
        }))
      },
      //set map positions on fake google object
      Map: jest.fn(() => ({
        setCenter: jest.fn()
      })),
      Marker: jest.fn(() => ({
        setPosition: jest.fn(),
        setVisible: jest.fn()
      }))
    }
  };
});

//test function to create google maps object on create shop page
describe('initAutocomplete', () => {
  it('initializes autocomplete and map', () => {
    initAutocomplete(); // run function normally

    //trigger the saved callback manually
    place_changed_callback(); 

    // check functions has been called, autocomplete, map and marker and check if lat and lon fits specific input
    expect(google.maps.places.Autocomplete).toHaveBeenCalled();
    expect(google.maps.Map).toHaveBeenCalled();
    expect(google.maps.Marker).toHaveBeenCalled();
    expect(document.getElementById('latitude').value).toBe('12.34');
    expect(document.getElementById('longitude').value).toBe('56.78');
  });
});
