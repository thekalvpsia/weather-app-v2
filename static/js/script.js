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
            const current = data.current;
            const forecast = data.forecast;
            const unit = data.unit;
            
            // Get the timezone offset (in seconds) from the API response
            const timezoneOffset = current.timezone; // Offset in seconds
            const utcTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000; // UTC time in milliseconds
            const localTime = new Date(utcTime + timezoneOffset * 1000); // Adjust to location's timezone
            
            // Format the local time and day
            const options = { weekday: 'long' };
            const formattedDay = localTime.toLocaleDateString(undefined, options);
            const formattedTime = localTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
            
            // Extract only the next 8 entries (24 hours)
            const forecastEntries = forecast.list.slice(0, 8);
            const times = forecastEntries.map((entry) =>
                new Date(entry.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })
            );
            const temps = forecastEntries.map((entry) => entry.main.temp);

            // Populate the weather result and show the container
            resultDiv.innerHTML = `
                <h2>Weather in ${current.name}</h2>
                <p style="margin-top: -20px; font-size: 14px; color: #aaaaaa;">${formattedDay} ${formattedTime}</p>
                <p style="margin-top: -5px; font-size: 14px; color: #aaaaaa; text-transform: capitalize">${current.weather[0].description}</p>
                <img 
                    src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png" 
                    alt="${current.weather[0].description}" 
                    class="weather-icon"
                />
                <div class="temperature">
                    ${Math.round(current.main.temp)}<span class="superscript-toggle">
                        <span id="switch-to-f" class="${unit === 'imperial' ? 'active' : ''}">°F</span> |
                        <span id="switch-to-c" class="${unit === 'metric' ? 'active' : ''}">°C</span>
                    </span>
                </div>
                <p style="font-size: 18px; margin: 5px 0; color: #cccccc;">
                    Feels like: ${Math.round(current.main.feels_like)}<span class="superscript">°${unit === 'imperial' ? 'F' : 'C'}</span>
                </p>
                <div class="weather-stats">
                    <div class="stat">
                        <img src="/static/images/precipitation-filled.png" alt="Precipitation Icon" class="stat-icon precipitation-icon" />
                        <div>
                            <p class="stat-value"> ${getPrecipitation(current)} </p>
                            <p class="stat-label">Precipitation</p>
                        </div>
                    </div>
                    <div class="stat">
                        <img src="/static/images/humidity-filled.png" alt="Humidity Icon" class="stat-icon" />
                        <div>
                            <p class="stat-value">${current.main.humidity}%</p>
                            <p class="stat-label">Humidity</p>
                        </div>
                    </div>
                    <div class="stat">
                        <img src="/static/images/wind.png" alt="Wind Icon" class="stat-icon" />
                        <div>
                            <p class="stat-value">${Math.round(current.wind.speed)} ${unit === 'imperial' ? 'mph' : 'm/s'}</p>
                            <p class="stat-label">Wind</p>
                        </div>
                    </div>
                </div>
                <canvas id="forecastChart" width="400" height="200" style="margin-top: 20px;"></canvas>
            `;
            resultDiv.classList.add('visible');

            // Render the 24-hour temperature forecast graph
            renderForecastGraph(times, temps);

            // Handle unit toggle
            document.getElementById('switch-to-f').addEventListener('click', () => {
                switchUnit('imperial');
            });
            
            document.getElementById('switch-to-c').addEventListener('click', () => {
                switchUnit('metric');
            });
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

// Function to render the forecast graph using Chart.js
function renderForecastGraph(times, temps) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: times,
            datasets: [
                {
                    label: 'Temperature',
                    data: temps,
                    borderColor: 'rgba(255, 255, 255, 1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                    pointRadius: 4,
                    fill: 'start'
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    onClick: null, // Disable toggling of datasets when clicking on legend
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                datalabels: {
                    display: true,
                    color: 'rgba(255, 255, 255, 1)',
                    font: {
                        size: 10,
                        weight: 'bold'
                    },
                    align: 'top',
                    formatter: (value) => `${Math.round(value)}`
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                },
                y: {
                    title: {
                        display: false
                    },
                    ticks: {
                        callback: () => '',
                    },
                    grid: {
                        drawTicks: false
                    }
                }
            },
            layout: {
                padding: 20 // Add some padding for better readability
            }
        },
        plugins: [ChartDataLabels] // Enable the datalabels plugin
    });
}

