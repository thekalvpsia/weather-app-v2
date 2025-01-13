from flask import Flask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()

API_KEY = os.getenv('OPENWEATHERMAP_API_KEY')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/weather', methods=['POST'])
def get_weather():
    # Get the city name from the JSON payload
    data = request.get_json()
    city = data.get('city')
    unit = data.get('unit', 'imperial')  # Default to Fahrenheit (imperial)

    if not city:
        return jsonify({'error': 'City name is required'}), 400

    # Fetch current weather
    current_url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units={unit}"
    current_response = requests.get(current_url)
    if current_response.status_code != 200:
        return jsonify({'error': 'Failed to fetch current weather data'}), current_response.status_code
    current_data = current_response.json()

    # Fetch 5-day forecast
    forecast_url = f"http://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units={unit}"
    forecast_response = requests.get(forecast_url)
    if forecast_response.status_code != 200:
        return jsonify({'error': 'Failed to fetch forecast data'}), forecast_response.status_code
    forecast_data = forecast_response.json()

    # Combine and return both datasets
    return jsonify({
        'current': current_data,
        'forecast': forecast_data,
        'unit': unit
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
