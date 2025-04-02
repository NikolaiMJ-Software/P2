document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('rating-modal');
    const openBtn = document.getElementById('open-rating-popup');
    const closeBtn = document.getElementById('close-rating-modal');
  
    openBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
    });
  
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  });
  