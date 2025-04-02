document.addEventListener('DOMContentLoaded', () => {
  const productId = new URLSearchParams(window.location.search).get('id');

  const commentList = document.getElementById('comments-list');
  const submitBtn = document.getElementById('submit-rating');
  const nameInput = document.getElementById('user-name');
  const commentInput = document.getElementById('user-comment');
  const modal = document.getElementById('rating-modal');

  // ✅ ADD these lines to control the popup
  const openBtn = document.getElementById('open-rating-popup');
  const closeBtn = document.getElementById('close-rating-modal');

  openBtn?.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  function loadComments() {
    fetch(`/comments?product_id=${productId}`)
      .then(res => res.json())
      .then(comments => {
        commentList.innerHTML = '';
        comments.forEach(c => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${c.name}</strong>: ${c.comment}<br><small>${new Date(c.timestamp).toLocaleString()}</small>`;
          commentList.appendChild(li);
        });
      });
  }

  submitBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const comment = commentInput.value.trim();

    if (!comment) {
      alert("Please enter a comment.");
      return;
    }

    fetch('/comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, name, comment })
    })
      .then(res => res.json())
      .then(() => {
        nameInput.value = '';
        commentInput.value = '';
        
        loadComments();
      });
  });

  loadComments();
});
