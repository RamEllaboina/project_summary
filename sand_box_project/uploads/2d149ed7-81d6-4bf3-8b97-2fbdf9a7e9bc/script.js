// script.js - Handles API calls, UI updates, errors, loading states
// API configuration is imported from config.js
const { API_KEY, BASE_URL } = API_CONFIG;

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const weatherDisplay = document.getElementById('weatherDisplay');
const errorMsgDiv = document.getElementById('errorMsg');
const errorTextSpan = document.getElementById('errorText');

// Weather display sub-elements
const cityNameEl = document.getElementById('cityName');
const temperatureEl = document.getElementById('temperature');
const conditionEl = document.getElementById('condition');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('windSpeed');
const weatherIconEl = document.getElementById('weatherIcon');

// Helper: Clear previous weather data and hide display/error
function resetUI() {
    // Hide weather display and error if visible
    weatherDisplay.classList.add('hidden');
    errorMsgDiv.classList.add('hidden');
    // (loading is controlled separately)
}

// Helper: Show loading spinner and hide results/error
function showLoading() {
    resetUI();               // hide weather and error panels
    loadingSpinner.classList.remove('hidden');
}

// Helper: Hide loading spinner
function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

// Helper: Display error message with specific text
function showError(message) {
    hideLoading();                      // ensure loading disappears
    weatherDisplay.classList.add('hidden');
    errorTextSpan.innerText = message;
    errorMsgDiv.classList.remove('hidden');
}

// Helper: Map weather condition to a simple emoji icon (optional enhancement)
function getWeatherIcon(weatherMain) {
    const iconMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Fog': '🌫️'
    };
    return iconMap[weatherMain] || '🌡️';
}

// Main function: Fetch weather data from OpenWeatherMap API using async/await
async function fetchWeatherData(cityName) {
    if (!cityName || cityName.trim() === '') {
        showError('Please enter a city name.');
        return;
    }

    // Trim and encode for URL safety (spaces become %20)
    const encodedCity = encodeURIComponent(cityName.trim());
    const url = `${BASE_URL}?q=${encodedCity}&units=metric&appid=${API_KEY}`;

    try {
        // Show loading indicator while fetching
        showLoading();

        // Use fetch() with await
        const response = await fetch(url);

        // Check if response is not ok (e.g., 404 city not found, 401 invalid API key)
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`City "${cityName.trim()}" not found. Please check spelling.`);
            } else if (response.status === 401) {
                throw new Error('Invalid API key. Please get a valid OpenWeatherMap key.');
            } else {
                throw new Error(`Error ${response.status}: Unable to fetch weather data.`);
            }
        }

        // Parse JSON response
        const data = await response.json();

        // Validate essential data exists
        if (!data || !data.main || !data.weather || !data.wind) {
            throw new Error('Unexpected API response format.');
        }

        // Extract required fields
        const city = data.name;
        const temperature = Math.round(data.main.temp);        // Celsius (units=metric)
        const condition = data.weather[0].main;                // e.g., Clear, Clouds, Rain
        const humidity = data.main.humidity;
        const windSpeedValue = data.wind.speed;                // m/s

        // Populate UI with fresh data
        cityNameEl.innerText = city;
        temperatureEl.innerText = temperature;
        conditionEl.innerText = condition;
        humidityEl.innerText = `${humidity}%`;
        windSpeedEl.innerText = `${windSpeedValue} m/s`;

        // Set dynamic weather icon based on condition
        const iconEmoji = getWeatherIcon(condition);
        weatherIconEl.innerText = iconEmoji;

        // Hide loading and error, then show weather display
        hideLoading();
        errorMsgDiv.classList.add('hidden');
        weatherDisplay.classList.remove('hidden');

    } catch (error) {
        // Network issues or any error thrown: handle gracefully
        console.error('Weather fetch error:', error);
        hideLoading();
        // Provide user-friendly message
        if (error.message.includes('fetch') || error.message.includes('network')) {
            showError('Network error. Please check your internet connection.');
        } else {
            showError(error.message || 'Something went wrong. Please try again.');
        }
    }
}

// Function triggered on search (button click or Enter key)
function performSearch() {
    const city = cityInput.value;
    if (!city.trim()) {
        showError('Please enter a city name.');
        return;
    }
    // Clear previous results before new fetch (ensured by fetch flow: reset UI inside)
    // but also we call resetUI for cleanliness before starting loading
    resetUI();
    fetchWeatherData(city);
}

// Event Listeners
searchBtn.addEventListener('click', performSearch);

// Pressing Enter key in the input field triggers search (additional feature)
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();   // avoid any form submission weirdness
        performSearch();
    }
});

// Optional: initial clear & place holder demonstration
// On page load, we make sure the UI is clean (no errors, no weather)
window.addEventListener('DOMContentLoaded', () => {
    // Reset all displays to initial state: show only search area
    resetUI();
    hideLoading();         // just in case loading visible
    // small demo: prefill with a default example? but not required, just keep empty
    cityInput.value = '';
    // Provide a friendly note if API key missing (helpful for beginners)
    if (API_KEY === 'YOUR_API_KEY') {
        console.warn('⚠️ Weather App: Replace API_KEY with your OpenWeatherMap API key in config.js!');
        // Optional subtle UI hint but not intrusive
        const noteDiv = document.querySelector('.api-note');
        if (noteDiv) {
            noteDiv.style.color = '#b1624b';
            noteDiv.title = 'Please set a valid OpenWeatherMap API key in config.js';
        }
    }
});
