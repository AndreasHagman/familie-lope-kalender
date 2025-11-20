import { useEffect, useState } from "react";
import { getWeatherMotivation } from "../utils/weatherMotivation";

export default function WeatherMotivator() {
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [debug, setDebug] = useState(null); // 👈 for feilsøking

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

        setDebug(`Posisjon funnet: ${lat}, ${lon}`);

        try {
          const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
          const data = await res.json();

          console.log("WEATHER RESPONSE:", data);
          setDebug((prev) => prev + "\nAPI OK");

          if (data.error) {
            setMotivation("Kunne ikke hente værdata.");
          } else {
            setMotivation(getWeatherMotivation(data));
          }
        } catch (err) {
          console.error("Weather fetch error:", err);
          setMotivation("Feil ved henting av værdata.");
        }

        setLoading(false);
      },
      (err) => {
        setMotivation(null);
        console.error("Geo error:", err);
        setLoading(false);
      }
    );
  }, []);

  if (loading) return <p className="text-gray-500">Henter værdata…</p>;
  if (!motivation) return null;

  return (
    <div className="p-4 mt-4 bg-blue-50 rounded shadow text-center">
      <p className="text-md font-medium">{motivation}</p>
    </div>
  );
}
