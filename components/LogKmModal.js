import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchTodaysStravaActivities } from "../utils/strava";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

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
    if (open && stravaAccessToken && !manualMode) {
      setLoadingStrava(true);

      fetchTodaysStravaActivities(stravaAccessToken, keyWord)
        .then((km) => {
          if (Number(km) > 0) {
            setStravaKm(km);
          } else {
            setStravaKm(null);
          }
        })
        .finally(() => setLoadingStrava(false));
    }
  }, [open, stravaAccessToken, manualMode, keyWord]);

  const handleSubmit = () => {
    const kmValue = manualMode ? Number(kmLogged) : Number(stravaKm);
    if (isNaN(kmValue) || kmValue <= 0) return;

    onSubmit(kmValue);
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
                    {" "} {existingLogForToday} km
                  </span>
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

