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

    if not city:
        return jsonify({'error': 'City name is required'}), 400

    # Call the OpenWeatherMap API
    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=imperial"
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch weather data'}), response.status_code

    # Return the weather data as JSON
    return jsonify(response.json())

if __name__ == '__main__':
    app.run(debug=True)
