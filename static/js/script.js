document.getElementById('weather-form').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form from reloading the page

    const city = document.getElementById('city-input').value;
    const resultDiv = document.getElementById('weather-result');

    // Clear previous results
    resultDiv.innerHTML = '';

    try {
        // Send the city to the backend
        const response = await fetch('/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ city })
        });

        const data = await response.json();

        if (response.ok) {
            // Display the weather information
            resultDiv.innerHTML = `
                <h2>Weather in ${data.name}</h2>
                <p>Description: ${data.weather[0].description}</p>
                <p>Temperature: ${data.main.temp} °F</p>
                <p>Humidity: ${data.main.humidity}%</p>
            `;
        } else {
            // Display the error message
            resultDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        }
    } catch (error) {
        // Handle network errors
        resultDiv.innerHTML = `<p>Error: Unable to fetch weather data</p>`;
    }
});
