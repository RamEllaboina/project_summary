# WeatherWise - Real-time Weather App

A modern, responsive weather application built with vanilla HTML, CSS, and JavaScript.

## Project Structure

```
weather_app/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive design
├── script.js       # Weather functionality and API calls
├── config.js       # API configuration
└── README.md       # This file
```

## Features

- 🌤️ Real-time weather data from OpenWeatherMap
- 🎨 Modern, clean UI with smooth animations
- 📱 Fully responsive design
- 🔍 City search functionality
- 🔄 Loading states and error handling
- 💧 Humidity and wind speed display
- 🌡️ Temperature in Celsius
- 🎯 Weather condition icons

## Setup Instructions

### 1. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to the API keys section
4. Copy your API key

### 2. Configure API Key

Open `config.js` and replace `YOUR_API_KEY` with your actual OpenWeatherMap API key:

```javascript
const API_CONFIG = {
    API_KEY: 'your_actual_api_key_here',   // Replace this
    BASE_URL: 'https://api.openweathermap.org/data/2.5/weather'
};
```

### 3. Run the Application

Simply open `index.html` in your web browser. No build process required!

## Usage

1. Enter a city name in the search field (e.g., "London", "Paris", "Tokyo")
2. Click the search button or press Enter
3. View the current weather conditions

## File Descriptions

- **index.html**: Contains the HTML structure and links to external files
- **style.css**: All styling including animations and responsive design
- **script.js**: Main application logic, API calls, and UI updates
- **config.js**: API configuration (separated for easy API key management)

## API Integration

The app uses the OpenWeatherMap Current Weather Data API:
- Endpoint: `https://api.openweathermap.org/data/2.5/weather`
- Units: Metric (Celsius, m/s)
- Data returned: Temperature, humidity, wind speed, weather conditions

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Error Handling

The app handles various error scenarios:
- Invalid city names
- Network connectivity issues
- Invalid API keys
- Unexpected API responses

## License

This project is for educational purposes. Feel free to modify and use as needed.
