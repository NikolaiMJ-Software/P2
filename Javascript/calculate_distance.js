const url = "https://routes.googleapis.com/directions/v2:computeRoutes"; // The URL for using the API
let travelTimesCities = [];
let travelTimesShops = [];

export async function getTravelTime(destination) {  
    try {
        // Fetch shops and cities from the server, and convert to JSON
        const responseShop = await fetch('./shop');
        const response = await fetch('./cities');
        const shops = await responseShop.json();
        const cities = await response.json();

        // Set destination to the requested
        if(destination === 'shops'){
            destination = shops;
        } else if(destination === 'cities') {
            destination = cities;
        }

        // Get user's position, if it's too old it will get a new one 
        let position;
        if (checkLastVisit()){
            console.log("Mere end 5 minutter er gået, beregner ny position.");
            // "position" is the first return from one of the functions
            position = await Promise.race([
                getWatchPositionPromise(),
                getCurrentPositionPromise()
            ]);
        } else {
            position = await getWatchPositionPromise();
        }
        updateLastVisit(); // Update users last visit
        
        // Check if the user's position has change
        if(checkPosition(position)){
            // Calc new travel times
            let travelTimes = calcTravelTimes(position, destination);

            // Save new travel times to the corresponding input
            if(destination === cities){
                travelTimesCities = travelTimes;
            } else if (destination === shops){
                travelTimesShops = travelTimes;
            }
            return travelTimes;

        } else {
            // Return last saved sorted lists 
            if(destination === cities && travelTimesCities.length !== 0 ){
                return travelTimesCities;
            } else if(destination === shops && travelTimesShops.length !== 0){
                return travelTimesShops;
            } else{
                let newTravelTimes = calcTravelTimes(position, destination);

                // Save new travel times to the corresponding input
                if(destination === cities){
                    travelTimesCities = newTravelTimes;
                } else if (destination === shops){
                    travelTimesShops = newTravelTimes;
                }
                return newTravelTimes;
            }
        }

    } catch (error) {
        console.error("Fejl getTravelTime:", error);
        return []; // Return empty array if an error occurs
    }
}

export async function calcTravelTimes(position, destination){
    const progressBar = document.getElementById('loading-progress');
    let completed = 0; // Track progress for the progress bar
    const travelTimes = [];
    try{
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Get API key from server
        const rawAPI = await fetch('./api_key');
        const API = await rawAPI.json();
        const API_KEY = API[0].API_key;

        // Prepare and send requests for multiple destination simultaneously
        const travelTimePromises = destination.map((place) => {
            return calcDistance(userLat, userLon, place.latitude, place.longitude, API_KEY).then((time) => {
                if (time) {
                    // Depending on the return creat travelTimes "name" as city, or the shop_name and id
                    travelTimes.push({ name: place.city || place.shop_name, ...(place.shop_name && { id: place.id }), time: parseInt(time) });
                } else {
                    console.error(`Ingen rute fundet: ${place.city || place.shop_name}`);
                }
                completed++;
                progressBar.value = (completed / destination.length) * 100; // Update progress bar
            });
        });
        
        // Wait for all travel time calculations to complete
        await Promise.all(travelTimePromises);

        // Hide the progress bar after calculation is done
        if (progressBar.value >= 100) {
            progressBar.classList.add('hidden');
        }

        // Sort travel times so the nearest destination comes first
        travelTimes.sort((a, b) => a.time - b.time);
        return travelTimes;

    } catch (error) {
        console.error("Fejl kunne ikke få rejsetider:", error);
        return []; // Return empty array if an error occurs
    }
}

export async function calcDistance(userLat, userLon, destLat, destLon, API_KEY){
    // The necessary requestBody for the API
    const requestBody = {
        origin: { location: { latLng: { latitude: userLat, longitude: userLon } } },
        destination: { location: { latLng: { latitude: destLat, longitude: destLon } } },
        travelMode: "DRIVE", // Traveling method "DRIVE": driving
        routingPreference: "TRAFFIC_AWARE" // Takes into account current traffic, for finding the fastest route
    }

    // Calculate route with API
    try{
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": API_KEY,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters"
        },
            body: JSON.stringify(requestBody)
        });
        const data = await response.json();

        // Remove "s" from duration, and return the time it take for traveling from one point to another in "sec"
        const duration = data.routes[0].duration;
        return duration.slice(0, -1); // Remove "s"

    } catch (error) {
        return; // Stop execution if there's an error
    }
}

