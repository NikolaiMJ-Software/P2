import { displayAverageRating, sanitizeInput } from '../Javascript/comments.js';


describe('sanitizeInput', () => {
    it('removes dangerous HTML and special chars', () => {
      expect(sanitizeInput('<script>alert(1)</script>Hej!')).toBe('alert(1)Hej!');
      expect(sanitizeInput('<>Bad!')).toBe('Bad!');
    });
  });
  
  describe('displayAverageRating', () => {
    it('displays 4.5 stars correctly', () => {
      document.body.innerHTML = '<div id="average-rating-display"></div>';
      displayAverageRating(4.5, 10);
      expect(document.getElementById('average-rating-display').textContent).toContain('⯪');
      expect(document.getElementById('average-rating-display').textContent).toContain('★');
    });
  });