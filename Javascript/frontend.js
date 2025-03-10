console.log("Floating hearts script loaded!");

function createHeart() {
    const heart = document.createElement("div");
    heart.classList.add("heart");
    heart.innerHTML = "🙉"; // Heart emoji
    document.getElementById("hearts-container").appendChild(heart);

    // Randomize position
    heart.style.left = Math.random() * 100 + "vw";
    heart.style.animationDuration = (Math.random() * 3 + 2) + "s"; // Random speed

    // Remove heart after animation ends
    setTimeout(() => {
        heart.remove();
    }, 5000);
}

// Start heart animation every 300ms
setInterval(createHeart, 300);
