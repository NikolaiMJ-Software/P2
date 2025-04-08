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


const check_box = document.getElementById('shop_user');
const city_select = document.getElementById('city');
const store_select = document.getElementById('store');
const city_id = '';

city_select.parentElement.style.display = 'none';
store_select.parentElement.style.display = 'none';

check_box.addEventListener('change', async () =>{
    if (check_box.checked){
        city_select.parentElement.style.display = 'block';
        await load_cities();
    } else{
        city_select.parentElement.style.display = 'none';
        store_select.parentElement.style.display = 'none';
    }
});

city_select.addEventListener('change', async () => {
    if(city_select.value){
        store_select.parentElement.style.display = 'block';
        await load_stores();
    }else{
        store_select.parentElement.style.display = 'none';
    }
});

async function load_cities(){
    const res = await fetch('./get_cities');
    const cities = await res.json();

    city_select.innerHTML = `<option value="">Ingen</option>`;
    cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city.name;
        city_select.appendChild(option);
    });
}

async function load_stores(){
    const res = await fetch('./get_stores');
    const stores = await res.json();

    store_select.innerHTML = `<option value="">Ingen</option>`;
    stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.name;
        store_select.appendChild(option);
    });
}