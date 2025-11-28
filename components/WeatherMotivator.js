import { useEffect, useState } from "react";
import { getWeatherMotivation } from "../utils/weatherMotivation";

export default function WeatherMotivator() {
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🌤️ Her lagres selve vær-dataene (temp, vind osv.)
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setMotivation("🌍 Kunne ikke hente posisjon.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          const data = await res.json();

          if (data.error) {
            setMotivation("Kunne ikke hente værdata.");
          } else {
            setWeather({
              temp: data.main.temp,
              feelsLike: data.main.feels_like,
              wind: data.wind.speed,
              icon: data.weather?.[0]?.icon,
              description: data.weather?.[0]?.description,
            });

            setMotivation(getWeatherMotivation(data));
          }
        } catch (err) {
          console.error("Weather fetch error:", err);
          setMotivation("Feil ved henting av værdata.");
        }

        setLoading(false);
      },
      (err) => {
        console.error("Geo error:", err);
        setMotivation(null);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <p className="text-gray-500">Henter værdata…</p>;
  if (!motivation) return null;

  return (
    <div className="p-4 mt-4 bg-blue-50 rounded shadow text-center">

      {/* 🎯 Motivasjonsteksten */}
      <p className="text-md font-medium mb-3">{motivation}</p>

      {/* 🌡️ Vær-detaljer */}
      {weather && (
        <div className="flex flex-col items-center text-sm text-gray-700">

          {/* Ikon fra OpenWeather */}
          {weather.icon && (
            <img
              src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
              alt="Weather icon"
              className="w-14 h-14 mb-1"
            />
          )}

          <p>
            <strong>{weather.temp.toFixed(1)}°C</strong> ({weather.description})
          </p>

          <p className="text-gray-600">
            Føles som: {weather.feelsLike.toFixed(1)}°C
          </p>

          <p className="text-gray-600">
            Vind: {weather.wind.toFixed(1)} m/s
          </p>
        </div>
      )}
    </div>
  );
}