// Help function to get first users location
export function getCurrentPositionPromise() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Store the position in localStorage
                localStorage.setItem("newLat", position.coords.latitude);
                localStorage.setItem("newLon", position.coords.longitude);
                resolve({ coords: { latitude: lat, longitude: lon } });
            },
            (error) => {
                console.error("Fejl ingen potition:", error);
                reject(error);
            },
            { enableHighAccuracy: false } // Fast GPS, but less accurate
        );
    });
}

// Function to check if more than 5 minutes have passed
export function checkLastVisit() {
    const lastVisit = localStorage.getItem("lastVisit");
    const now = Date.now();

    // If the last visit timestamp exists and the difference is more than 5 minutes
    if (lastVisit && (now - lastVisit > 5 * 60 * 1000)) {
        // More than 5 minutes have passed, reset coordinates and arraies
        localStorage.removeItem("lastLat");
        localStorage.removeItem("lastLon");
        localStorage.removeItem("newLat");
        localStorage.removeItem("newLon");
        travelTimesCities = [];
        travelTimesShops = [];
        return true; // Indicating that the values have been reset
    }

    // If 5 minutes have not passed, return false
    return false;
}

// Function to update the last visit timestamp
export function updateLastVisit() {
    localStorage.setItem("lastVisit", Date.now());
}

// Help function to update users location
export function getWatchPositionPromise() {
    return new Promise((resolve, reject) => {
        // Try to get last saved position first
        const lastLat = localStorage.getItem("newLat");
        const lastLon = localStorage.getItem("newLon");

        const isTooOld = checkLastVisit();
        if (!isTooOld && lastLat && lastLon) {
            console.log("Bruger sidste kendt potition:", lastLat, lastLon);
            resolve({ coords: { latitude: parseFloat(lastLat), longitude: parseFloat(lastLon) } });
        }

        // Start watching position in the background
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Store updated position
                localStorage.setItem("newLat", position.coords.latitude);
                localStorage.setItem("newLon", position.coords.longitude);
                
                console.log("Opdater lokation:", position.coords.latitude, position.coords.longitude);
                // Return the position if is to old
                if (isTooOld){
                    resolve({ coords: { latitude: lat, longitude: lon } });
                }
            },
            (error) => {
            console.error("Fejl GPS watch:", error);
                if (!lastLat || !lastLon) reject(error); // Reject only if no fallback exists
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0 // Allow only new position
            }
        );

        // Automatically clear watch after 5 minutes to save battery
        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
        }, 5 * 60 * 1000); // 5 minutes
    });
}


// Clac coordinates changes in meters
export function haversineDistanceM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }
    
    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);
    
    const { sin, cos, sqrt, atan2 } = Math;
    
    const R = 6378; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2) + cos(lat1) * cos(lat2) * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a)); 
    const d = R * c;
    return d * 1000; // distance in meters
}

// Save users position
export function savePosition(position) {
    localStorage.setItem("lastLat", position.coords.latitude);
    localStorage.setItem("lastLon", position.coords.longitude);
}

// Check if users position has changed more than 10 meters
export function checkPosition(position) {
    const newLat = position.coords.latitude;
    const newLon = position.coords.longitude;
    const lastLat = parseFloat(localStorage.getItem("lastLat"));
    const lastLon = parseFloat(localStorage.getItem("lastLon"));

    // If the user has a last knowend position, check if it have move more than 10 meters with haversine formular
    if (!isNaN(lastLat) && !isNaN(lastLon)) {
        const distance = haversineDistanceM(lastLat, lastLon, newLat, newLon);
        if (distance > 10) {
            console.log("Brugeren har bevæget sig mere end 10 meter.");
            // Update stored position
            savePosition(position);
            return true;
        } else {
            console.log("Brugeren er inden for 10 meter.");
            return false;
        }
    } else {
        console.log("Brugeren har ingen tidligere lokation.");
        // Update stored position
        savePosition(position);
        return true;
    }
}