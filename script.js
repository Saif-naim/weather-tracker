const apiKey = "d35a9d0c00b3d5fb00a5775b007f38fb";

const cityInput = document.getElementById("cityInput");
const locationBtn = document.getElementById("locationBtn");
const themeBtn = document.getElementById("themeBtn");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("errorMessage");
const weatherContent = document.getElementById("weatherContent");

const cityName = document.getElementById("cityName");
const cityTime = document.getElementById("cityTime");
const cityDate = document.getElementById("cityDate");
const temperature = document.getElementById("temperature");
const feelsLike = document.getElementById("feelsLike");
const sunrise = document.getElementById("sunrise");
const sunset = document.getElementById("sunset");
const weatherIcon = document.getElementById("weatherIcon");
const description = document.getElementById("description");

const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const pressure = document.getElementById("pressure");
const clouds = document.getElementById("clouds");

const forecastContainer = document.getElementById("forecastContainer");
const hourlyContainer = document.getElementById("hourlyContainer");

function showLoader() {
  loader.classList.remove("hidden");
  weatherContent.classList.add("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

function formatTime(unix, timezone) {
  const date = new Date((unix + timezone) * 1000);
  return date.toUTCString().slice(17, 22);
}

function updateCityClock(timezone) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const cityNow = new Date(utc + timezone * 1000);

  cityTime.textContent = cityNow.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  cityDate.textContent = cityNow.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

async function getWeatherByCity(city) {
  try {
    errorMessage.textContent = "";
    showLoader();

    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    const [currentRes, forecastRes] = await Promise.all([
      fetch(currentUrl),
      fetch(forecastUrl)
    ]);

    const currentData = await currentRes.json();
    const forecastData = await forecastRes.json();

    hideLoader();

    if (currentData.cod !== 200) {
      errorMessage.textContent = "City not found. Please try again.";
      return;
    }

    displayCurrentWeather(currentData);
    displayForecast(forecastData);
    displayHourly(forecastData);

    localStorage.setItem("lastCity", city);
    weatherContent.classList.remove("hidden");
  } catch {
    hideLoader();
    errorMessage.textContent = "Something went wrong. Please try again.";
  }
}

function displayCurrentWeather(data) {
  cityName.textContent = data.name;
  updateCityClock(data.timezone);

  temperature.textContent = `${Math.round(data.main.temp)}°C`;
  feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;

  sunrise.textContent = formatTime(data.sys.sunrise, data.timezone);
  sunset.textContent = formatTime(data.sys.sunset, data.timezone);

  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  description.textContent = data.weather[0].description;

  humidity.textContent = `${data.main.humidity}%`;
  wind.textContent = `${data.wind.speed} km/h`;
  pressure.textContent = `${data.main.pressure} hPa`;
  clouds.textContent = `${data.clouds.all}%`;
}

function displayForecast(data) {
  forecastContainer.innerHTML = "";

  const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  daily.slice(0, 5).forEach(item => {
    const date = new Date(item.dt_txt);
    const day = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });

    const div = document.createElement("div");
    div.className = "forecast-item";

    div.innerHTML = `
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">
      <span>${Math.round(item.main.temp)}°C</span>
      <span>${day}</span>
    `;

    forecastContainer.appendChild(div);
  });
}

function displayHourly(data) {
  hourlyContainer.innerHTML = "";

  data.list.slice(0, 6).forEach(item => {
    const date = new Date(item.dt_txt);
    const hour = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const div = document.createElement("div");
    div.className = "hourly-item";

    div.innerHTML = `
      <p>${hour}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png">
      <p>${Math.round(item.main.temp)}°C</p>
      <p>💨 ${item.wind.speed} km/h</p>
    `;

    hourlyContainer.appendChild(div);
  });
}

cityInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) getWeatherByCity(city);
  }
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    errorMessage.textContent = "Geolocation is not supported.";
    return;
  }

  showLoader();

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
        const res = await fetch(url);
        const data = await res.json();

        cityInput.value = data.name;
        getWeatherByCity(data.name);
      } catch {
        hideLoader();
        errorMessage.textContent = "Could not get your location weather.";
      }
    },
    () => {
      hideLoader();
      errorMessage.textContent = "Location permission denied.";
    }
  );
});

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeBtn.textContent = "☀️ Light Mode";
}

const lastCity = localStorage.getItem("lastCity") || "Tokyo";
cityInput.value = lastCity;
getWeatherByCity(lastCity);
