const API_KEY = "AIzaSyDdPn6PpVzepa89hD6F8xt0Po1TnAt_9SQ"; // Replace with yours Google API-key
const url = "https://routes.googleapis.com/directions/v2:computeRoutes"; // The URL for using the API
const travelTimesCities = [];
const travelTimesShops = [];

export async function getTravelTime(destination) {  
    try {
        // Get user's position 
        const position = await getWatchPositionPromise();
        
        // Check if the user's position has change
        if(checkPosition(position)){
            // Calc new travel times
            console.log('Starting calc new traveltimes');
            let travelTimes = calcTravelTimes(position, destination);

            // Save new travel times to the corresponding input
            if(destination?.cities){
                travelTimesCities.splice(0, travelTimesCities.length, ...travelTimes);
            } else if (destination?.shops){
                travelTimesShops.splice(0, travelTimesShops.length, ...travelTimes);
            }
            return travelTimes;

        } else {
            console.log('Return saved traveltimes');

            // Return last saved sorted lists 
            if(destination?.cities && travelTimesCities !== 0 ){
                return travelTimesCities;
            } else if(destination?.shops && travelTimesShops != 0){
                return travelTimesShops;
            } else{
                return calcTravelTimes(position, destination);
            }
        }

    } catch (error) {
        console.error("Error no GPS:", error);
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

        // Prepare and send requests for multiple destination simultaneously
        const travelTimePromises = destination.map((place) => {
            return calcDistance(userLat, userLon, place.latitude, place.longitude) // Return promise
            .then((time) => {
            if (time) {
                travelTimes.push({ name: place.city || place.shop_name, ...(place.shop_name && { id: place.id }), time: parseInt(time) });
            } else {
                console.error(`No route found for: ${place.city || place.shop_name}`);
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
        console.error("Error fetching travel times:", error);
        return []; // Return empty array if an error occurs
    }
}

export async function calcDistance(userLat, userLon, destLat, destLon){
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
        /* Debugging - check the return data
        console.log(data);
        */

        // Remove "s" from duration, and return the time it take for traveling from one point to another in "sec"
        const duration = data.routes[0].duration;
        return duration.slice(0, -1); // Remove "s"

    } catch (error) {
        return; // Stop execution if there's an error
    }
}

// Help function to get first location from user
export function getCurrentPositionPromise() {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Store the position in localStorage
                localStorage.setItem("lastLat", position.coords.latitude);
                localStorage.setItem("lastLon", position.coords.longitude);
                console.log("Stored position in localStorage:", position.coords.latitude, position.coords.longitude);
                
                // Resolve with the position
                resolve();
            },
            (error) => {
                console.error("Error getting position:", error);
                reject(error);
            },
            {
                enableHighAccuracy: false,
                maximumAge: 10000, // Cache position for up to 10 sec
            }
        );
    });
}

// Help function to update users location
export function getWatchPositionPromise() {
    return new Promise((resolve, reject) => {
        // Try to get last saved position first
        const lastLat = localStorage.getItem("getLastLat");
        const lastLon = localStorage.getItem("getLastLon");

        if (lastLat && lastLon && !("geolocation" in navigator)) {
            console.log("Using last known position:", lastLat, lastLon);
            resolve({ coords: { latitude: parseFloat(lastLat), longitude: parseFloat(lastLon) } });
        }

        // Start watching position in the background
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                // Store updated position
                localStorage.setItem("getLastLat", position.coords.latitude);
                localStorage.setItem("getLastLon", position.coords.longitude);
                
                console.log("Updated background location:", position.coords.latitude, position.coords.longitude);
            
            },
            (error) => {
            console.error("GPS error:", error);
                reject(); // Reject only if no fallback exists
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000 // Allow cached positions up to 10 sec old
            }
        );

        // Automatically clear watch after 5 minutes to save battery
        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            console.log("Stopped watching position to save battery.");
            }, 300000); // 5 minutes
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

    if (!isNaN(lastLat) && !isNaN(lastLon)) {
        const distance = haversineDistanceM(lastLat, lastLon, newLat, newLon);
        console.log(`Moved: ${distance.toFixed(2)} meters`);
        
        if (distance > 10) {
            console.log("User has moved more than 10 meters.");
            // Update stored position
            savePosition(position);
            return true;

        } else {
            console.log("User is within 10 meters.");
            return false;
        }
    } else {
        console.log("User has no previous location.");
        // Update stored position
        savePosition(position);
        return true;
    }
}