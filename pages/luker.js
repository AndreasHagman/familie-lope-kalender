import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../firebase/AuthContext";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import CalendarCard from "../components/CalendarCard";

// Modal-komponent (uendret)
function LogModal({ open, onClose, onSubmit }) {
  const [km, setKm] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]">
      <div className="bg-white rounded-lg p-6 w-80 max-w-full">
        <h2 className="text-xl font-bold mb-4 text-center">Logg løpeturen</h2>

        <input
          type="number"
          min="0"
          value={km}
          onChange={(e) => setKm(e.target.value)}
          placeholder="Antall km"
          className="border rounded px-3 py-2 w-full text-center mb-4"
        />

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-gray-100"
          >
            Avbryt
          </button>

          <button
            onClick={() => onSubmit(Number(km))}
            className="bg-juleRød text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logg km
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Luker() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [dailyKmMap, setDailyKmMap] = useState({});
  const [logData, setLogData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [openedDates, setOpenedDates] = useState({}); // <-- tracker hvilke luker som er snudd

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
    if (!user) return;

    const fetchData = async () => {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName || user.email,
          log: {},
          createdAt: new Date().toISOString(),
        });
      }

      const data = (await getDoc(userRef)).data();
      setLogData(data.log || {});

      const kmRef = doc(db, "config", "dailyKmSelected");
      const kmSnap = await getDoc(kmRef);
      if (kmSnap.exists()) setDailyKmMap(kmSnap.data());
    };

    fetchData();
  }, [user, loading]);

  const handleSubmit = async (kmValue) => {
    if (isNaN(kmValue)) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const newLog = { ...logData, [selectedDate]: kmValue };

      await updateDoc(userRef, { log: newLog });
      setLogData(newLog);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const canOpen = (dateStr) => {
    if (dateStr === today) return false; // dagens luke åpnes kun på dashboard
    if (dateStr < today) return true;    // tidligere datoer kan åpnes
    return false;                         // fremtidige datoer låst
  };

  // Desember 1–24 i år
  const year = new Date().getFullYear();
  const days = Array.from({ length: 24 }).map((_, i) => {
    const day = (i + 1).toString().padStart(2, "0");
    return `${year}-11-${day}`; // desember
  });

  return (
    <div className="relative min-h-screen px-4 sm:px-8 py-6">
      <h2 className="text-3xl fest-title mb-6 text-juleRød text-center">
        Alle luker
      </h2>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
        {days.map((dateStr) => {
          const km = dailyKmMap[dateStr];
          const opened = openedDates[dateStr] || false;

          return (
            <div
              key={dateStr}
              onClick={() => {
                if (!canOpen(dateStr) || km === undefined) return;

                if (!opened) {
                  // Første klikk: snu luken
                  setOpenedDates((prev) => ({ ...prev, [dateStr]: true }));
                } else {
                  // Andre klikk: åpne modal
                  setSelectedDate(dateStr);
                  setModalOpen(true);
                }
              }}
              className={`cursor-pointer transform transition hover:scale-105 ${
                canOpen(dateStr) ? "" : "opacity-40 cursor-not-allowed"
              }`}
            >
              <CalendarCard
                date={dateStr}
                km={km}
                isOpenable={opened}
                small
                forceOpen={opened} 
                showNumericDate={true}
                showDateOnBack={true}
              />
            </div>
          );
        })}
      </div>

      <LogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