// Function to get precipitation in mm
function getPrecipitation(data) {
    if (data.rain && data.rain["1h"]) {
        return `${data.rain["1h"]} mm`; // Rain in the last hour
    } else if (data.snow && data.snow["1h"]) {
        return `${data.snow["1h"]} mm`; // Snow in the last hour
    }
    return `0 mm`; // No precipitation data available
}

function switchUnit(unit) {
    const city = document.getElementById('city-input').value;

    fetch('/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, unit })
    })
        .then(response => response.json())
        .then(data => {
            if (data.current) {
                const current = data.current;
                const forecast = data.forecast;

                // Get the timezone offset (in seconds) from the API response
                const timezoneOffset = current.timezone; // Offset in seconds
                const utcTime = new Date().getTime() + new Date().getTimezoneOffset() * 60000; // UTC time in milliseconds
                const localTime = new Date(utcTime + timezoneOffset * 1000); // Adjust to location's timezone

                // Format the local time and day
                const options = { weekday: 'long' };
                const formattedDay = localTime.toLocaleDateString(undefined, options);
                const formattedTime = localTime.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                // Extract only the next 8 entries (24 hours)
                const forecastEntries = forecast.list.slice(0, 8);
                const times = forecastEntries.map((entry) =>
                    new Date(entry.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })
                );
                const temps = forecastEntries.map((entry) => entry.main.temp);

                // Update the weather result
                const resultDiv = document.getElementById('weather-result');
                resultDiv.innerHTML = `
                    <h2>Weather in ${current.name}</h2>
                    <p style="margin-top: -20px; font-size: 14px; color: #aaaaaa;">${formattedDay} ${formattedTime}</p>
                    <p style="margin-top: -5px; font-size: 14px; color: #aaaaaa; text-transform: capitalize">${current.weather[0].description}</p>
                    <img 
                        src="https://openweathermap.org/img/wn/${current.weather[0].icon}@2x.png" 
                        alt="${current.weather[0].description}" 
                        class="weather-icon"
                    />
                    <div class="temperature">
                        ${Math.round(current.main.temp)}<span class="superscript-toggle">
                            <span id="switch-to-f" class="${unit === 'imperial' ? 'active' : ''}">°F</span> |
                            <span id="switch-to-c" class="${unit === 'metric' ? 'active' : ''}">°C</span>
                        </span>
                    </div>
                    <p style="font-size: 18px; margin: 5px 0; color: #cccccc;">
                        Feels like: ${Math.round(current.main.feels_like)}<span class="superscript">°${unit === 'imperial' ? 'F' : 'C'}</span>
                    </p>
                    <div class="weather-stats">
                        <div class="stat">
                            <img src="/static/images/precipitation-filled.png" alt="Precipitation Icon" class="stat-icon precipitation-icon" />
                            <div>
                                <p class="stat-value"> ${getPrecipitation(current)} </p>
                                <p class="stat-label">Precipitation</p>
                            </div>
                        </div>
                        <div class="stat">
                            <img src="/static/images/humidity-filled.png" alt="Humidity Icon" class="stat-icon" />
                            <div>
                                <p class="stat-value">${current.main.humidity}%</p>
                                <p class="stat-label">Humidity</p>
                            </div>
                        </div>
                        <div class="stat">
                            <img src="/static/images/wind.png" alt="Wind Icon" class="stat-icon" />
                            <div>
                                <p class="stat-value">${Math.round(current.wind.speed)} ${unit === 'imperial' ? 'mph' : 'm/s'}</p>
                                <p class="stat-label">Wind</p>
                            </div>
                        </div>
                    </div>
                    <canvas id="forecastChart" width="400" height="200" style="margin-top: 20px;"></canvas>
                `;

                resultDiv.classList.add('visible');

                // Render the 24-hour temperature forecast graph
                renderForecastGraph(times, temps);

                // Reattach event listeners for unit switching
                document.getElementById('switch-to-f').addEventListener('click', () => {
                    switchUnit('imperial');
                });

                document.getElementById('switch-to-c').addEventListener('click', () => {
                    switchUnit('metric');
                });
            } else {
                console.error('Error fetching updated weather data:', data.error || 'Unknown error');
            }
        })
        .catch(err => {
            console.error('Failed to switch units:', err);
        });
}
