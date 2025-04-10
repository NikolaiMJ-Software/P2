const city_select = document.getElementById('city');
const form = document.getElementById('signup-form');
const error_message = document.getElementById('error-message');

document.addEventListener('DOMContentLoaded', async () => {
    try{
        const res = await fetch('./get_cities');
        const cities = await res.json();
    
    
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.city;
            city_select.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const lat = form.latitude.value;
        const long = form.longitude.value;


        if (!lat || !long) {
            error_message.textContent = "Vælg en adresse fra listen for at få koordinater.";
            return;
        }


        const form_data = new FormData(form);

        const update_res = await fetch("./new_shop",{
            method: "POST",
            body: form_data,
        });
        
            if (update_res.ok) {
                alert("Butikken er blevet tilføjet.");
                window.location.href = './signup';
            } else {
                const error_text = await update_res.text();
                error_message.textContent = error_text;
            }
    });
});

let autocomplete;
let map;
let marker;

function initAutocomplete() {
    const input = document.getElementById("address");
    autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.setFields(["geometry", "formatted_address"]);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();

        if (!place.geometry) {
            console.error("No geometry data found.");
            return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;

        // Update map
        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
        marker.setVisible(true);
    });

    // Init map
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 56.2639, lng: 9.5018 }, // Denmark center
        zoom: 6,
    });

    marker = new google.maps.Marker({
        map: map,
        visible: false,
    });
}

// Attach to window so Google API can call it
window.initAutocomplete = initAutocomplete;
