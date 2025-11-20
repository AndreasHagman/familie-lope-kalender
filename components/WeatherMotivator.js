import { useEffect, useState } from "react";
import { getWeatherMotivation } from "../utils/weatherMotivation";

export default function WeatherMotivator() {
  const [motivation, setMotivation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setMotivation("🌍 Kunne ikke hente posisjon – kan ikke gi vær-tips.");
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();

        setMotivation(getWeatherMotivation(data));
      } catch (err) {
        setMotivation("Kunne ikke hente værdata 😕");
      }

      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="text-gray-500">Henter værdata…</p>;
  }

  return (
    <div className="p-4 mt-4 bg-blue-50 rounded shadow text-center">
      <p className="text-md font-medium">{motivation}</p>
    </div>
  );
}
