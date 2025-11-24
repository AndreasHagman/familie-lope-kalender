import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../firebase/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import CalendarCard from "../components/CalendarCard";

function LogModal({ open, onClose, onSubmit, existingValue }) {
  const [km, setKm] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-6 w-80 max-w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="mb-4 text-center">
              {existingValue !== undefined ? (
                <p className="text-sm text-gray-700">
                  Du har allerede registrert:
                  <span className="font-bold text-juleRød"> {existingValue.km} km</span><br/>
                  <span className="text-gray-500 text-xs">
                    Registrert:{" "}
                    {new Date(existingValue.time).toLocaleDateString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Ingen data registrert for denne dagen.
                </p>
              )}
            </div>

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
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Luker() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [dailyKmMap, setDailyKmMap] = useState({});
  const [logData, setLogData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [openedDates, setOpenedDates] = useState({});

  const today = new Date().toISOString().slice(0, 10);
  //const today = "2025-11-24"; 

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

      // Åpne automatisk alle luker med registrert km
      const initialOpened = {};
      Object.keys(data.log || {}).forEach((date) => {
        initialOpened[date] = true;
      });
      setOpenedDates(initialOpened);

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

      const newLogEntry = {
        km: kmValue,
        time: new Date().toISOString(),
      };

      const newLog = { ...logData, [selectedDate]: newLogEntry };

      await updateDoc(userRef, { log: newLog });
      setLogData(newLog);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const canOpen = (dateStr) => {
    if (dateStr === today) return false;
    if (dateStr < today) return true;
    return false;
  };

  // 1–24 desember
  const year = new Date().getFullYear();
  const days = Array.from({ length: 24 }).map((_, i) => {
    const day = (i + 1).toString().padStart(2, "0");
    //return `${year}-11-${day}`;
    return `${year}-12-${day}`;
  });

  return (
    <div className="relative h-full px-4 sm:px-8 py-2 overflow-hidden no-scroll">
      <h2 className="text-3xl fest-title mb-6 text-juleRød text-center">Alle luker</h2>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
        {days.map((dateStr) => {
          const km = dailyKmMap[dateStr];
          const hasLoggedKm = logData[dateStr] !== undefined;
          const opened = openedDates[dateStr] || hasLoggedKm;

          return (
            <div
              key={dateStr}
              className={`cursor-pointer transform transition hover:scale-105 ${canOpen(dateStr) ? "" : "opacity-40 cursor-not-allowed"}`}
              onClick={() => {
                if (!canOpen(dateStr) || km === undefined) return;

                if (!opened) {
                  setOpenedDates((prev) => ({ ...prev, [dateStr]: true }));
                } else {
                  setSelectedDate(dateStr);
                  setModalOpen(true);
                }
              }}
            >
              <CalendarCard
                date={dateStr}
                km={km}
                small
                isOpen={opened}
                openTrigger={opened ? 1 : 0} 
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
        existingValue={logData[selectedDate]}
      />
    </div>
  );
}
