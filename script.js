document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const yourWeatherBtn = document.getElementById('your-weather');
    const searchWeatherBtn = document.getElementById('search-weather');
    const searchContainer = document.getElementById('search-container');
    
    // Weather display elements
    const locationElement = document.getElementById('location');
    const temperatureElement = document.getElementById('temperature');
    const weatherDescElement = document.getElementById('weather-desc');
    const windSpeedElement = document.getElementById('wind-speed');
    const humidityElement = document.getElementById('humidity');
    const cloudsElement = document.getElementById('clouds');
    const forecastElement = document.getElementById('forecast');
    
    // API Configuration
    const API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your OpenWeatherMap API key
    const BASE_URL = 'https://api.openweathermap.org/data/2.5';
    
    // Default city
    let currentCity = 'Kuthambakkam';
    
    // Event Listeners
    searchBtn.addEventListener('click', function() {
        if (cityInput.value.trim() !== '') {
            currentCity = cityInput.value.trim();
            fetchWeatherData(currentCity);
            cityInput.value = '';
        }
    });
    
    cityInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && cityInput.value.trim() !== '') {
            currentCity = cityInput.value.trim();
            fetchWeatherData(currentCity);
            cityInput.value = '';
        }
    });
    
    yourWeatherBtn.addEventListener('click', function() {
        setActiveButton(yourWeatherBtn);
        getLocation();
    });
    
    searchWeatherBtn.addEventListener('click', function() {
        setActiveButton(searchWeatherBtn);
        searchContainer.style.display = 'block';
    });
    
    // Initialize with default city
    fetchWeatherData(currentCity);
    
    // Functions
    function setActiveButton(button) {
        yourWeatherBtn.classList.remove('active');
        searchWeatherBtn.classList.remove('active');
        button.classList.add('active');
    }
    
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    fetchWeatherByCoords(latitude, longitude);
                },
                error => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Showing default weather.');
                    fetchWeatherData(currentCity);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
            fetchWeatherData(currentCity);
        }
    }
    
    async function fetchWeatherData(city) {
        try {
            // Show loading state
            updateWeatherUI('Loading...', '--', '--', '--', '--');
            
            // Fetch current weather
            const currentResponse = await fetch(
                `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
            );
            
            if (!currentResponse.ok) {
                throw new Error('City not found');
            }
            
            const currentData = await currentResponse.json();
            
            // Fetch forecast
            const forecastResponse = await fetch(
                `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
            );
            
            if (!forecastResponse.ok) {
                throw new Error('Forecast data not available');
            }
            
            const forecastData = await forecastResponse.json();
            
            // Update UI with fetched data
            updateWeatherUI(
                `${currentData.name}, ${currentData.sys.country}`,
                currentData.main.temp.toFixed(2),
                currentData.weather[0].description,
                currentData.wind.speed,
                currentData.main.humidity,
                currentData.clouds.all,
                forecastData
            );
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            alert(`Error: ${error.message}. Please try again.`);
            // Reset to default city on error
            fetchWeatherData('Kuthambakkam');
        }
    }
    
    async function fetchWeatherByCoords(lat, lon) {
        try {
            // Show loading state
            updateWeatherUI('Loading...', '--', '--', '--', '--');
            
            // Fetch current weather by coordinates
            const response = await fetch(
                `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            
            const data = await response.json();
            currentCity = data.name;
            fetchWeatherData(currentCity);
            
        } catch (error) {
            console.error('Error fetching weather by coordinates:', error);
            alert(`Error: ${error.message}. Please try again.`);
            fetchWeatherData(currentCity);
        }
    }
    
    function updateWeatherUI(location, temp, desc, wind, humidity, clouds, forecastData = null) {
        // Update main weather info
        document.querySelector('.location h2').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${location}`;
        temperatureElement.textContent = temp;
        weatherDescElement.textContent = desc;
        windSpeedElement.textContent = `${wind} m/s`;
        humidityElement.textContent = `${humidity}%`;
        cloudsElement.textContent = `${clouds}%`;
        
        // Update weather icon based on description
        const weatherIcon = document.querySelector('.weather-icon');
        weatherIcon.className = getWeatherIcon(desc);
        
        // Update forecast if available
        if (forecastData) {
            updateForecastUI(forecastData);
        }
    }
    
    function getWeatherIcon(description) {
        const desc = description.toLowerCase();
        if (desc.includes('rain')) return 'fas fa-cloud-rain weather-icon';
        if (desc.includes('cloud')) return 'fas fa-cloud weather-icon';
        if (desc.includes('clear')) return 'fas fa-sun weather-icon';
        if (desc.includes('snow')) return 'fas fa-snowflake weather-icon';
        if (desc.includes('thunder')) return 'fas fa-bolt weather-icon';
        if (desc.includes('mist') || desc.includes('fog')) return 'fas fa-smog weather-icon';
        return 'fas fa-cloud-sun weather-icon';
    }
    
    function updateForecastUI(forecastData) {
        // Filter to get one forecast per day (every 24 hours)
        const dailyForecasts = [];
        const seenDays = new Set();
        
        for (const forecast of forecastData.list) {
            const date = new Date(forecast.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            if (!seenDays.has(day) && dailyForecasts.length < 5) {
                seenDays.add(day);
                dailyForecasts.push({
                    day,
                    temp: forecast.main.temp.toFixed(1),
                    description: forecast.weather[0].description,
                    icon: forecast.weather[0].main
                });
            }
        }
        
        // Generate forecast HTML
        let forecastHTML = '';
        dailyForecasts.forEach(forecast => {
            forecastHTML += `
                <div class="forecast-day">
                    <div class="day">${forecast.day}</div>
                    <div class="forecast-icon">${getForecastIcon(forecast.icon)}</div>
                    <div class="forecast-temp">${forecast.temp}°C</div>
                    <div class="forecast-desc">${forecast.description}</div>
                </div>
            `;
        });
        
        forecastElement.innerHTML = forecastHTML;
    }
    
    function getForecastIcon(iconCode) {
        switch (iconCode) {
            case 'Clear': return '☀️';
            case 'Clouds': return '☁️';
            case 'Rain': return '🌧️';
            case 'Snow': return '❄️';
            case 'Thunderstorm': return '⛈️';
            case 'Drizzle': return '🌦️';
            default: return '⛅';
        }
    }
    
    // Initialize with sample data
    updateWeatherUI('Kuthambakkam, IN', '28.48', 'scattered clouds', '6.17', '70', '40');
});
