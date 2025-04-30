import { haversineDistanceM, checkPosition, savePosition, updateLastVisit, checkLastVisit } from '../Javascript/calculate_distance.js';

describe('haversineDistanceM', () => {
  //test if two points have a distance of 0
  it('returns 0 when positions are the same', () => {
    expect(haversineDistanceM(1, 2, 1, 2)).toBe(0);
  });
  //check on a distance of 111 km (111195 meters), with a calcualtion error on -3
  it('returns approx. 111195 meters between (0,0) and (1,0)', () => {
    expect(Math.round(haversineDistanceM(0, 0, 1, 0))).toBeCloseTo(111195, -3);
  });
});

//check positon for user
describe('checkPosition', () => {
  //for every test clear local storage
  beforeEach(() => {
    localStorage.clear();
  });

  //checks when user has moved 10 meters
  it('returns true if user moved more than 10 meters', () => {
    //define local storage with long and lat being 0
    localStorage.setItem('lastLat', '0');
    localStorage.setItem('lastLon', '0');
    //define new position to have moved around 111 meters
    const position = { coords: { latitude: 0.001, longitude: 0 } }; // around 111 meters north
    //check if user has moved more then 10 meters
    expect(checkPosition(position)).toBe(true);
  });

  //checks if user has moved less then 10 meters
  it('returns false if user moved less than 10 meters', () => {
    //define local storage long and lat to 0
    localStorage.setItem('lastLat', '0');
    localStorage.setItem('lastLon', '0');
    //define movement to be 1 meter
    const position = { coords: { latitude: 0, longitude: 0.00001 } }; // around 1 meter east
    //check if false which means user has moved less then 10 meters
    expect(checkPosition(position)).toBe(false);
  });

  //check if user has any previous location
  it('returns true if no previous location exists', () => {
    //defines current location
    const position = { coords: { latitude: 0, longitude: 0 } };
    //if no preivous location, then true
    expect(checkPosition(position)).toBe(true);
  });
});

describe('savePosition', () => {
    //for every test clear local storage
    beforeEach(() => {
      localStorage.clear();
    });

    //check if lat and long is specific value in localstorage
    it('saves latitude and longitude into localStorage', () => {
      //define current position and save in local
      const position = { coords: { latitude: 10, longitude: 20 } };
      savePosition(position);
      //check if value is equal to same value saved
      expect(localStorage.getItem('lastLat')).toBe('10');
      expect(localStorage.getItem('lastLon')).toBe('20');
      //check if value is not equal to value saved
      expect(localStorage.getItem('lastLat')).not.toBe('20');
      expect(localStorage.getItem('lastLon')).not.toBe('10');
    });
});

describe('updateLastVisit and checkLastVisit', () => {
      //for every test clear local storage
      beforeEach(() => {
        localStorage.clear();
      });

      //checks that last visit on page is less then 5 minutes, if less reset position
      it('should not reset if less than 5 minutes passed', () => {
        //saves the current time stamp
        updateLastVisit();
        //checks if more then 5 minutes has passed since last save
        expect(checkLastVisit()).toBe(false);
      });

      //checks 
      it('should reset if more than 5 minutes passed', () => {
        //defines last time stamp as 6 minutes ago
        const past_time = Date.now() - 6 * 60 * 1000; //6 minutes ago
        //save last time stamp in local storage
        localStorage.setItem('lastVisit', past_time);
        //checks if more then 5 minutes has passed since last save
        expect(checkLastVisit()).toBe(true);
      });
});