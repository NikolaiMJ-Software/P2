import { haversineDistanceM } from '../Javascript/calculateDistance.js';

describe('haversineDistanceM', () => {
  it('returns 0 when positions are the same', () => {
    expect(haversineDistanceM(1, 2, 1, 2)).toBe(0);
  });

  it('returns approx. 111195 meters between (0,0) and (1,0)', () => {
    expect(Math.round(haversineDistanceM(0, 0, 1, 0))).toBeCloseTo(111195, -3);
  });
});



