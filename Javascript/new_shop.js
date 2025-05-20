const city_select = document.getElementById('city');
const form = document.getElementById('signup-form');
const error_message = document.getElementById('error-message');

//on page load, load following functions
document.addEventListener('DOMContentLoaded', async () => {
    try{
        //fetching all cities
        const res = await fetch('./get_cities');
        const cities = await res.json();
    
        //foreach city create a city option in dropdown menu
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.city;
            city_select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
    }
    //on submit, submit everything in form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        //define lat, long and email
        const lat = form.latitude.value;
        const long = form.longitude.value;
        const email = form.email.value;


        //if lat and long is missing, sent error
        if (!lat || !long) {
            error_message.textContent = "Vælg en adresse fra listen for at få koordinater.";
            return;
        }

        //variable which checks if mails are valid
        const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        //test mail, if not valid sent error
        if (!email_regex.test(email)) {
            error_message.textContent = 'Ugyldig e-mailadresse.';
            return;
        }
        
        //create variable for all form data
        const form_data = new FormData(form);

        //sent data to backend
        const update_res = await fetch("./new_shop",{
            method: "POST",
            body: form_data,
        });
        
        if (update_res.ok) {
            alert("Butikken er blevet tilføjet.");
            history.back();
        } else {
            const error_text = await update_res.text();
            error_message.textContent = error_text;
        }
    });
});

//create 3 global variables
let autocomplete;
let map;
let marker;
//function to auto update map on load
export function initAutocomplete() {
    //define address as input
    const input = document.getElementById("address");
    autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.setFields(["geometry", "formatted_address"]);

    //check if user can find google maps data
    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
            console.error("No geometry data found.");
            return;
        }

        //define lat and lng as geometric location points
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;

        // Update map
        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
        marker.setVisible(true);
    });

    // sets map standard to the center of denmark
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 56.2639, lng: 9.5018 }, // Denmark center
        zoom: 6,
    });

    //make marker on map
    marker = new google.maps.Marker({
        map: map,
        visible: false,
    });
}

// Attach to window so Google API can call it
window.initAutocomplete = initAutocomplete;
