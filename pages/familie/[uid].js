import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../firebase/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

// Bekreftelsesmodal for sletting
function DeleteConfirmModal({ open, onClose, onConfirm, date, km }) {
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState(1); // 1 = første bekreftelse, 2 = skriv "SLETT"

  const handleClose = () => {
    setConfirmText("");
    setStep(1);
    onClose();
  };

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && confirmText === "SLETT") {
      onConfirm();
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[100]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-lg p-6 w-90 max-w-md mx-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {step === 1 ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-center text-red-600">
                  Bekreft sletting
                </h2>
                <p className="text-center mb-4">
                  Er du sikker på at du vil slette løpeturen fra{" "}
                  <span className="font-semibold">{date}</span> ({km} km)?
                </p>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Denne handlingen kan ikke angres.
                </p>
                <div className="flex justify-between gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded border hover:bg-gray-100 flex-1"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex-1"
                  >
                    Fortsett
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-center text-red-600">
                  Siste bekreftelse
                </h2>
                <p className="text-center mb-4">
                  Skriv <span className="font-bold text-red-600">SLETT</span> for å bekrefte:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Skriv SLETT"
                  className="border rounded px-3 py-2 w-full text-center mb-6 uppercase"
                  autoFocus
                />
                <div className="flex justify-between gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded border hover:bg-gray-100 flex-1"
                  >
                    Avbryt
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={confirmText !== "SLETT"}
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Slett permanent
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function FamilieMedlem() {
  const router = useRouter();
  const { uid } = router.query;
  const { user } = useAuth();

  const [userData, setUserData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);

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

  // Sjekk om brukeren er på sin egen side
  const isOwnProfile = user && uid === user.uid;

  // Håndter sletting av logg
  const handleDeleteClick = (log) => {
    setLogToDelete(log);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!logToDelete || !isOwnProfile) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const currentData = userData?.log || {};
      
      // Fjern loggen for den valgte datoen
      const { [logToDelete.date]: removed, ...remainingLogs } = currentData;

      // Oppdater Firestore
      await updateDoc(userRef, {
        log: remainingLogs,
      });

      // Oppdater lokal state
      setUserData((prev) => ({
        ...prev,
        log: remainingLogs,
      }));

      // Oppdater logs-listen
      setLogs((prev) => prev.filter((l) => l.date !== logToDelete.date));

      setDeleteModalOpen(false);
      setLogToDelete(null);
    } catch (err) {
      console.error("Feil ved sletting av logg:", err);
      alert("Kunne ikke slette loggen. Prøv igjen.");
    }
  };

// Beregn statistikk
const totalKm = logs.reduce((sum, l) => sum + Number(l.km || 0), 0).toFixed(1);
const bestDay = logs.length > 0 ? Math.max(...logs.map((l) => l.km)) : 0;
const daysWithActivity = logs.filter((l) => l.km > 0).length;
const avgKm = logs.length > 0 ? (totalKm / logs.length).toFixed(1) : 0;

return (
  <div className="max-w-xl mx-auto p-2">
        <button
      onClick={() => router.back()}
      className="mb-4 flex items-center text-juleRød hover:underline"
    >
      ← Tilbake
    </button>
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
        <div
          key={l.date}
          className="p-3 border rounded bg-gray-50 flex items-center justify-between"
        >
          <p className="flex-1">
            <span className="font-semibold">{l.date}</span> — {l.km} km
            {l.time && (
              <span className="text-gray-500 ml-2">
                (Registrert:{" "}
                {new Date(l.time).toLocaleDateString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })})
              </span>
            )}
          </p>
          {isOwnProfile && (
            <button
              onClick={() => handleDeleteClick(l)}
              className="ml-3 px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 transition"
              title="Slett denne loggen"
            >
              🗑️
            </button>
          )}
        </div>
      ))}
    </div>

    {/* Bekreftelsesmodal for sletting */}
    <DeleteConfirmModal
      open={deleteModalOpen}
      onClose={() => {
        setDeleteModalOpen(false);
        setLogToDelete(null);
      }}
      onConfirm={handleDeleteConfirm}
      date={logToDelete?.date || ""}
      km={logToDelete?.km || 0}
    />
  </div>
);
}
