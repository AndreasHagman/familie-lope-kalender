import { useEffect, useState } from "react";
export default function StravaTodayActivities({ accessToken }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    const fetchActivities = async () => {
      setLoading(true);
      setError("");

      try {
        const today = new Date();
        //const today = new Date("2025-11-22T00:00:00Z"); // testsimulering
        today.setHours(0, 0, 0, 0);
        const after = Math.floor(today.getTime() / 1000);

        const res = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=50`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (!res.ok) throw new Error("Feil ved henting av Strava-data");

        const data = await res.json();
        setActivities(data);
      } catch (err) {
        console.error(err);
        setError("Kunne ikke hente dagens Strava-aktiviteter");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [accessToken]);


  /** Pace-formattering (sekunder per km → mm:ss) */
  const formatPace = (moving_time, distance_meters) => {
    if (!moving_time || !distance_meters || distance_meters === 0) return null;

    const paceSeconds = moving_time / (distance_meters / 1000);
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.floor(paceSeconds % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")} min/km`;
  };


  return (
    <div className="mt-6 p-4 border rounded-lg shadow bg-white">
      <h3 className="font-semibold text-lg mb-3">Dagens Strava-aktiviteter</h3>

      {loading && <p className="text-gray-500">Henter aktiviteter…</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!loading && activities.length === 0 && (
        <p className="text-gray-500 text-sm">Ingen aktiviteter så langt i dag.</p>
      )}

      {activities.length > 0 && (
        <ul className="space-y-4">
          {activities.map((act) => {
            const pace = formatPace(act.moving_time, act.distance);

            return (
              <li key={act.id} className="p-4 border rounded bg-gray-50 shadow-sm">
                <p className="font-semibold text-gray-800">{act.name}</p>

                {act.description && (
                  <p className="text-sm text-gray-700 italic mt-1">
                    {act.description}
                  </p>
                )}

                <p className="text-sm text-gray-600 mt-2">
                  <span className="font-medium">Type:</span> {act.sport_type}
                </p>

                <p className="text-sm text-gray-600">
                  <span className="font-medium">Distanse:</span> {(act.distance / 1000).toFixed(2)} km
                </p>

                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tid:</span> {(act.moving_time / 60).toFixed(0)} min
                </p>

                {pace && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Pace:</span> {pace}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}