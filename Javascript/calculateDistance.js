const API_KEY = "AIzaSyDdPn6PpVzepa89hD6F8xt0Po1TnAt_9SQ"; // Replace with yours Google API-key
const url = "https://routes.googleapis.com/directions/v2:computeRoutes"; // The URL for using the API

export async function getTravelTime(destination) {
  const progressBar = document.getElementById('loading-progress');
  const travelTimes = [];
  try {
    // Get user's location (latitude and longitude)
    const position = await getCurrentPositionPromise();
    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;
    let completed = 0; // Track progress for the progress bar

    // Prepare and send requests for multiple destination simultaneously
    const travelTimePromises = destination.map((place) => {
      return calcDistance(userLat, userLon, place.latitude, place.longitude) // Return promise
        .then((time) => {
          if (time) {
            travelTimes.push({ name: place.city || place.shop_name, time: parseInt(time) });
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
    /* Debugging - Check sorted array
      console.log("Sorted travel times:", travelTimes);
    */
    return travelTimes; // Return the sorted list of travel times

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