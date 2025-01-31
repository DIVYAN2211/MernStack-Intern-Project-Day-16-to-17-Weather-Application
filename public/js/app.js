const weatherApi = "/weather";
const weatherForm = document.querySelector("form");
const search = document.querySelector("input");

const weatherIcon = document.querySelector(".weatherIcon i");
const weatherCondition = document.querySelector(".weatherCondition");
const tempElement = document.querySelector(".temperature span");
const locationElement = document.querySelector(".place");
const dateElement = document.querySelector(".date");
const historyList = document.getElementById("historyList");  // To display search history

const currentDate = new Date();
const monthName = currentDate.toLocaleString("en-US", { month: "long" });
dateElement.textContent = `${currentDate.getDate()}, ${monthName}`;

weatherForm.addEventListener("submit", (e) => {
  e.preventDefault();//page reload
  locationElement.textContent = "Loading...";
  weatherIcon.className = "";
  tempElement.textContent = "";
  weatherCondition.textContent = "";
  showData(search.value);
});
//req to browsers geolocation api 
//geolocation access-Nominatim OpenStreetMap API-lat &longi to city
if ("geolocation" in navigator) {
  locationElement.textContent = "Loading...";
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude, longitude } = position.coords;
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
      .then((response) => response.json())
      .then((data) => {
        const city = data?.address?.city;
        if (city) showData(city);
        else console.error("City not found.");
      })
      .catch((error) => console.error("Error fetching location data:", error));
  }, (error) => console.error("Error getting location:", error.message));
} else {
  console.error("Geolocation is not available.");
}

// Function to fetch and display weather data
function showData(city) {
  getWeatherData(city, (result) => {
    if (result.cod === 200) {
      weatherIcon.className = result.weather[0].description === "rain" || result.weather[0].description === "fog"
        ? "wi wi-day-" + result.weather[0].description
        : "wi wi-day-cloudy";
      locationElement.textContent = result.name;
      tempElement.textContent = (result.main.temp - 273.15).toFixed(2) + "°";
      weatherCondition.textContent = result.weather[0].description.toUpperCase();

      // Save this search to the history
      saveHistory(result.name);
    } else {
      locationElement.textContent = "City not found.";
    }
  });
}

// Function to get weather data from the server
function getWeatherData(city, callback) {
  fetch(`${weatherApi}?address=${city}`)
    .then((response) => response.json())
    .then((data) => callback(data));
}

// Save the search history to the database
function saveHistory(city) {
  fetch('/history', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ city }),
  })
    .then(() => fetchHistory());  // Refresh the history list
}

// Fetch the history and display it
function fetchHistory() {
  fetch('/history')
    .then((response) => response.json())
    .then((history) => {
      historyList.innerHTML = '';  // Clear current list
      history.forEach((entry) => {
        const listItem = document.createElement('li');
        listItem.textContent = entry.city;

        // Create the Show button
        const showButton = document.createElement('button');
        showButton.textContent = 'Show';
        showButton.addEventListener('click', () => showWeatherDetails(entry.city, listItem));

        // Create the Delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteHistory(entry._id, listItem));

        // Create the Edit button
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-button');
        editButton.setAttribute('data-id', entry._id); // Store ID for edit functionality
        editButton.addEventListener('click', () => editHistory(entry._id, listItem));

        // Append the buttons to the list item
        listItem.appendChild(editButton);
        listItem.appendChild(deleteButton);
        listItem.appendChild(showButton);

        // Create a div to hold the weather details (hidden by default)
        const weatherDetails = document.createElement('div');
        weatherDetails.classList.add('weather-details');
        listItem.appendChild(weatherDetails);

        historyList.appendChild(listItem);
      });
    })
    .catch((err) => console.error('Error fetching history:', err));
}

// Show weather details when Show button is clicked
function showWeatherDetails(city, listItem) {
  const weatherDetails = listItem.querySelector('.weather-details');
  if (weatherDetails.style.display === "block") {
    // If already showing, hide it
    weatherDetails.style.display = "none";
    return;
  }

  // Fetch the weather data for the city
  getWeatherData(city, (result) => {
    if (result.cod === 200) {
      // Populate the weather details
      weatherDetails.innerHTML = `
        <p class="temperature">${(result.main.temp - 273.15).toFixed(2)}°</p>
        <p class="weatherCondition">${result.weather[0].description.toUpperCase()}</p>
        <p class="date">${currentDate.getDate()}, ${monthName}</p>
      `;
      weatherDetails.style.display = "block";  // Show the weather details
    } else {
      weatherDetails.innerHTML = "City not found.";
      weatherDetails.style.display = "block";
    }
  });
}

// Edit a history entry
function editHistory(id, listItem) {
  const newCity = prompt("Enter new city name:");
  if (newCity) {
    fetch(`/history/edit/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: newCity }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert("City updated successfully!");
        fetchHistory();  // Refresh the history list
      } else {
        alert("Error updating city.");
      }
    })
    .catch(err => {
      alert("Error updating city.");
      console.error(err);
    });
  }
}



// Delete a history entry from both the UI and the database
function deleteHistory(id, listItem) {
  fetch(`/history/${id}`, { method: 'DELETE' })
    .then((response) => {
      if (response.ok) {
        listItem.remove();  // Remove from UI
      } else {
        console.error('Error deleting history');
      }
    })
    .catch((err) => console.error('Error deleting history:', err));
}

// Initial history fetch
fetchHistory();
