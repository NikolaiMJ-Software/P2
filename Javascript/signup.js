import { updateLastVisit } from './calculate_distance.js';

const check_box = document.getElementById('shop_user');
const city_select = document.getElementById('city');
const store_select = document.getElementById('store');

//when page is loaded do the following:
document.addEventListener('DOMContentLoaded', () => {
    updateLastVisit(); // Update users last visit
    //define the singup form as an variable (currently empty)
    const form = document.getElementById('signup-form');
    //define the error message element (currently empty)
    const error_message = document.getElementById('error-message');

    //wait for submit button click
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        //define name, email, password and shop_id from the signup form and drop down store selector
        const name = form.fornavn.value + " " + form.efternavn.value;
        const email = form.email.value.toLowerCase();
        const password = form.password.value;
        const shop_id = store_select.value || null;

        //variable which checks if mails are valid
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        //test mail, if not valid sent error
        if (!email_regex.test(email)) {
            error_message.textContent = 'Ugyldig e-mailadresse.';
            return;
        }
        
        //Generate authetication key and email for account
        const generate_key_response = await fetch('./generate_key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: email })
        });
        const generated_key = await generate_key_response.json();
        if(!generated_key.success){
            alert("Kunne ikke generere nøgle til din email, hvis du lige har genereret en nøgle, så vendt 5 minutter og prøv igen");
            return;
        }

        //Sends authenticates email and logs signup data if verification goes through
        let key = prompt("Indtast den nøgle der er blevet sendt til din email. Der kan gå nogle minutter før den ankommer.", "Din kode");
        const response_signup = await fetch('./authenticate_email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: email, key: key, name: name, password: password, shop_id: shop_id })
        });
        const auth_response = await response_signup.json();
        console.log(auth_response);

        //if account is created, change to login page, if not sent error
        if (auth_response.success == true) {
            window.location.href = './login';
        } else {
            error_message.textContent = auth_response.success;
        }
    });
});

//set store and city selector to invisible on page load
city_select.parentElement.style.display = 'none';
store_select.parentElement.style.display = 'none';

//add checkbox functionality that sets city selector to visible if checked, and bot city and store selector to invisible if unchecked
check_box.addEventListener('change', async () =>{
    if (check_box.checked){
        city_select.parentElement.style.display = 'block';
        await load_cities();
    } else{
        city_select.parentElement.style.display = 'none';
        store_select.parentElement.style.display = 'none';
    }
});

//event listener which listens to city selector change
city_select.addEventListener('change', async () => {
    //if there is a value make store selector visible, and use load stores function
    if(city_select.value){
        store_select.parentElement.style.display = 'block';
        await load_stores(city_select.value);
    }
    //else set store selector to invisible
    else{
        store_select.parentElement.style.display = 'none';
    }
});

//function that loads cities
async function load_cities(){
    //fetches back end data from the get cities route
    const res = await fetch('./get_cities');
    const cities = await res.json();

    //goes over all cities from backend, and appends them to city selector
    cities.forEach(city => {
        const option = document.createElement('option'); //create option
        option.value = city.id; //give city option its city id
        option.textContent = city.city; //give city option its city name
        city_select.appendChild(option); //append option
    });
}

//function to load stores, with a city id as input
async function load_stores(city_id){
    //fetch stores with specific city id from back end
    const res = await fetch(`./get_stores?city_id=${encodeURIComponent(city_id)}`);
    const stores = await res.json();

    //append each store to the store selector
    stores.forEach(store => {
        const option = document.createElement('option'); //create store option
        option.value = store.id; //set store id
        option.textContent = store.shop_name; //set store name
        store_select.appendChild(option); //append store to store selector
    });
}