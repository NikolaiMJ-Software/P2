const API_KEY = "AIzaSyDdPn6PpVzepa89hD6F8xt0Po1TnAt_9SQ"; // Replace with yours Google API-key
const url = "https://routes.googleapis.com/directions/v2:computeRoutes"; // The URL for using the API
const progressBar = document.getElementById('loading-progress');

export async function getTravelTime() {
  const travelTimes = [];
  try {
    // Get Users location
    const position = await getCurrentPositionPromise();
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    let completed = 0; // Progress bar's progress

    // Fetch cities from the server
    const response = await fetch('/cities');
    const cities = await response.json();
    /* Debugging - Check output from fetch '/cities'
      console.log(`City: ${city.city}, Latitude: ${city.latitude}, Longitude: ${city.longitude}`);
    */

    // Calculate distance fo eatch city
    for (const city of cities) {
      // Send user and city coordinates to the function calcDistance, and wait before continue
      let time = await calcDistance(userLat, userLon, city.latitude, city.longitude);
      /* Debugging - the return time and belonging city
        console.log(`Adding: ${city.city} - ${time}s`);
      */
      // If there is a returning time (!=0), add the "time" to "travelTimes" with the beloning city
      if (time) {
        travelTimes.push({ city: city.city, time: parseInt(time) });
      } else {
        console.error('No route found for: ' + city.city);
      }
      // Progress bar, increment progress as each city is processed
      completed++;
      progressBar.value = (completed / cities.length) * 100; // Update the bar's value
    } 

    //progressBar.value = 100; // Set to 100% after all cities are loaded
    // Hide bar after loading is done
    if (progressBar.value >= 100) {
      progressBar.classList.add('hidden');
  }
    // Sort "travelTimes"so the nearest city comes first
    travelTimes.sort((a, b) => a.time - b.time);
    /* Debugging - Check sorted array
      console.log("Sorted travel times:", travelTimes);
    */
    return travelTimes;
    
   } catch (error) {
    console.error("Error:", error);
    return []; // Return empty array in case of an error
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
    // Convert return to JSON
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

// Help function to get users location
function getCurrentPositionPromise() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
}