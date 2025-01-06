document.getElementById('weather-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form from reloading the page

    const city = document.getElementById('city-input').value;
    const resultDiv = document.getElementById('weather-result');

    // Clear previous results
    resultDiv.innerHTML = '';
    resultDiv.classList.remove('visible');

    try {
        // Send the city to the backend
        const response = await fetch('/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city })
        });

        const data = await response.json();

        if (response.ok) {
            // Get the timezone offset (in seconds) from the API response
            const timezoneOffset = data.timezone; // Offset in seconds
            const utcTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000; // UTC time in milliseconds
            const localTime = new Date(utcTime + timezoneOffset * 1000); // Adjust to location's timezone
            
            // Format the local time and day
            const options = { weekday: 'long' };
            const formattedDay = localTime.toLocaleDateString(undefined, options);
            const formattedTime = localTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            
            // Populate the weather result and show the container
            resultDiv.innerHTML = `
                <h2>Weather in ${data.name}</h2>
                <p style="margin-top: -20px; font-size: 14px; color: #aaaaaa;">${formattedDay} ${formattedTime}</p>
                <img 
                    src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
                    alt="${data.weather[0].description}" 
                    class="weather-icon"
                />
                <p class="temperature">
                    ${Math.round(data.main.temp)}<span class="superscript">°F</span>
                </p>
                <p style="font-size: 18px; margin: 5px 0; color: #cccccc;">
                    Feels like: ${Math.round(data.main.feels_like)}<span class="superscript">°F</span>
                </p>
                <p>Description: ${data.weather[0].description}</p>
                <p>Precipitation: ${getPrecipitation(data)}</p>
                <p>Humidity: ${data.main.humidity}%</p>
                <p>Wind: ${Math.round(data.wind.speed)} mph</p>
            `;
            resultDiv.classList.add('visible');
        } else {
            // Display the error message
            resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            resultDiv.classList.add('visible');
        }
    } catch (error) {
        // Handle network errors
        resultDiv.innerHTML = `<p>Error: Unable to fetch weather data</p>`;
        resultDiv.classList.add('visible');
    }
});

// Function to get precipitation in mm
function getPrecipitation(data) {
    if (data.rain && data.rain["1h"]) {
        return `${data.rain["1h"]} mm`; // Rain in the last hour
    } else if (data.snow && data.snow["1h"]) {
        return `${data.snow["1h"]} mm`; // Snow in the last hour
    }
    return `0 mm`; // No precipitation data available
}
