  document.addEventListener('DOMContentLoaded', () => {
  console.log("comments.js loaded");

  const params = new URLSearchParams(window.location.search);
  const product_id = params.get('id');
  const shop_id = params.get('shop_id');
  console.log("Product ID:", product_id);
  console.log("Shop ID:", shop_id);

  const commentList = document.getElementById('comments-list');
  const submitBtn = document.getElementById('submit-rating');
  const commentInput = document.getElementById('user-comment');
  const modal = document.getElementById('rating-modal');

  const openBtn = document.getElementById('open-rating-popup');
  const closeBtn = document.getElementById('close-rating-modal');
  const avgStars = document.getElementById('average-rating-display');

  let userName = null;
  let isLoggedIn = false;
  let hasCommented = false;
  let selectedRating = 0;
  let allComments = [];
  // Open popup
  openBtn?.addEventListener('click', () => {
    if (!isLoggedIn) {
      alert("Du skal være logget ind for at kunne anmelde eller kommentere");
      return;
    }
if (hasCommented) {
  if (confirm("Du har allerede skrevet en kommentar til dette produkt. Vil du opdatere den?")) {
    // Pre-fill comment box and stars
    const previousComment = allComments.find(c => c.name === userName);
    if (previousComment) {
      commentInput.value = previousComment.comment;
      selectedRating = previousComment.rating;

      stars.forEach(s => {
        const val = parseInt(s.dataset.value);
        s.classList.toggle('selected', val <= selectedRating);
      });
    }

    modal.style.display = 'flex';
  }
  return;
}

    modal.style.display = 'flex';
  });
  avgStars?.addEventListener('click', () => {
    if (!isLoggedIn) {
      alert("Du skal være logget ind for at kunne anmelde eller kommentere");
      return;
    }
    if (hasCommented) {
      if (confirm("Du har allerede skrevet en kommentar til dette produkt. Vil du opdatere den?")) {
        // Pre-fill comment box and stars
        const previousComment = allComments.find(c => c.name === userName);
        if (previousComment) {
          commentInput.value = previousComment.comment;
          selectedRating = previousComment.rating;
    
          stars.forEach(s => {
            const val = parseInt(s.dataset.value);
            s.classList.toggle('selected', val <= selectedRating);
          });
        }
    
        modal.style.display = 'flex';
      }
      return;
    }
    
    modal.style.display = 'flex';
  });

  // Close popup
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Load comments from server
  function loadComments() {
    let id = '';
    if (product_id) {
      id = `./comments?product_id=${product_id}`;
    } else if (shop_id) {
      id = `./comments?shop_id=${shop_id}`;
    } else {
      return; // no ID, no fetch
    }
  
    fetch(id)
      .then(res => res.json())
      .then(comments => {
        allComments = comments;
        // Clear both containers
        commentList.innerHTML = '';
        const bottomList = document.getElementById('comments-list-bottom');
        if (bottomList) bottomList.innerHTML = '';
  
        comments.forEach(c => {
          const li = document.createElement('li');
          li.style.marginBottom = '12px'; // spacing
        
          let starsHTML = '';
          let rating = Math.min(c.rating || 0, 5); // cap at 5
          const full = Math.floor(rating);
          const half = (rating % 1 >= 0.5);
          for (let i = 0; i < full; i++) starsHTML += '★';
          for (let i = full + (half ? 1 : 0); i < 5; i++) starsHTML += '☆';

          li.innerHTML = `
            <div>
              <strong>${c.name}</strong> 
              <span class="average-stars">${starsHTML}</span>
            </div>            <div>${c.comment}</div>
            <small>${new Date(c.timestamp).toLocaleString()}</small>
          `;
        
          commentList.appendChild(li);
          if (bottomList) bottomList.appendChild(li.cloneNode(true));
        });

        if (isLoggedIn && userName) {
          hasCommented = comments.some(c => c.name === userName);
        }
      });
  }


  // "sanitize" user input
  function sanitizeInput(input) {
    // Create a temporary DOM element
    const doc = new DOMParser().parseFromString('<!doctype html><body>' + input, 'text/html');
    const sanitizedInput = doc.body.textContent || doc.body.innerText;  // Get the text content, stripping out any HTML tags

    //allow only specific characters
    return sanitizedInput.replace(/[^a-zA-Z0-9\s.,!?-]/g, ''); // Removes anything other than letters, numbers, and a few punctuation marks
}
  // Handle submission
  submitBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
      alert("Du skal være logget ind for at kunne anmelde eller kommentere");
      return;
    }

    const name = sanitizeInput(userName); // sanitize the name
    const comment = sanitizeInput(commentInput.value.trim()); // sanitize the comment

    if (!comment) {
      alert("Indtast venligst en kommentar");
      return;
    }


    const payload = {
      name,
      comment,
      rating: selectedRating
    };
  
    if (product_id) {
      payload.product_id = product_id;
    } else if (shop_id) {
      payload.shop_id = shop_id;
    } else {
      alert("Der mangler et produkt- eller butik-ID");
      return;
    }
  

    fetch('./comment', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        commentInput.value = '';
        modal.style.display = 'none'; //close after submit
        loadComments();
        fetchAverageRating(); // update average after new rating
        hasCommented = true;
      });
  });

  fetch('./user_logged_in')
    .then(res => res.json())
    .then(data => {
      isLoggedIn = data.logged_in;
      if (isLoggedIn) {
        userName = data.name || data.email;
      }
      loadComments(); // Call after checking login
    });

  // Get all stars inside the rating "box"
  const stars = document.querySelectorAll('#star-rating .star');

  // Loop through and apply events
  stars.forEach(star => {
    const value = parseInt(star.dataset.value);

    star.addEventListener('mouseover', () => {
      stars.forEach(s => {
        s.classList.toggle('hovered', parseInt(s.dataset.value) <= value);
      });
    });

    star.addEventListener('mouseout', () => {
      stars.forEach(s => s.classList.remove('hovered'));
    });

    star.addEventListener('click', () => {
      selectedRating = value;
      stars.forEach(s => {
        s.classList.toggle('selected', parseInt(s.dataset.value) <= value);
      });
    });
  });

  // Fetch and display average star rating
  function fetchAverageRating() {
    let id = '';
    if (product_id) {
      id = `./rating?product_id=${product_id}`;
    } else if (shop_id) {
      id = `./rating?shop_id=${shop_id}`;
    } else {
      return; // no ID, no fetch
    }
    fetch(id)
      .then(res => res.json())
      .then(data => {
        displayAverageRating(data.average, data.count);
      });
  }

  // Render star icons based on average
  function displayAverageRating(average, count) {
    const container = document.getElementById('average-rating-display');
    container.innerHTML = '';

    if (!average) {
//      container.innerHTML = 'Der er endnu ingen bedømmelser';
      container.innerHTML = '☆☆☆☆☆';
      return;
    }
  // Calculate the number of full stars (meaning whole number part of the average)
    const fullStars = Math.floor(average);
  // If the decimal part of the average is 0.5 or more, show one half star
    const hasHalf = average % 1 >= 0.5;

    // Add full star icons (★) equal to the number of whole stars
    for (let i = 0; i < fullStars; i++) {
      container.innerHTML += '★';
    }
    // add a halfstar (⯪) if average is above 0.5
    if (hasHalf) container.innerHTML += '⯪';

    // Add empty stars (☆) for the remaining stars to complete 5 total
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) {
      container.innerHTML += '☆';
    }
    //show the average
    container.innerHTML += ` (${average})`;
  }

  fetchAverageRating();
});
