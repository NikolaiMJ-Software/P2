//funktionalitet der venter på at submit knappen er trykket på, og poster email og password i headeren der bliver sendt videre
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = form.email.value.toLowerCase();
        console.log(email)
        const password = form.password.value;

        const response = await fetch('./login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            window.location.href = localStorage.getItem("currentPage");
        } else {
            const errorText = await response.text();
            errorMessage.textContent = errorText;
        }
    });
});

