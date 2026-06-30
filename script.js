const apiKey = "d35a9d0c00b3d5fb00a5775b007f38fb";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const themeBtn = document.getElementById("themeBtn");

const weatherCard = document.getElementById("weatherCard");
const errorMessage = document.getElementById("errorMessage");
const loader = document.getElementById("loader");
const dateTime = document.getElementById("dateTime");

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

const forecastContainer = document.getElementById("forecastContainer");

function showLoader() {
  loader.classList.remove("hidden");
  weatherCard.classList.add("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

function updateDateTime() {
  const now = new Date();

  dateTime.textContent = now.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

setInterval(updateDateTime, 1000);
updateDateTime();

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");
  themeBtn.textContent = isLight ? "☀️" : "🌙";

  localStorage.setItem("theme", isLight ? "light" : "dark");
});

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {
  document.body.classList.add("light");
  themeBtn.textContent = "☀️";
}

async function getWeather(city) {
  try {
    errorMessage.textContent = "";
    showLoader();

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    hideLoader();

    if (data.cod !== 200) {
      errorMessage.textContent = "City not found. Please try again.";
      return;
    }

    displayWeather(data);
    getForecast(city);
    localStorage.setItem("lastCity", city);
  } catch (error) {
    hideLoader();
    errorMessage.textContent = "Something went wrong. Please try again.";
  }
}

async function getForecast(city) {
  try {
    forecastContainer.innerHTML = "";

    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
      return;
    }

    const dailyForecasts = data.list.filter(item =>
      item.dt_txt.includes("12:00:00")
    );

    dailyForecasts.slice(0, 5).forEach(item => {
      const date = new Date(item.dt_txt);
      const day = date.toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(item.main.temp);
      const icon = item.weather[0].icon;

      const forecastCard = document.createElement("div");
      forecastCard.className = "forecast-card";

      forecastCard.innerHTML = `
        <h4>${day}</h4>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather icon">
        <p>${temp}°C</p>
      `;

      forecastContainer.appendChild(forecastCard);
    });
  } catch (error) {
    console.log("Forecast error:", error);
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
  showLoader();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const response = await fetch(url);
        const data = await response.json();

        hideLoader();

        if (data.cod !== 200) {
          errorMessage.textContent = data.message || "Could not get weather for your location.";
          return;
        }

        cityInput.value = data.name;
        displayWeather(data);
        getForecast(data.name);
        localStorage.setItem("lastCity", data.name);
        errorMessage.textContent = "";
      } catch (error) {
        hideLoader();
        errorMessage.textContent = "Location weather failed. Try city search.";
      }
    },
    (error) => {
      hideLoader();

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
