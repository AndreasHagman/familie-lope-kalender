import { useEffect, useState, useRef } from "react";
import { getWeatherMotivation } from "../utils/weatherMotivation";

export default function WeatherMotivator() {
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🌤️ Her lagres selve vær-dataene (temp, vind osv.)
  const [weather, setWeather] = useState(null);
  
  // Bruk ref i stedet for variabel for å unngå scope-problemer med Chrome extensions
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;

    // Timeout for å skjule komponenten hvis det tar for lang tid
    timeoutRef.current = setTimeout(() => {
      try {
        setLoading(false);
        setMotivation(null); // Skjul komponenten hvis det tar for lang tid
      } catch (e) {
        console.warn("Could not set state in timeout:", e);
      }
    }, 15000); // 15 sekunder total timeout

    const fetchWeather = async () => {
      try {
        if (!navigator.geolocation) {
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          try {
            setLoading(false);
            setMotivation(null); // Skjul komponenten hvis geolocation ikke er tilgjengelig
          } catch (e) {
            console.warn("Could not set state:", e);
          }
          return;
        }

        // Lag callback-funksjoner som bruker state-setters direkte med try-catch
        // Dette sikrer at de fungerer selv når Chrome-extensionen kaller dem
        // Vi prøver ikke å rydde timeout her fordi Chrome-extensionen ikke har tilgang til den
        const successCallback = async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
            
            if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();

            if (data.error) {
              try {
                setLoading(false);
                setMotivation(null); // Skjul komponenten ved feil
              } catch (e) {
                console.warn("Could not set motivation:", e);
              }
            } else if (data.main && data.weather && data.weather[0]) {
              try {
                setWeather({
                  temp: data.main.temp,
                  feelsLike: data.main.feels_like,
                  wind: data.wind?.speed || 0,
                  icon: data.weather[0]?.icon,
                  description: data.weather[0]?.description,
                });
                setMotivation(getWeatherMotivation(data));
                setLoading(false);
              } catch (e) {
                console.warn("Could not set weather/motivation:", e);
              }
            } else {
              try {
                setLoading(false);
                setMotivation(null); // Skjul komponenten hvis data mangler
              } catch (e) {
                console.warn("Could not set motivation:", e);
              }
            }
          } catch (err) {
            console.error("Weather fetch error:", err);
            try {
              setLoading(false);
              setMotivation(null); // Skjul komponenten ved feil
            } catch (e) {
              console.warn("Could not set motivation:", e);
            }
          }
        };

        const errorCallback = (err) => {
          console.error("Geo error:", err);
          try {
            setLoading(false);
            setMotivation(null); // Skjul komponenten ved geolocation-feil
          } catch (e) {
            console.warn("Could not set state in error callback:", e);
          }
        };

        navigator.geolocation.getCurrentPosition(
          successCallback,
          errorCallback,
          {
            timeout: 10000, // 10 sekunder timeout for geolocation
            enableHighAccuracy: false,
          }
        );
      } catch (err) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        console.error("Unexpected error in WeatherMotivator:", err);
        try {
          setLoading(false);
          setMotivation(null);
        } catch (e) {
          console.warn("Could not set state:", e);
        }
      }
    };

    fetchWeather();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isMountedRef.current = false;
    };
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
