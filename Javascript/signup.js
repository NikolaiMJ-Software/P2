document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = form.fornavn.value + " " + form.efternavn.value;
        const email = form.email.value;
        const password = form.password.value;

        const response = await fetch('./signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            window.location.href = './login';
        } else {
            const errorText = await response.text();
            errorMessage.textContent = errorText;
        }
    });
});