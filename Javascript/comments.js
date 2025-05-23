  // Render star icons based on average
  export function displayAverageRating(average) {
    const container = document.getElementById('average-rating-display');
    container.replaceChildren();

    if (!average) {
      container.textContent = '☆☆☆☆☆';
      return;
    }

    // Calculate the number of full stars (meaning whole number part of the average)
    const fullStars = Math.floor(average);

    // If the decimal part of the average is 0.5 or more, show one half star
    const hasHalf = average % 1 >= 0.5;
    
    // Add full star icons (★) equal to the number of whole stars
    for (let i = 0; i < fullStars; i++) {
      container.append('★');
    }
    
    // add a halfstar (⯪) if average is above 0.5
    if (hasHalf) container.append('⯪');
    
    // Add empty stars (☆) for the remaining stars to complete 5 total
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) {
      container.append('☆');
    }
    //show the average
    container.append(` (${average})`);
  }

    // "sanitize" user input
    export function sanitizeInput(input) {
      // Create a temporary DOM element
      const doc = new DOMParser().parseFromString('<!doctype html><body>' + input, 'text/html');
      const sanitizedInput = doc.body.textContent || doc.body.innerText;  // Get the text content, stripping out any HTML tags
  
      //allow only specific characters
      return sanitizedInput.replace(/[^!-;=?-z\sæøåÆØÅ]/g, ''); // Removes anything other than letters, numbers, and a few punctuation marks
    }

document.addEventListener('DOMContentLoaded', () => {
  console.log("comments.js loaded");

  const params = new URLSearchParams(window.location.search);
  const product_id = params.get('id');
  const shop_id = params.get('shop_id');
  console.log("Product ID:", product_id);
  console.log("Shop ID:", shop_id);

  //define HTML elements
  const commentList = document.getElementById('comments-list');
  const submitBtn = document.getElementById('submit-rating');
  const commentInput = document.getElementById('user-comment');
  const modal = document.getElementById('rating-modal');

  const closeBtn = document.getElementById('close-rating-modal');
  const avgStars = document.getElementById('average-rating-display');

  //userinfo
  let userName = null;
  let userEmail = null;
  let isLoggedIn = false;
  let hasCommented = false;
  let selectedRating = 0;
  let allComments = [];

  //charcount
  const charCountDisplay = document.getElementById('comment-char-count');
  const maxChars = 400;

  // Open popup
  avgStars?.addEventListener('click', () => {
    modal.style.display = 'flex';
  
  // display alert in the case of user not being logged in.
    if (!isLoggedIn) {
      alert("Du er ikke logget ind. Du kan stadig læse kommentarer, men ikke skrive nogen.");
      return;
    }
  //if the user has commented, allow for updates.
    if (hasCommented) {
      if (confirm("Du har allerede skrevet en kommentar til dette produkt. Vil du opdatere den?")) {
        // Pre-fill comment box and stars
        const previousComment = allComments.find(c => c.email === userEmail);
        if (previousComment) {
          commentInput.value = previousComment.comment;

          // Update char count display
          charCountDisplay.textContent = `${previousComment.comment.length} / ${maxChars} tegn`;
          charCountDisplay.style.color = previousComment.comment.length > maxChars ? 'red' : '';
          selectedRating = previousComment.rating;
  
          stars.forEach(s => {
            const val = parseInt(s.dataset.value);
            s.classList.toggle('selected', val <= selectedRating);
          });
        }
      } else {
        return;
      }
    }
  });

  // Close popup
  closeBtn?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  //charcount
  commentInput.addEventListener('input', () => {
    const currentLength = commentInput.value.length;
    charCountDisplay.textContent = `${currentLength} / ${maxChars} tegn`;
    charCountDisplay.style.color = currentLength > maxChars ? 'red' : '';
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
        commentList.replaceChildren();
        const bottomList = document.getElementById('comments-list-bottom');
        if (bottomList) bottomList.replaceChildren();


        comments.forEach(c => {
          const li = document.createElement('li');
          li.style.marginBottom = '12px'; // spacing

          const nameAndStars = document.createElement('div');
          const name = document.createElement('strong');
          name.textContent = c.name;

          //star calculation
          const starsSpan = document.createElement('span');
          starsSpan.className = 'comment-stars';
          let starsHTML = '';
          let rating = Math.min(c.rating || 0, 5); // cap at 5
          const full = Math.floor(rating);
          const half = (rating % 1 >= 0.5);
          for (let i = 0; i < full; i++) starsHTML += '★';
          for (let i = full + (half ? 1 : 0); i < 5; i++) starsHTML += '☆';
          starsSpan.textContent = starsHTML;

          nameAndStars.appendChild(name);
          nameAndStars.appendChild(starsSpan);

          //handeling comments
          const commentText = document.createElement('div');
          commentText.textContent = c.comment;

          const time = document.createElement('small');
          time.textContent = new Date(c.timestamp).toLocaleString();

          li.appendChild(nameAndStars);
          li.appendChild(commentText);
          li.appendChild(time);

          commentList.appendChild(li);

          //add to bottom list
          if (bottomList) bottomList.appendChild(li.cloneNode(true));
        });

        if (isLoggedIn && userName) {
          hasCommented = comments.some(c => c.name === userName);
        }
      });
  }

  // Handle submission
  submitBtn.addEventListener('click', () => {
    if (!isLoggedIn) {
      alert("Du skal være logget ind for at kunne anmelde eller kommentere");
      return;
    }

    //stop the comment from submitting if its too large
    const rawComment = commentInput.value.trim();
    if (rawComment.length > maxChars) {
      charCountDisplay.style.color = 'red';
      return;
    }

    const name = sanitizeInput(userName); // sanitize the name
    const comment = sanitizeInput(commentInput.value.trim()); // sanitize the comment

    if (!comment) {
      alert("Indtast venligst en kommentar");
      return;
    }

    //the contents of a comment
    const payload = {
      name,
      comment,
      rating: selectedRating
    };

    //add the payload to either a product or shop by given id
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
        charCountDisplay.textContent = `0 / ${maxChars} tegn`;
        charCountDisplay.style.color = '';
        modal.style.display = 'none'; //close after submit
        loadComments();
        fetchAverageRating(); // update average after new rating
        hasCommented = true;
      });
  });

  //handle login
  fetch('./user_logged_in')
    .then(res => res.json())
    .then(data => {
      isLoggedIn = data.logged_in;
      if (isLoggedIn) {
        userName = data.name;
        userEmail = data.email;
      }
      const ratingInputArea = document.getElementById('rating-input-area');
      if (!isLoggedIn && ratingInputArea) {
        ratingInputArea.style.display = 'none';
      }
      loadComments(); // Call after checking login
    });

  // Get all stars inside the rating "box"
  const stars = document.querySelectorAll('#star-rating .star');

// Add interactive behavior to each star
  stars.forEach(star => {
    const value = parseInt(star.dataset.value);

      // When mouse hovers over a star, highlight all stars up to that one
    star.addEventListener('mouseover', () => {
      stars.forEach(s => {
        s.classList.toggle('hovered', parseInt(s.dataset.value) <= value);
      });
    });

    // When mouse leaves the star, remove all hover highlights
    star.addEventListener('mouseout', () => {
      stars.forEach(s => s.classList.remove('hovered'));
    });

    // When a star is clicked, set the selected rating
    star.addEventListener('click', () => {
      selectedRating = value;  // Save the rating for submission  
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
        displayAverageRating(data.average);
      });
  }

  fetchAverageRating();
});
