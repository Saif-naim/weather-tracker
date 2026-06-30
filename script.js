const apiKey = "d35a9d0c00b3d5fb00a5775b007f38fb";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const weatherCard = document.getElementById("weatherCard");
const errorMessage = document.getElementById("errorMessage");

const cityName = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");

const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feelsLike");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const clouds = document.getElementById("clouds");

async function getWeather(city) {
  try {
    errorMessage.textContent = "";
    weatherCard.classList.add("hidden");

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      errorMessage.textContent = "City not found. Please try again.";
      return;
    }

    displayWeather(data);
    localStorage.setItem("lastCity", city);
  } catch (error) {
    errorMessage.textContent = "Something went wrong. Please try again.";
  }
}

function displayWeather(data) {
  cityName.textContent = `${data.name}, ${data.sys.country}`;
  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  description.textContent = data.weather[0].description;

  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${data.wind.speed} m/s`;
  feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
  pressure.textContent = `${data.main.pressure} hPa`;
  visibility.textContent = `${data.visibility / 1000} km`;
  clouds.textContent = `${data.clouds.all}%`;

  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherCard.classList.remove("hidden");
}

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();

  if (city === "") {
    errorMessage.textContent = "Please enter a city name.";
    return;
  }

  getWeather(city);
});

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
  }
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    errorMessage.textContent = "Geolocation is not supported.";
    return;
  }

  errorMessage.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.cod !== 200) {
          errorMessage.textContent = data.message || "Could not get weather for your location.";
          return;
        }

        cityInput.value = data.name;
        displayWeather(data);
        localStorage.setItem("lastCity", data.name);
        errorMessage.textContent = "";
      } catch (error) {
        errorMessage.textContent = "Location weather failed. Try city search.";
      }
    },
    (error) => {
      if (error.code === 1) {
        errorMessage.textContent = "Location permission denied. Please allow location.";
      } else if (error.code === 2) {
        errorMessage.textContent = "Location unavailable. Try city search.";
      } else {
        errorMessage.textContent = "Location request timed out. Try again.";
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }
  );
});

const lastCity = localStorage.getItem("lastCity");

if (lastCity) {
  cityInput.value = lastCity;
  getWeather(lastCity);
}
