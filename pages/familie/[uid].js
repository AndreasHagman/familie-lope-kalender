import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

export default function FamilieMedlem() {
  const router = useRouter();
  const { uid } = router.query;

  const [userData, setUserData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hent brukerdata
 useEffect(() => {
  if (!uid) return;

  async function fetchData() {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserData(data);

        // log er et objekt: { "dato": { km, time } }
        const logObj = data.log || {};

        // Gjør om til liste
        const logList = Object.entries(logObj).map(([date, entry]) => ({
          date,
          km: entry.km || 0,
          time: entry.time || null,
        }));

        // Sorter nyest først
        logList.sort((a, b) => b.date.localeCompare(a.date));

        setLogs(logList);
      }
    } catch (err) {
      console.error("Feil ved lasting av familiemedlem:", err);
    }

    setLoading(false);
  }

  fetchData();
}, [uid]);

// Beregn statistikk
const totalKm = logs.reduce((sum, l) => sum + Number(l.km || 0), 0).toFixed(1);
const bestDay = logs.length > 0 ? Math.max(...logs.map((l) => l.km)) : 0;
const daysWithActivity = logs.filter((l) => l.km > 0).length;
const avgKm = logs.length > 0 ? (totalKm / logs.length).toFixed(1) : 0;

return (
  <div className="max-w-xl mx-auto p-6">
    <h1 className="text-3xl font-bold mb-4">
      {userData?.displayName || "Familiemedlem"}
    </h1>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="p-4 border rounded shadow text-center">
        <p className="text-2xl font-bold text-juleRød">{totalKm} km</p>
        <p className="text-sm text-gray-600">Totalt i desember</p>
      </div>

      <div className="p-4 border rounded shadow text-center">
        <p className="text-2xl font-bold">{bestDay} km</p>
        <p className="text-sm text-gray-600">Beste dag</p>
      </div>

      <div className="p-4 border rounded shadow text-center">
        <p className="text-2xl font-bold">{daysWithActivity}</p>
        <p className="text-sm text-gray-600">Antall løpedager</p>
      </div>

      <div className="p-4 border rounded shadow text-center">
        <p className="text-2xl font-bold">{avgKm} km</p>
        <p className="text-sm text-gray-600">Snitt per dag</p>
      </div>
    </div>

    {/* Liste over loggede km */}
    <h2 className="text-xl font-bold mb-2">Dagslogg</h2>

    <div className="space-y-2">
      {logs.map((l) => (
        <div key={l.date} className="p-3 border rounded bg-gray-50">
          <p>
            <span className="font-semibold">{l.date}</span> — {l.km} km
            {l.time && (
              <span className="text-gray-500 ml-2">({new Date(l.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })})</span>
            )}
          </p>
        </div>
      ))}
    </div>
  </div>
);
}
