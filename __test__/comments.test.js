import { displayAverageRating, sanitizeInput } from '../Javascript/comments.js';

//test sanitize function
describe('sanitizeInput', () => {
    it('removes dangerous HTML and special chars', () => {
      //test if functions removes illegal input as <> and everything within
      expect(sanitizeInput('<script>alert(1)</script>Hej!')).toBe('alert(1)Hej!');
      expect(sanitizeInput('<>Bad!')).toBe('Bad!');
    });
  });
  
  //test display rating function
  describe('displayAverageRating', () => {
    it('displays 4.5 stars correctly', () => {
      //make test html with the display rating module
      document.body.innerHTML = '<div id="average-rating-display"></div>';
      //set the dispplay average of 4.5, so we will have 4.5 stars out of 5 stars
      displayAverageRating(4.5);
      //test if the html contains stars equal to the rating
      expect(document.getElementById('average-rating-display').textContent).toContain('⯪');
      expect(document.getElementById('average-rating-display').textContent).toContain('★');
      expect(document.getElementById('average-rating-display').textContent).not.toContain('☆');
    });
  });