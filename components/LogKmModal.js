import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTodaysStravaActivities } from "../utils/stravaClient";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getValidStravaAccessToken } from "../utils/stravaAuth";

export default function LogKmModal({
  open,
  onClose,
  onSubmit,
  existingLogForToday,
  stravaAccessToken,
  user,
}) {
  const [kmLogged, setKmLogged] = useState("");
  const [stravaKm, setStravaKm] = useState(null);
  const [loadingStrava, setLoadingStrava] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [keyWord, setKeyWord] = useState("luke"); // fallback
  const [stravaTime, setStravaTime] = useState(null);

  const switchToManual = () => {
  setManualMode(true);
  setStravaKm(null);
};

 // 🔥 Hent keyword fra bruker-dokument
  useEffect(() => {
    if (!user) return;
    const fetchKeyword = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const snap = await getDoc(docRef);
        setKeyWord(snap.data()?.stravaKeyWord || "");
      } catch (err) {
        console.error("Feil ved henting av Strava keyword:", err);
      }
    };
    fetchKeyword();
  }, [user]);

  // 🔹 Hent Strava-data ved åpning
  useEffect(() => {
  async function run() {
    if (open && stravaAccessToken && !manualMode) {
      setLoadingStrava(true);

      const validToken = await getValidStravaAccessToken(user.uid);
      const result = await fetchTodaysStravaActivities(validToken, keyWord);

      if (result) {
        setStravaKm(result.km);
        setStravaTime(result.time);
      } else {
        setStravaKm(null);
        setStravaTime(null);
      }

      setLoadingStrava(false);
    }
  }

  run();
}, [open, stravaAccessToken, manualMode, keyWord]);

  function getLocalIsoDateTime() {
    const now = new Date();
    
    // Lag ISO med lokal tid, 24-timers format, uten timezone-justering
    const pad = (n) => n.toString().padStart(2, "0");

    const YYYY = now.getFullYear();
    const MM = pad(now.getMonth() + 1);
    const DD = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const ss = pad(now.getSeconds());

    return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}`; // "YYYY-MM-DDTHH:mm:ss"
  }

  const handleSubmit = () => {
    const kmValue = manualMode ? Number(kmLogged) : Number(stravaKm);
    if (isNaN(kmValue) || kmValue <= 0) return;

    // ⏱ Sett tidspunkt
  const timeValue = manualMode
    ? getLocalIsoDateTime()
    : stravaTime || getLocalIsoDateTime(); // fallback hvis Strava mangler tid

    onSubmit(kmValue, timeValue);
    setKmLogged("");
    setStravaKm(null);
    setManualMode(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
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
            {/* Eksisterende logg for dagens dato */}
            <div className="mb-4 text-center">
              {existingLogForToday !== undefined ? (
                <p className="text-sm text-gray-700">
                  Du har allerede registrert:  
                  <span className="font-bold text-juleRød">
                    {" "}{existingLogForToday.km} km
                  </span>
                  {" "}kl {new Date(existingLogForToday.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  Ingen data registrert for i dag.
                </p>
              )}
            </div>

            <h2 className="text-xl font-bold mb-4 text-center">Logg løpeturen</h2>

            {/* Strava feedback */}
            {stravaAccessToken && (
            <div className="mb-4 text-center">
                {loadingStrava ? (
                <p className="text-gray-500">Henter Strava-data…</p>
                ) : stravaKm !== null ? (
                <p className="text-green-700 font-semibold">
                    🏃‍♂️ Strava-aktivitet funnet: <span className="font-bold">{stravaKm} km</span>
                </p>
                ) : (
                <p className="text-sm text-gray-500">
                    Ingen Strava-aktiviteter funnet for i dag med nøkkelordet "{keyWord}".
                </p>
                )}

                {/* Alltid vis knapp for manuell logging */}
                {(!manualMode) && (
                <button
                onClick={() => setManualMode(true)}
                className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
                >
                Logg manuelt i stedet
                </button>
                )}
            </div>
            )}

            {/* Manuell input */}
            {(manualMode || !stravaAccessToken) && (
            <input
                type="number"
                min="0"
                value={kmLogged}
                onChange={(e) => setKmLogged(e.target.value)}
                placeholder="Antall km"
                className="border rounded px-3 py-2 w-full text-center mb-4"
            />
            )}

            <div className="flex justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded border hover:bg-gray-100"
              >
                Avbryt
              </button>
              <button
                onClick={handleSubmit}
                className="bg-juleRød text-white px-4 py-2 rounded hover:bg-red-700"
              >
                {manualMode || !stravaAccessToken ? "Logg km" : "Bekreft"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

